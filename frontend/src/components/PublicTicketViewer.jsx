import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Printer, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  RefreshCw,
  Home
} from 'lucide-react';

export default function PublicTicketViewer({ ticketId }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ticketId) return;
    setLoading(true);
    api.getPublicTicket(ticketId)
      .then(data => {
        setTicket(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'تعذر تحميل التذكرة أو أنها غير موجودة');
        setLoading(false);
      });
  }, [ticketId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
          <h3 className="font-bold text-slate-800">جاري تحميل تذكرة الحجز...</h3>
          <p className="text-xs text-slate-500 mt-1">DentFlow Pro Medical Network</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-lg">عذراً، لم يتم العثور على التذكرة</h3>
          <p className="text-xs text-slate-500 mt-2">{error || 'قد يكون تم تعديل الموعد أو إزالته'}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 mt-5 px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl shadow-md"
          >
            <Home className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </a>
        </div>
      </div>
    );
  }

  const {
    queue_number,
    patient_name,
    patient_phone,
    visit_date,
    shift_display,
    appointment_time,
    visit_type_display,
    status_display,
    clinic_name,
    clinic_phone,
    paid_amount,
    remaining_amount,
    total_amount
  } = ticket;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-slate-50 to-cyan-50 flex flex-col items-center justify-center p-4 sm:p-6" dir="rtl">
      
      {/* Action Bar */}
      <div className="max-w-md w-full flex items-center justify-between mb-4 no-print">
        <a 
          href="/" 
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
        >
          <Home className="w-4 h-4" />
          <span>DentFlow Clinic System</span>
        </a>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-teal-600/20 transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة التذكرة</span>
        </button>
      </div>

      {/* Printable Ticket Card */}
      <div className="printable-card max-w-md w-full bg-white rounded-3xl shadow-xl border border-teal-100/80 overflow-hidden relative">
        <div className="h-2 bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-500" />
        
        <div className="p-6 text-center">
          {/* Clinic Header */}
          <div className="border-b border-slate-100 pb-4 mb-4">
            <span className="text-3xl block mb-1">🦷</span>
            <h1 className="font-black text-xl text-slate-800">{clinic_name || 'عيادة الأسنان المتخصصة'}</h1>
            <p className="text-xs text-slate-500 mt-1">📞 هاتف العيادة: {clinic_phone || '01011079572'}</p>
          </div>

          {/* Queue Number */}
          <div className="inline-flex flex-col items-center justify-center bg-teal-50/80 border-2 border-teal-500 rounded-3xl px-8 py-3 mb-5 shadow-inner">
            <span className="text-xs font-bold text-teal-800">رقم الدور الخاص بك</span>
            <span className="text-4xl font-black text-teal-700 tracking-wider">#{queue_number || '1'}</span>
          </div>

          {/* Patient Details */}
          <div className="bg-slate-50 rounded-2xl p-4 text-sm text-right space-y-2.5 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5 text-xs">
                <User className="w-4 h-4 text-slate-400" /> المريض:
              </span>
              <span className="font-bold text-slate-800">{patient_name}</span>
            </div>

            {patient_phone && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5 text-xs">
                  <Phone className="w-4 h-4 text-slate-400" /> الهاتف:
                </span>
                <span className="font-semibold text-slate-700 text-xs" dir="ltr">{patient_phone}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5 text-xs">
                <Calendar className="w-4 h-4 text-slate-400" /> التاريخ:
              </span>
              <span className="font-bold text-slate-800">{visit_date}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5 text-xs">
                <Clock className="w-4 h-4 text-slate-400" /> الموعد / الفترة:
              </span>
              <span className="font-bold text-teal-700">
                {shift_display} {appointment_time ? `(${appointment_time})` : ''}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-slate-400" /> نوع الحجز:
              </span>
              <span className="font-semibold text-slate-700">{visit_type_display || 'كشف'}</span>
            </div>

            {/* Financial Status */}
            <div className="border-t border-slate-200/80 pt-3 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5 text-xs">
                  <CreditCard className="w-4 h-4 text-slate-400" /> حالة الدفع:
                </span>
                <div className="text-left">
                  <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800">
                    مدفوع: {paid_amount} ج.م
                  </span>
                  {remaining_amount > 0 ? (
                    <span className="inline-block mr-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-800">
                      متبقي: {remaining_amount} ج.م
                    </span>
                  ) : (
                    <span className="inline-block mr-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700">
                      خالص ✓
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-4 leading-relaxed">
            يرجى التواجد في العيادة قبل الموعد بـ 10 دقائق.<br />
            نتمنى لك دوام الصحة والعافية!
          </p>
        </div>

      </div>

      <div className="text-center mt-6 text-xs text-slate-400 no-print">
        DentFlow Medical Clinic Management System &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
}
