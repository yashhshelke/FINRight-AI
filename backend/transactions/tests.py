from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
from transactions.models import Transaction

User = get_user_model()

class TransactionAPITests(APITestCase):
    def setUp(self):
        # Setup User and Auth
        self.user_data = {
            'username': 'txuser',
            'email': 'tx@example.com',
            'password': 'SecurePassword123!',
            'income': Decimal('50000.00')
        }
        self.user = User.objects.create_user(**self.user_data)
        
        login_res = self.client.post('/auth/login/', {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }, format='json')
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + login_res.data['access'])

        # URLs
        self.list_url = '/api/transactions/'
        self.bulk_url = '/api/transactions/bulk/'
        self.summary_url = '/api/transactions/summary/'

    def test_create_transaction(self):
        """Test user can create a transaction and it triggers cache deletion"""
        data = {
            'amount': '1500.00',
            'type': 'expense',
            'category': 'Food',
            'description': 'Grocery Store'
        }
        res = self.client.post(self.list_url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Transaction.objects.count(), 1)
        
        tx = Transaction.objects.first()
        # Verify custom EncryptedDecimalField works securely
        self.assertEqual(tx.amount, Decimal('1500.00'))
        self.assertEqual(tx.category, 'Food')

    def test_list_transactions(self):
        """Test retrieving transactions and filtering by category"""
        now = timezone.now()
        Transaction.objects.create(user=self.user, amount=Decimal('500.00'), type='expense', category='Food', date=now)
        Transaction.objects.create(user=self.user, amount=Decimal('1000.00'), type='expense', category='Transport', date=now)
        
        res = self.client.get(self.list_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data) if isinstance(res.data, dict) else res.data
        self.assertEqual(len(results), 2)
        
        # Test category filter
        res_filter = self.client.get(self.list_url + '?category=Food')
        self.assertEqual(res_filter.status_code, status.HTTP_200_OK)
        filter_results = res_filter.data.get('results', res_filter.data) if isinstance(res_filter.data, dict) else res_filter.data
        self.assertEqual(len(filter_results), 1)
        self.assertEqual(filter_results[0]['category'], 'Food')

    def test_bulk_create_transactions(self):
        """Test bulk creation (e.g. from PDF parsing)"""
        data = [
            {'amount': '100.00', 'type': 'expense', 'category': 'Transport', 'description': 'Uber'},
            {'amount': '200.00', 'type': 'expense', 'category': 'Food', 'description': 'Lunch'}
        ]
        res = self.client.post(self.bulk_url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Transaction.objects.count(), 2)

    def test_transaction_summary(self):
        """Test transaction summary aggregates income, expense, and categories correctly"""
        now = timezone.now()
        Transaction.objects.create(user=self.user, amount=Decimal('10000.00'), type='income', category='Salary', date=now)
        Transaction.objects.create(user=self.user, amount=Decimal('2000.00'), type='expense', category='Food', date=now)
        Transaction.objects.create(user=self.user, amount=Decimal('1500.00'), type='expense', category='Food', date=now)
        Transaction.objects.create(user=self.user, amount=Decimal('500.00'), type='expense', category='Transport', date=now)
        
        res = self.client.get(self.summary_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        data = res.data
        self.assertEqual(data['transaction_income'], 10000.0)
        self.assertEqual(data['total_expense'], 4000.0)
        
        # Verify categories are grouped and sorted by amount descending
        categories = data['categories']
        self.assertEqual(len(categories), 2)
        self.assertEqual(categories[0]['name'], 'Food')
        self.assertEqual(categories[0]['amount'], 3500.0)
        self.assertEqual(categories[1]['name'], 'Transport')
        self.assertEqual(categories[1]['amount'], 500.0)

    def test_unauthorized_access(self):
        """Ensure endpoints are protected"""
        self.client.credentials() # Remove token
        
        res1 = self.client.get(self.list_url)
        self.assertEqual(res1.status_code, status.HTTP_401_UNAUTHORIZED)
        
        res2 = self.client.post(self.bulk_url, [], format='json')
        self.assertEqual(res2.status_code, status.HTTP_401_UNAUTHORIZED)
