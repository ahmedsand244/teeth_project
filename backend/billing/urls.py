from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, ServiceViewSet, PaymentViewSet

router = DefaultRouter()
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'', InvoiceViewSet, basename='invoice')

urlpatterns = [
    path('', include(router.urls)),
]
