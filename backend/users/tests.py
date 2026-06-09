from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from users.models import Notification

User = get_user_model()

class UserAuthenticationTests(APITestCase):
    def setUp(self):
        self.register_url = '/auth/register/'
        self.login_url = '/auth/login/'
        self.refresh_url = '/auth/refresh/'

        self.user_data = {
            'full_name': 'Test User',
            'email': 'testuser@example.com',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
        }

    def test_user_registration(self):
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_user_registration_mismatched_passwords(self):
        data = self.user_data.copy()
        data['password_confirm'] = 'DifferentPassword123!'
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_user_login_and_refresh(self):
        self.client.post(self.register_url, self.user_data, format='json')
        login_res = self.client.post(self.login_url, {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }, format='json')
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        
        refresh_token = login_res.data['refresh']
        
        # Test Refresh
        refresh_res = self.client.post(self.refresh_url, {'refresh': refresh_token}, format='json')
        self.assertEqual(refresh_res.status_code, status.HTTP_200_OK)
        self.assertIn('access', refresh_res.data)

    def test_user_login_invalid_credentials(self):
        self.client.post(self.register_url, self.user_data, format='json')
        response = self.client.post(self.login_url, {
            'email': self.user_data['email'],
            'password': 'WrongPassword!'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserProfileTests(APITestCase):
    def setUp(self):
        self.register_url = '/auth/register/'
        self.login_url = '/auth/login/'
        self.profile_url = '/auth/me/'
        self.profile_update_url = '/auth/profile/update/'

        self.user_data = {
            'full_name': 'Profile User',
            'email': 'profile@example.com',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
        }
        
        self.client.post(self.register_url, self.user_data, format='json')
        login_res = self.client.post(self.login_url, {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }, format='json')
        
        self.token = login_res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

    def test_get_user_profile(self):
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.user_data['email'])

    def test_update_user_profile(self):
        update_data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'income': '55000.00'
        }
        response = self.client.put(self.profile_update_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        user = User.objects.get(email=self.user_data['email'])
        self.assertEqual(user.first_name, 'Updated')
        self.assertEqual(str(user.income), '55000.00')


class UserPasswordResetTests(APITestCase):
    def setUp(self):
        self.register_url = '/auth/register/'
        self.forgot_url = '/auth/forgot-password/'
        self.reset_url = '/auth/reset-password/'

        self.user_data = {
            'full_name': 'Reset User',
            'email': 'reset@example.com',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
        }
        self.client.post(self.register_url, self.user_data, format='json')

    def test_forgot_password(self):
        response = self.client.post(self.forgot_url, {'email': self.user_data['email']}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # User should now have a token
        user = User.objects.get(email=self.user_data['email'])
        self.assertIsNotNone(user.password_reset_token)

        # Test Reset
        reset_res = self.client.post(self.reset_url, {
            'token': user.password_reset_token,
            'password': 'NewPassword123!',
            'password_confirm': 'NewPassword123!'
        }, format='json')
        self.assertEqual(reset_res.status_code, status.HTTP_200_OK)


class UserEmailVerificationTests(APITestCase):
    def setUp(self):
        self.register_url = '/auth/register/'
        self.verify_url = '/auth/verify-email/'
        self.send_url = '/auth/send-verification-email/'

        self.user_data = {
            'full_name': 'Verify User',
            'email': 'verify@example.com',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
        }
        self.client.post(self.register_url, self.user_data, format='json')
        self.user = User.objects.get(email=self.user_data['email'])
        self.user.generate_email_verification_token()

    def test_verify_email(self):
        response = self.client.post(self.verify_url, {'token': self.user.email_verification_token}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.user.refresh_from_db()
        self.assertTrue(self.user.email_verified)
        self.assertIsNone(self.user.email_verification_token)

    def test_send_verification_email(self):
        response = self.client.post(self.send_url, {'email': self.user.email}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class NotificationTests(APITestCase):
    def setUp(self):
        self.user_data = {
            'full_name': 'Notify User',
            'email': 'notify@example.com',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
        }
        self.client.post('/auth/register/', self.user_data, format='json')
        self.user = User.objects.get(email=self.user_data['email'])
        
        # Login
        login_res = self.client.post('/auth/login/', {'email': self.user.email, 'password': 'SecurePassword123!'}, format='json')
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + login_res.data['access'])
        
        # Create notification
        self.notif = Notification.objects.create(
            user=self.user,
            title='Test',
            message='Msg'
        )

    def test_list_and_read_notifications(self):
        # List
        res1 = self.client.get('/auth/notifications/')
        self.assertGreaterEqual(len(res1.data), 1)

        # Mark read
        res2 = self.client.post(f'/auth/notifications/{self.notif.id}/read/')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.notif.refresh_from_db()
        self.assertTrue(self.notif.is_read)

        # Mark all read
        res3 = self.client.post('/auth/notifications/mark-all-read/')
        self.assertEqual(res3.status_code, status.HTTP_200_OK)

        # Delete
        res4 = self.client.delete(f'/auth/notifications/{self.notif.id}/delete/')
        self.assertEqual(res4.status_code, status.HTTP_204_NO_CONTENT)


class OnboardingAndSettingsTests(APITestCase):
    def setUp(self):
        self.user_data = {
            'full_name': 'Settings User',
            'email': 'settings@example.com',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
        }
        self.client.post('/auth/register/', self.user_data, format='json')
        login_res = self.client.post('/auth/login/', {'email': self.user_data['email'], 'password': self.user_data['password']}, format='json')
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + login_res.data['access'])
        self.user = User.objects.get(email=self.user_data['email'])

    def test_onboarding(self):
        onboarding_data = {
            'first_name': 'Jane',
            'last_name': 'Doe',
            'monthly_income': '100000.00',
            'spending': [
                {'category': 'Rent', 'amount': '25000.00'}
            ]
        }
        res = self.client.post('/auth/onboarding/', onboarding_data, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        self.user.refresh_from_db()
        self.assertTrue(self.user.onboarding_completed)
        self.assertEqual(str(self.user.income), '100000.00')

    def test_purchase_credits(self):
        res = self.client.post('/auth/purchase-credits/', {'plan_id': 'pro'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['credits_added'], 200000)

    def test_user_settings(self):
        res = self.client.patch('/auth/settings/', {'dark_mode': True}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['dark_mode'], True)

    def test_change_password(self):
        data = {
            'old_password': 'SecurePassword123!',
            'new_password': 'BrandNewPassword456!',
            'new_password_confirm': 'BrandNewPassword456!'
        }
        res = self.client.post('/auth/change-password/', data, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('BrandNewPassword456!'))
