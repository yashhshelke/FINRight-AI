from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from transactions.models import Transaction
from gamification.models import Challenge, UserChallenge
from gamification.services import evaluate_streaks_and_challenges

User = get_user_model()

class GamificationServicesTests(TestCase):
    def setUp(self):
        # Create a test user with 30,000 income (daily budget approx 1000)
        self.user = User.objects.create_user(
            username='gametestuser', 
            email='gametest@example.com', 
            password='password123',
            income=Decimal('30000.00')
        )
        
        # Create Global Challenges
        self.budget_challenge = Challenge.objects.create(
            title="Stay Under Budget", 
            description="Spend less than your daily limit.", 
            category="Tracking"
        )
        self.swiggy_challenge = Challenge.objects.create(
            title="No Swiggy for 7 Days", 
            description="Avoid ordering food delivery.", 
            category="Savings"
        )
        
        # Subscribe user to challenges
        self.user_budget_challenge = UserChallenge.objects.create(
            user=self.user, 
            challenge=self.budget_challenge,
            streak=2  # starts with an existing streak
        )
        self.user_swiggy_challenge = UserChallenge.objects.create(
            user=self.user, 
            challenge=self.swiggy_challenge,
            streak=5  # starts with an existing streak
        )

    def test_evaluate_streaks_success(self):
        """Test streaks increment when user meets challenge criteria (under budget, no food)."""
        now = timezone.now()
        yesterday = now - timedelta(days=1)
        
        # Add a valid transaction that keeps them under the 1000 daily budget and is not food
        Transaction.objects.create(
            user=self.user, 
            amount=Decimal('500.00'), 
            type="expense", 
            category="Utilities", 
            description="Electricity Bill", 
            date=yesterday
        )
        
        # Run evaluation
        res = evaluate_streaks_and_challenges(self.user)
        self.assertEqual(res["updated_challenges"], 2)
        
        # Refresh from DB
        self.user_budget_challenge.refresh_from_db()
        self.user_swiggy_challenge.refresh_from_db()
        
        # Streaks should have increased by 1
        self.assertEqual(self.user_budget_challenge.streak, 3)
        self.assertEqual(self.user_swiggy_challenge.streak, 6)
        
        # Completed flag should be True
        self.assertTrue(self.user_budget_challenge.completed)

    def test_evaluate_streaks_failure(self):
        """Test streaks reset to 0 when user fails challenge criteria."""
        now = timezone.now()
        yesterday = now - timedelta(days=1)
        
        # Add an expensive Swiggy order that breaks both budget (>1000) and food delivery rule
        Transaction.objects.create(
            user=self.user, 
            amount=Decimal('1500.00'), 
            type="expense", 
            category="Food", 
            description="Swiggy Party Order", 
            date=yesterday
        )
        
        # Run evaluation
        res = evaluate_streaks_and_challenges(self.user)
        self.assertEqual(res["updated_challenges"], 2)
        
        # Refresh from DB
        self.user_budget_challenge.refresh_from_db()
        self.user_swiggy_challenge.refresh_from_db()
        
        # Streaks should have reset to 0
        self.assertEqual(self.user_budget_challenge.streak, 0)
        self.assertEqual(self.user_swiggy_challenge.streak, 0)
        
        # Completed flag should be False
        self.assertFalse(self.user_budget_challenge.completed)

    def test_evaluate_streaks_already_incremented_today(self):
        """Test that running the function twice in a day does not double-increment."""
        now = timezone.now()
        yesterday = now - timedelta(days=1)
        
        Transaction.objects.create(
            user=self.user, 
            amount=Decimal('100.00'), 
            type="expense", 
            category="Transport", 
            description="Bus Ticket", 
            date=yesterday
        )
        
        # First run
        evaluate_streaks_and_challenges(self.user)
        self.user_budget_challenge.refresh_from_db()
        self.assertEqual(self.user_budget_challenge.streak, 3)
        
        # Second run (same day)
        res2 = evaluate_streaks_and_challenges(self.user)
        # Should not update anything because it was already toggled today
        self.assertEqual(res2["updated_challenges"], 0)
        
        self.user_budget_challenge.refresh_from_db()
        # Streak remains 3, not 4
        self.assertEqual(self.user_budget_challenge.streak, 3)
