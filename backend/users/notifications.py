"""
Notification utility functions.
Creates real database notifications for user activities.
"""
from .models import Notification


def notify(user, title, message, notification_type='info', link=None):
    """Create a single notification for a user."""
    return Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type,
        link=link,
    )


def notify_welcome(user):
    """Welcome notification for new users after onboarding."""
    notify(
        user,
        title='Welcome to FINON! 🎉',
        message=f'Hi {user.first_name or user.username}, your financial dashboard is ready. Start by adding transactions or setting savings goals.',
        notification_type='system',
        link='/dashboard',
    )


def notify_transaction(user, amount, category, tx_type):
    """Notification when a transaction is recorded."""
    verb = 'earned' if tx_type == 'income' else 'spent'
    notify(
        user,
        title=f'Transaction Recorded',
        message=f'You {verb} ₹{amount:,.0f} in {category}.',
        notification_type='transaction',
        link='/dashboard/transactions',
    )


def notify_goal_created(user, goal_title, target_amount):
    """Notification when a new savings goal is created."""
    notify(
        user,
        title='New Goal Created 🎯',
        message=f'"{goal_title}" with target ₹{target_amount:,.0f} has been created. Stay consistent!',
        notification_type='goal',
        link='/dashboard/goals',
    )


def notify_goal_progress(user, goal_title, progress_pct):
    """Notification when goal crosses a milestone."""
    notify(
        user,
        title=f'Goal Milestone! 🏆',
        message=f'"{goal_title}" is now {progress_pct:.0f}% complete. Keep going!',
        notification_type='success',
        link='/dashboard/goals',
    )


def notify_goal_completed(user, goal_title):
    """Notification when a goal is fully achieved."""
    notify(
        user,
        title=f'Goal Achieved! 🎉',
        message=f'Congratulations! You\'ve reached your goal "{goal_title}". Time to set a new one!',
        notification_type='success',
        link='/dashboard/goals',
    )


def notify_funds_deposit(user, amount):
    """Notification when a funds deposit is recorded."""
    notify(
        user,
        title='Funds Added',
        message=f'₹{amount:,.0f} has been added to your account.',
        notification_type='funds',
        link='/dashboard',
    )


def notify_funds_withdrawal(user, amount):
    """Notification when a funds withdrawal is recorded."""
    notify(
        user,
        title='Funds Used',
        message=f'₹{amount:,.0f} has been used from your account.',
        notification_type='funds',
        link='/dashboard',
    )


def notify_budget_warning(user, category, spent, limit):
    """Notification when spending approaches or exceeds budget."""
    pct = (spent / limit * 100) if limit > 0 else 0
    if pct >= 100:
        notify(
            user,
            title=f'Budget Exceeded! ⚠️',
            message=f'You\'ve exceeded your {category} budget (₹{spent:,.0f} / ₹{limit:,.0f}). Consider reducing spending.',
            notification_type='warning',
            link='/dashboard/budget',
        )
    elif pct >= 80:
        notify(
            user,
            title=f'Budget Alert',
            message=f'You\'ve used {pct:.0f}% of your {category} budget (₹{spent:,.0f} / ₹{limit:,.0f}).',
            notification_type='warning',
            link='/dashboard/budget',
        )


def notify_low_funds(user, balance):
    """Notification when available funds are low."""
    notify(
        user,
        title='Low Funds ⚠️',
        message=f'Your available funds are ₹{balance:,.0f}. Consider reviewing your budget.',
        notification_type='warning',
        link='/dashboard',
    )


def notify_onboarding_complete(user):
    """Notification after onboarding is completed."""
    notify(
        user,
        title='Profile Setup Complete ✅',
        message='Your financial profile is set up. FINON AI can now give you personalized insights!',
        notification_type='success',
        link='/dashboard',
    )
