from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AppointmentViewSet, PublicAppointmentTicketView

router = DefaultRouter()
router.register(r'', AppointmentViewSet, basename='appointment')

urlpatterns = [
    path('public-ticket/<int:pk>/', PublicAppointmentTicketView.as_view(), name='public-ticket'),
    path('', include(router.urls)),
]
