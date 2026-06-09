from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from transactions.models import Transaction
from ai_assistant.services.financial_engine import (
    calculate_required_sip,
    get_financial_health_score,
    get_subscription_hunter,
    get_daily_briefing,
    get_affordability_analysis
)
from unittest.mock import patch

User = get_user_model()

class FinancialEngineTests(TestCase):
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(
            username='testuser', 
            email='test@example.com', 
            password='password123',
            income=Decimal('100000.00')
        )

    def test_calculate_required_sip(self):
        """Test the pure math function for SIP calculations"""
        # Test Case 1: 0% return (pure division)
        res = calculate_required_sip(target_amount=120000, years=1, current_amount=0, expected_annual_return_pct=0)
        self.assertAlmostEqual(res["required_sip"], 10000.0)
        self.assertEqual(res["months"], 12)
        
        # Test Case 2: Standard positive return (e.g., 10 Lakhs in 10 years at 12%)
        # Approximate required SIP for 10L in 10 yrs at 12% is ~4304
        res2 = calculate_required_sip(target_amount=1000000, years=10, current_amount=0, expected_annual_return_pct=12)
        self.assertTrue(4000 < res2["required_sip"] < 4500)
        
        # Test Case 3: Already reached target
        res3 = calculate_required_sip(target_amount=100000, years=5, current_amount=150000, expected_annual_return_pct=10)
        self.assertEqual(res3["required_sip"], 0.0)

    def test_subscription_hunter(self):
        """Test subscription pattern detection"""
        now = timezone.now()
        
        # Add 3 transactions for Netflix over 3 months
        Transaction.objects.create(user=self.user, amount=Decimal('499.00'), type="expense", category="Entertainment", description="Netflix Subscription", date=now)
        Transaction.objects.create(user=self.user, amount=Decimal('499.00'), type="expense", category="Entertainment", description="Netflix", date=now - timedelta(days=30))
        Transaction.objects.create(user=self.user, amount=Decimal('499.00'), type="expense", category="Entertainment", description="Netflix Inc", date=now - timedelta(days=60))
        
        # Add 1 transaction for Amazon Prime (should not be detected as recurring if only 1 occurrence, but let's see how the engine handles it)
        # Actually the engine looks at aliases and counts occurrences. 
        Transaction.objects.create(user=self.user, amount=Decimal('1499.00'), type="expense", category="Entertainment", description="Amazon Prime", date=now - timedelta(days=120))
        
        result = get_subscription_hunter(self.user, lookback_days=180)
        
        # Should detect Netflix
        netflix_sub = next((s for s in result["subscriptions"] if s["brand"] == "Netflix"), None)
        self.assertIsNotNone(netflix_sub)
        self.assertEqual(netflix_sub["occurrences"], 3)
        self.assertAlmostEqual(netflix_sub["estimated_monthly_cost"], 499.0)
        self.assertEqual(netflix_sub["status"], "active")
        
        # Should detect Prime Video as inactive (since it's > 30 days old and we have at least 1 hit)
        prime_sub = next((s for s in result["subscriptions"] if s["brand"] == "Prime Video"), None)
        self.assertIsNotNone(prime_sub)
        self.assertTrue(prime_sub["cancel_recommended"])

    def test_financial_health_score(self):
        """Test health score computation handles normal and edge cases without crashing"""
        # Baseline score with 0 transactions
        health = get_financial_health_score(self.user)
        self.assertIn("score", health)
        self.assertTrue(0 <= health["score"] <= 100)
        
        # Add some income and expenses
        now = timezone.now()
        Transaction.objects.create(user=self.user, amount=Decimal('100000.00'), type="income", category="Salary", date=now)
        Transaction.objects.create(user=self.user, amount=Decimal('40000.00'), type="expense", category="Rent", date=now)
        Transaction.objects.create(user=self.user, amount=Decimal('10000.00'), type="expense", category="Food", date=now)
        
        health2 = get_financial_health_score(self.user)
        self.assertIn("score", health2)
        
        # With 50% savings rate and no debt, the score should improve
        self.assertGreater(health2["score"], 0)

    def test_daily_briefing(self):
        """Test daily briefing logic specifically catching Swiggy transactions"""
        now = timezone.now()
        yesterday = now - timedelta(days=1)
        
        # Add a Swiggy transaction yesterday
        Transaction.objects.create(user=self.user, amount=Decimal('420.00'), type="expense", category="Food", description="Swiggy Delivery", date=yesterday)
        
        briefing = get_daily_briefing(self.user)
        self.assertEqual(briefing["yesterday_spent"], 420.0)
        self.assertIn("food delivery", briefing["recommendation"].lower())

    @patch('ai_assistant.services.financial_engine.get_cashflow_analysis')
    def test_affordability_analysis_outright(self, mock_cashflow):
        """Test Future Self Simulator for an outright purchase (Laptop)"""
        # Mock cashflow so we have a predictable 10,000 monthly disposable income
        mock_cashflow.return_value = {'avg_monthly_savings': 10000, 'avg_monthly_expenses': 30000}
        
        now = timezone.now()
        Transaction.objects.create(user=self.user, amount=Decimal('100000.00'), type="income", category="Salary", date=now - timedelta(days=60))
        Transaction.objects.create(user=self.user, amount=Decimal('30000.00'), type="expense", category="Rent", date=now - timedelta(days=60))
        
        # User has 70,000 savings. Target is 1,00,000. Need 30,000 more. At 10k/month, it takes 3 months.
        res = get_affordability_analysis(self.user, target_amount=100000, item_name="Laptop")
        self.assertFalse(res["is_affordable"])
        self.assertEqual(res["projected_months_to_save"], 3.0)
        self.assertEqual(res["current_savings"], 70000)

    @patch('ai_assistant.services.financial_engine.get_cashflow_analysis')
    def test_affordability_analysis_emi(self, mock_cashflow):
        """Test Future Self Simulator for an EMI purchase (Bike)"""
        # Mock cashflow so we have a predictable 10,000 monthly disposable income
        mock_cashflow.return_value = {'avg_monthly_savings': 10000, 'avg_monthly_expenses': 30000}
        
        now = timezone.now()
        Transaction.objects.create(user=self.user, amount=Decimal('100000.00'), type="income", category="Salary", date=now)
        Transaction.objects.create(user=self.user, amount=Decimal('30000.00'), type="expense", category="Rent", date=now)
        
        # EMI is 5000 / month. Disposable is 10000. It is affordable.
        res = get_affordability_analysis(self.user, target_amount=5000, item_name="Bike EMI", is_emi=True, emi_months=1)
        self.assertTrue(res["is_affordable"])
        self.assertIn("comfortably afford", res["analysis_message"])
