from django.test import TransactionTestCase
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from core.asgi import application
from ai_assistant.models import ChatSession, ChatMessage
from asgiref.sync import sync_to_async
from unittest.mock import patch

User = get_user_model()

class TestDocumentChatConsumer(TransactionTestCase):

    async def test_unauthenticated_connection(self):
        communicator = WebsocketCommunicator(application, "/ws/ai/chat/")
        connected, subprotocol = await communicator.connect()
        # Expecting to be rejected (code 4001)
        self.assertFalse(connected)

    async def test_authenticated_connection(self):
        user = await sync_to_async(User.objects.create_user)(
            username='wsuser', email='ws@example.com', password='pw'
        )
        await sync_to_async(setattr)(user, 'credits', 10)
        await sync_to_async(user.save)()
        
        token = AccessToken.for_user(user)
        
        communicator = WebsocketCommunicator(application, f"/ws/ai/chat/?token={str(token)}")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        
        await communicator.disconnect()

    @patch('sockets.consumers.chat_with_documents')
    async def test_receive_question_and_deduct_credits(self, mock_chat_with_documents):
        # Mock chat_with_documents to prevent LLM calls
        mock_chat_with_documents.return_value = {"answer": "Mocked AI Response"}
        
        user = await sync_to_async(User.objects.create_user)(
            username='wsuser2', email='ws2@example.com', password='pw'
        )
        await sync_to_async(setattr)(user, 'credits', 10)
        await sync_to_async(user.save)()
        
        token = AccessToken.for_user(user)
        communicator = WebsocketCommunicator(application, f"/ws/ai/chat/?token={str(token)}")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        
        await communicator.send_json_to({
            "question": "What is my spending limit?",
            "document_id": None
        })
        
        # 1. Typing indicator start
        response = await communicator.receive_json_from()
        self.assertEqual(response["type"], "typing")
        self.assertEqual(response["status"], "start")
        
        # 2. Tokenized stream (M o c k e d A I R e s p o n s e = 3 tokens)
        for _ in range(3):
            response = await communicator.receive_json_from()
            self.assertEqual(response["type"], "token")
            
        # 3. Typing indicator stop
        response = await communicator.receive_json_from()
        self.assertEqual(response["type"], "typing")
        self.assertEqual(response["status"], "stop")
        
        # 4. Done
        response = await communicator.receive_json_from()
        self.assertEqual(response["type"], "done")
        self.assertEqual(response["complete"], "Mocked AI Response")
        
        # Check credits deducted
        user_after = await sync_to_async(User.objects.get)(id=user.id)
        self.assertEqual(user_after.credits, 8)
        
        await communicator.disconnect()
