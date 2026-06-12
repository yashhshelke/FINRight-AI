from rest_framework import serializers
from .models import SavingsGoal

class GoalSerializer(serializers.ModelSerializer):
    # Explicitly declare Decimal fields (model uses EncryptedDecimalField → CharField internally)
    target_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    current_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    monthly_contribution = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)

    progress_percentage = serializers.FloatField(read_only=True)
    status = serializers.CharField(read_only=True)
    remaining_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    months_left = serializers.IntegerField(read_only=True)
    required_monthly = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    delay_months = serializers.IntegerField(read_only=True)

    class Meta:
        model = SavingsGoal
        fields = (
            "id", "title", "target_amount", "current_amount", "deadline",
            "priority", "monthly_contribution", "icon",
            "progress_percentage", "status", "remaining_amount",
            "months_left", "required_monthly", "delay_months",
            "created_at",
        )
        read_only_fields = ("user", "created_at")
