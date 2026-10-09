from datetime import date
from decimal import Decimal
from django.db.models import Sum, Count, Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from accounts.permissions import IsDoctor
from appointments.models import Appointment, ShiftType, VisitType, AppointmentStatus
from billing.models import Invoice


class DoctorFinancialAnalyticsView(APIView):
    """
    Exclusive Financial Analytics Engine for Doctors.
    Strictly forbids Assistants with HTTP 403 Forbidden.
    """
    permission_classes = [IsDoctor]

    def get(self, request):
        today = date.today()
        target_date_str = request.query_params.get('date', today.isoformat())
        try:
            target_date = date.fromisoformat(target_date_str)
        except ValueError:
            target_date = today

        year = target_date.year
        month = target_date.month

        user = request.user
        clinic = getattr(user, 'clinic', None)

        base_invoices = Invoice.objects.exclude(visit__status=AppointmentStatus.CANCELLED)
        if not user.is_saas_admin():
            if clinic:
                base_invoices = base_invoices.filter(visit__clinic=clinic)
            else:
                base_invoices = base_invoices.none()

        # Invoices for target date
        day_invoices = base_invoices.filter(visit__visit_date=target_date)
        
        # Today's totals
        day_total_paid = sum((inv.paid_amount for inv in day_invoices), Decimal('0.00'))
        day_total_discount = sum((inv.discount for inv in day_invoices), Decimal('0.00'))
        day_total_billed = sum((inv.total_amount for inv in day_invoices), Decimal('0.00'))
        day_total_net = sum((inv.net_amount for inv in day_invoices), Decimal('0.00'))
        day_total_remaining = sum((inv.remaining_amount for inv in day_invoices), Decimal('0.00'))

        # Breakdown by Shift for target date
        morning_invoices = day_invoices.filter(visit__shift=ShiftType.MORNING)
        evening_invoices = day_invoices.filter(visit__shift=ShiftType.EVENING)

        shift_breakdown = {
            'morning': {
                'label': 'الشيفت الصباحي',
                'visits_count': morning_invoices.count(),
                'paid_amount': float(sum((inv.paid_amount for inv in morning_invoices), Decimal('0.00'))),
                'discount_amount': float(sum((inv.discount for inv in morning_invoices), Decimal('0.00'))),
                'net_amount': float(sum((inv.net_amount for inv in morning_invoices), Decimal('0.00'))),
                'remaining_amount': float(sum((inv.remaining_amount for inv in morning_invoices), Decimal('0.00'))),
            },
            'evening': {
                'label': 'الشيفت المسائي',
                'visits_count': evening_invoices.count(),
                'paid_amount': float(sum((inv.paid_amount for inv in evening_invoices), Decimal('0.00'))),
                'discount_amount': float(sum((inv.discount for inv in evening_invoices), Decimal('0.00'))),
                'net_amount': float(sum((inv.net_amount for inv in evening_invoices), Decimal('0.00'))),
                'remaining_amount': float(sum((inv.remaining_amount for inv in evening_invoices), Decimal('0.00'))),
            }
        }

        # Breakdown by Treatment for target date
        general_invoices = day_invoices.filter(visit__visit_type=VisitType.GENERAL_CHECKUP)
        ortho_fit_invoices = day_invoices.filter(visit__visit_type=VisitType.ORTHO_NEW_FIT)
        ortho_followup_invoices = day_invoices.filter(visit__visit_type=VisitType.ORTHO_FOLLOWUP)

        treatment_breakdown = {
            'general': {
                'label': 'كشف عام واستشارات',
                'visits_count': general_invoices.count(),
                'paid_amount': float(sum((inv.paid_amount for inv in general_invoices), Decimal('0.00'))),
                'remaining_amount': float(sum((inv.remaining_amount for inv in general_invoices), Decimal('0.00'))),
            },
            'ortho_new_fit': {
                'label': 'تركيب تقويم جديد',
                'visits_count': ortho_fit_invoices.count(),
                'paid_amount': float(sum((inv.paid_amount for inv in ortho_fit_invoices), Decimal('0.00'))),
                'remaining_amount': float(sum((inv.remaining_amount for inv in ortho_fit_invoices), Decimal('0.00'))),
            },
            'ortho_followup': {
                'label': 'متابعة تقويم',
                'visits_count': ortho_followup_invoices.count(),
                'paid_amount': float(sum((inv.paid_amount for inv in ortho_followup_invoices), Decimal('0.00'))),
                'remaining_amount': float(sum((inv.remaining_amount for inv in ortho_followup_invoices), Decimal('0.00'))),
            },
            'ortho_total': {
                'label': 'إجمالي قسم التقويم',
                'visits_count': ortho_fit_invoices.count() + ortho_followup_invoices.count(),
                'paid_amount': float(sum((inv.paid_amount for inv in ortho_fit_invoices), Decimal('0.00')) + sum((inv.paid_amount for inv in ortho_followup_invoices), Decimal('0.00'))),
            }
        }

        # Monthly analytics (current month)
        month_invoices = base_invoices.filter(
            visit__visit_date__year=year,
            visit__visit_date__month=month
        )

        month_total_paid = sum((inv.paid_amount for inv in month_invoices), Decimal('0.00'))
        month_total_discount = sum((inv.discount for inv in month_invoices), Decimal('0.00'))
        month_total_billed = sum((inv.total_amount for inv in month_invoices), Decimal('0.00'))
        month_total_net = sum((inv.net_amount for inv in month_invoices), Decimal('0.00'))

        # Total outstanding balances across all patients in clinic history
        all_time_outstanding = sum((inv.remaining_amount for inv in base_invoices), Decimal('0.00'))
        all_time_discounts = sum((inv.discount for inv in base_invoices), Decimal('0.00'))

        # Recent transactions ledger
        recent_ledger = []
        for inv in day_invoices.select_related('visit__patient').order_by('-updated_at')[:20]:
            recent_ledger.append({
                'invoice_id': inv.id,
                'patient_name': inv.visit.patient.name,
                'patient_phone': inv.visit.patient.phone,
                'visit_type_display': inv.visit.get_visit_type_display(),
                'shift_display': inv.visit.get_shift_display(),
                'total_amount': float(inv.total_amount),
                'discount': float(inv.discount),
                'net_amount': float(inv.net_amount),
                'paid_amount': float(inv.paid_amount),
                'remaining_amount': float(inv.remaining_amount),
                'notes': inv.notes,
                'time': inv.updated_at.strftime('%H:%M'),
            })

        return Response({
            'date': target_date_str,
            'year': year,
            'month': month,
            'day_summary': {
                'total_revenue': float(day_total_paid),
                'total_discount': float(day_total_discount),
                'total_billed': float(day_total_billed),
                'total_net': float(day_total_net),
                'total_remaining': float(day_total_remaining),
                'visits_count': day_invoices.count(),
            },
            'shift_breakdown': shift_breakdown,
            'treatment_breakdown': treatment_breakdown,
            'month_summary': {
                'total_revenue': float(month_total_paid),
                'total_discount': float(month_total_discount),
                'total_billed': float(month_total_billed),
                'total_net': float(month_total_net),
                'visits_count': month_invoices.count(),
            },
            'clinic_totals': {
                'total_outstanding_balances': float(all_time_outstanding),
                'total_lifetime_discounts': float(all_time_discounts),
            },
            'recent_ledger': recent_ledger,
        })
