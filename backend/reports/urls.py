from django.urls import path
from .views import ReportListCreateAPIView, MoneyReplayAPIView

urlpatterns = [
    path('', ReportListCreateAPIView.as_view(), name="report-list-create"),
    path('money-replay/', MoneyReplayAPIView.as_view(), name="money-replay"),
]
