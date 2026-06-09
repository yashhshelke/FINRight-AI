from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from reports.models import FinancialReport
from reports.services.report_generator import generate_monthly_report
from reports.services.story_generator import _parse_month_value, generate_money_replay
from transactions.models import Transaction

User = get_user_model()

class ReportServicesTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='repuser', email='rep@example.com', password='pw')

    def test_generate_monthly_report(self):
        Transaction.objects.create(user=self.user, type='income', amount=Decimal('5000.00'), category='Salary', date=timezone.now())
        Transaction.objects.create(user=self.user, type='expense', amount=Decimal('1000.00'), category='Rent', date=timezone.now())
        
        report_data = generate_monthly_report(self.user)
        self.assertEqual(report_data['summary']['total_income'], 5000.0)
        self.assertEqual(report_data['summary']['total_expense'], 1000.0)
        self.assertEqual(report_data['summary']['net_savings'], 4000.0)
        self.assertTrue(len(report_data['categories']) > 0)

    def test_story_generator_parsing(self):
        # Test valid parsing
        dt = _parse_month_value("2025-10-15T00:00:00")
        self.assertIsNotNone(dt)
        # Test invalid parsing
        dt_invalid = _parse_month_value("invalid-date")
        self.assertIsNone(dt_invalid)

class ReportAPITests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='repuser2', email='rep2@example.com', password='pw')
        self.client = APIClient()
        login_res = self.client.post('/auth/login/', {'email': 'rep2@example.com', 'password': 'pw'})
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + login_res.data['access'])

    def test_list_create_report(self):
        res = self.client.post('/api/reports/')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(FinancialReport.objects.count(), 1)
        self.assertEqual(res.data['report_type'], 'monthly')
        
        # Test Listing
        res_list = self.client.get('/api/reports/')
        self.assertEqual(len(res_list.data), 1)

    def test_money_replay_api(self):
        res = self.client.get('/api/reports/money-replay/?month=2025-01-01T00:00:00')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('report_id', res.data)
        self.assertIn('title', res.data)
        
        report = FinancialReport.objects.get(id=res.data['report_id'])
        self.assertEqual(report.report_type, 'money_replay')
        self.assertTrue(str(report).startswith(self.user.email))
