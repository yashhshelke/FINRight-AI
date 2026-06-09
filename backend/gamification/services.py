from django.utils import timezone
from datetime import timedelta
from transactions.models import Transaction
from .models import Challenge, UserChallenge
import re

def evaluate_streaks_and_challenges(user):
    """
    Automated script to evaluate active challenges based on transaction logic.
    This runs daily or on-demand to sync streaks automatically.
    """
    now = timezone.now()
    yesterday_start = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_end = yesterday_start + timedelta(days=1)
    
    yesterday_txns = Transaction.objects.filter(
        user=user,
        date__gte=yesterday_start,
        date__lt=yesterday_end,
        type="expense"
    )
    
    # Check 1: Under budget
    # We'll approximate a daily budget as profile income / 30
    income = float(user.income or 0)
    daily_budget = income / 30 if income > 0 else 0
    total_spent_yesterday = sum([float(tx.amount) for tx in yesterday_txns])
    
    under_budget = False
    if daily_budget > 0 and total_spent_yesterday <= daily_budget:
        under_budget = True
        
    # Check 2: No Swiggy / Food Delivery
    food_keywords = ["swiggy", "zomato", "restaurant", "food", "cafe", "uber eats"]
    had_food_delivery = False
    for tx in yesterday_txns:
        desc_cat = f"{tx.description or ''} {tx.category or ''}".lower()
        if any(k in desc_cat for k in food_keywords):
            had_food_delivery = True
            break
            
    no_food_delivery = not had_food_delivery
    
    # Fetch all user challenges to update them
    user_challenges = UserChallenge.objects.filter(user=user).select_related('challenge')
    updated = []
    
    for uc in user_challenges:
        title = uc.challenge.title.lower()
        
        # Mapping automated logic to challenges based on title keywords
        should_increment = False
        should_reset = False
        
        if "budget" in title:
            if under_budget:
                should_increment = True
            elif total_spent_yesterday > daily_budget:
                should_reset = True
                
        elif "swiggy" in title or "delivery" in title or "food" in title:
            if no_food_delivery:
                should_increment = True
            else:
                should_reset = True
                
        # Apply updates
        if should_increment:
            # Only increment if not already incremented today
            if not uc.last_toggled or uc.last_toggled.date() < now.date():
                uc.streak += 1
                uc.last_toggled = now
                uc.completed = True
                updated.append(uc)
        elif should_reset:
            uc.streak = 0
            uc.completed = False
            uc.last_toggled = now
            updated.append(uc)
            
    if updated:
        UserChallenge.objects.bulk_update(updated, ['streak', 'completed', 'last_toggled'])
        
    return {"updated_challenges": len(updated)}
