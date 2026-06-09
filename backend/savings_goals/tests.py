from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from rest_framework.test import APIClient
from rest_framework import status

from savings_goals.models import SavingsGoal, GoalPlanAnalysis

User = get_user_model()

class SavingsGoalModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='sguser', email='sg@example.com', password='pw')

    def test_goal_properties(self):
        goal = SavingsGoal.objects.create(
            user=self.user,
            title='Car',
            target_amount=Decimal('10000.00'),
            current_amount=Decimal('2500.00'),
            monthly_contribution=Decimal('500.00'),
            deadline=timezone.now().date() + timedelta(days=150) # ~5 months
        )
        self.assertEqual(goal.progress_percentage, 25.0)
        self.assertEqual(goal.status, 'in_progress')
        self.assertEqual(goal.remaining_amount, 7500.0)
        self.assertGreaterEqual(goal.months_left, 5)
        self.assertGreater(goal.required_monthly, 0)
        
        # Test completion
        goal.current_amount = Decimal('10000.00')
        goal.save()
        self.assertEqual(goal.progress_percentage, 100.0)
        self.assertEqual(goal.status, 'completed')

    def test_goal_plan_analysis_str(self):
        analysis = GoalPlanAnalysis.objects.create(user=self.user, analysis_data={"key": "value"})
        self.assertTrue(str(analysis).startswith("AIGoalPlanner"))
        self.assertEqual(str(goal := SavingsGoal.objects.create(user=self.user, title='Test')), f"{self.user.email} - Test")

class SavingsGoalAPITests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='sguser2', email='sg2@example.com', password='pw')
        self.client = APIClient()
        login_res = self.client.post('/auth/login/', {'email': 'sg2@example.com', 'password': 'pw'})
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + login_res.data['access'])

    def test_list_create_goal(self):
        response = self.client.post('/api/goals/', {
            'title': 'House',
            'target_amount': '50000.00'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(SavingsGoal.objects.count(), 1)
        
        res_list = self.client.get('/api/goals/')
        self.assertEqual(len(res_list.data), 1)

    def test_update_goal_milestones(self):
        goal = SavingsGoal.objects.create(
            user=self.user, title='Laptop', target_amount=Decimal('1000.00'), current_amount=Decimal('0.00')
        )
        # Update to 30% (trigger 25% milestone)
        res = self.client.patch(f'/api/goals/{goal.id}/', {'current_amount': '300.00'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        # Update to 100% (trigger completion)
        res = self.client.patch(f'/api/goals/{goal.id}/', {'current_amount': '1000.00'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        goal.refresh_from_db()
        self.assertEqual(goal.status, 'completed')
        
        # Test Delete
        res = self.client.delete(f'/api/goals/{goal.id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(SavingsGoal.objects.count(), 0)
