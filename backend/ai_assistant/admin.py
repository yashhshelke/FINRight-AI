# ai_assistant/admin.py
from django.contrib import admin
from .models import (
    Document, ChatSession, ChatMessage, 
    FinancialHealthScore, ScoreFactorDetail
)


@admin.register(FinancialHealthScore)
class FinancialHealthScoreAdmin(admin.ModelAdmin):
    list_display = ('user', 'score', 'get_score_category', 'month', 'calculation_date')
    list_filter = ('month', 'calculation_date')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('calculation_date', 'get_score_category', 'get_score_color')
    date_hierarchy = 'month'
    
    fieldsets = (
        ('User & Score', {
            'fields': ('user', 'score', 'month', 'calculation_date')
        }),
        ('Factor Scores', {
            'fields': ('spending_discipline_score', 'savings_ratio_score', 
                      'credit_utilization_score', 'loan_burden_score', 'risk_exposure_score')
        }),
        ('Analysis', {
            'fields': ('explanation', 'recommendations')
        }),
    )


@admin.register(ScoreFactorDetail)
class ScoreFactorDetailAdmin(admin.ModelAdmin):
    list_display = ('health_score', 'factor_name', 'score', 'weight')
    list_filter = ('factor_name',)
    search_fields = ('health_score__user__username',)


admin.site.register(Document)
admin.site.register(ChatSession)
admin.site.register(ChatMessage)
