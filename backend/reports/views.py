from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import FinancialReport
from .serializers import FinancialReportSerializer
from .services.report_generator import generate_monthly_report
from .services.story_generator import generate_money_replay

class ReportListCreateAPIView(generics.ListCreateAPIView):
    """
    GET /api/reports/ -> List user's financial reports.
    POST /api/reports/ -> Generate a new financial report.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = FinancialReportSerializer

    def get_queryset(self):
        return FinancialReport.objects.filter(user=self.request.user).order_by("-created_at")

    def create(self, request, *args, **kwargs):
        # Trigger report generation
        generated_data = generate_monthly_report(request.user)
        
        # Save to DB
        report = FinancialReport.objects.create(
            user=request.user,
            title=f"Monthly Report - {timezone.now().strftime('%B %Y')}",
            report_type='monthly',
            data=generated_data
        )
        
        serializer = self.get_serializer(report)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers

class MoneyReplayAPIView(APIView):
    """GET /api/reports/money-replay/ -> generate the shareable month-end story."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses=inline_serializer(
            name="MoneyReplayResponse",
            fields={
                "report_id": serializers.IntegerField(),
                "title": serializers.CharField(),
                "slides": serializers.ListField(),
            }
        )
    )
    def get(self, request, *args, **kwargs):
        month = request.query_params.get("month")
        story = generate_money_replay(request.user, month=month)

        report = FinancialReport.objects.create(
            user=request.user,
            title=story["title"],
            report_type='money_replay',
            data=story,
        )

        return Response({
            "report_id": report.id,
            **story,
        }, status=status.HTTP_200_OK)

# Add timezone import for create method
from django.utils import timezone
