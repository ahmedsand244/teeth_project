from django.urls import path
from .views import DoctorFinancialAnalyticsView

urlpatterns = [
    path('dashboard/', DoctorFinancialAnalyticsView.as_view(), name='doctor_financial_dashboard'),
]
