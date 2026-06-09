from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch
import asyncio
from ai_assistant.services.agent import Agent
from transactions.models import Transaction
from decimal import Decimal

User = get_user_model()

class AgentLLMMockTests(TransactionTestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='aiuser', 
            email='ai@example.com', 
            password='SecurePassword123!'
        )
        Transaction.objects.create(
            user=self.user, 
            type='expense', 
            amount=Decimal('500.00'), 
            category='Food',
            description='Lunch'
        )
        
    @patch('ai_assistant.services.agent.generate_text')
    def test_agent_pipeline_mocked(self, mock_generate_text):
        """Test full agent pipeline: Tool Call -> Engine -> Prompt/Formatting"""
        
        # 1. Mock the LLM Tool Call response (Gemini mock)
        mock_generate_text.return_value = '{"action": "list_transactions", "reason": "User requested recent transactions"}'
        
        agent = Agent()
        messages = []
        
        async def mock_send_fn(payload):
            messages.append(payload)
            
        # 2. Run the agent (Prompt Assembly happens inside)
        final_result = asyncio.run(agent.run(
            question="Show my recent transactions",
            user=self.user,
            mongo_doc=None,
            send_fn=mock_send_fn
        ))
        
        # 3. Verify Tool Call execution & Response Formatting
        mock_generate_text.assert_called_once()
        
        # Verify the financial engine correctly processed the DB transaction
        self.assertIn("500.00", final_result)
        self.assertIn("Food", final_result)
        self.assertIn("expense", final_result)
        
        # Verify streamed response formatting
        message_types = [msg.get("type") for msg in messages]
        self.assertIn("agent_thought", message_types)
        self.assertIn("agent_action", message_types)
        self.assertIn("agent_result", message_types)
