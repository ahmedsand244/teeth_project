import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Printer, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  FileText, 
  Activity, 
  CreditCard, 
  AlertCircle,
  RefreshCw,
  Home
} from 'lucide-react';

export default function PublicPatientRecordViewer({ patientId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    api.getPublicPatientRecord(patientId)
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'تعذر تحميل السجل الطبي أو أنه غير موجود');
        setLoading(false);
      });
  }, [patientId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
          <h3 className="font-bold text-slate-800">جاري تحميل السجل الطبي...</h3>
          <p className="text-xs text-slate-500 mt-1">DentFlow Pro Medical Network</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-lg">عذراً، لم يتم العثور على السجل الطبي</h3>
          <p className="text-xs text-slate-500 mt-2">{error || 'قد يكون تم تغيير الرابط أو حذف السجل'}</p>
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

  const { patient, summary, visits } = data;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation & Action Bar */}
        <div className="flex items-center justify-between no-print">
          <a 
            href="/" 
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
          >
            <Home className="w-4 h-4" />
            <span>نظام عيادة الأسنان DentFlow</span>
          </a>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-teal-600/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الملف الطبي (A4)</span>
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="printable-card bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden p-6 sm:p-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-teal-600 pb-5 mb-6 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🦷</span>
                <h1 className="text-2xl font-black text-teal-800">{patient.clinic_name || 'عيادة الأسنان المتخصصة'}</h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">هاتف العيادة: {patient.clinic_phone || '01011079572'}</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="inline-block bg-teal-50 text-teal-800 text-xs font-bold px-3 py-1 rounded-full border border-teal-200">
                السجل الطبي للمريض
              </span>
              <p className="text-[11px] text-slate-400 mt-1">تاريخ الاستخراج: {new Date().toLocaleDateString('ar-EG')}</p>
            </div>
          </div>

          {/* Patient Details */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-400 block font-semibold">اسم المريض</span>
                <strong className="text-base text-slate-800">{patient.name}</strong>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-semibold">رقم الهاتف</span>
                <strong className="text-base text-slate-800 font-mono" dir="ltr">{patient.phone || '-'}</strong>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-semibold">العمر والجنس</span>
                <strong className="text-base text-slate-800">
                  {patient.age ? `${patient.age} سنة` : '-'} / {patient.gender === 'F' ? 'أنثى' : 'ذكر'}
                </strong>
              </div>
            </div>
            {patient.notes && (
              <div className="mt-3 pt-3 border-t border-slate-200/70 text-xs text-slate-600">
                <span className="font-bold text-slate-700">ملاحظات طبية: </span>
                {patient.notes}
              </div>
            )}
          </div>

          {/* Financial and Visits Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-100 text-center">
              <span className="text-xs text-teal-700 block font-bold">الزيارات</span>
              <span className="text-xl font-black text-teal-900">{summary.visits_count || visits.length}</span>
            </div>
            <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-100 text-center">
              <span className="text-xs text-blue-700 block font-bold">المطالبات</span>
              <span className="text-xl font-black text-blue-900">{summary.total_billed || 0} ج.م</span>
            </div>
            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100 text-center">
              <span className="text-xs text-emerald-700 block font-bold">المسدد</span>
              <span className="text-xl font-black text-emerald-900">{summary.total_paid || 0} ج.م</span>
            </div>
            <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-100 text-center">
              <span className="text-xs text-rose-700 block font-bold">الرصيد المتبقي</span>
              <span className="text-xl font-black text-rose-900">{summary.total_remaining || 0} ج.م</span>
            </div>
          </div>

          {/* Detailed Visits History */}
          <h2 className="text-base font-black text-slate-800 mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            <span>سجل الزيارات والفحوصات ({visits.length})</span>
          </h2>

          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
            {visits.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                لا توجد سجلات زيارات سابقة
              </div>
            ) : (
              visits.map((v, i) => (
                <div key={i} className="p-4 hover:bg-slate-50/50 transition-colors text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-800">{v.date}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                        {v.shift}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
                        {v.visit_type}
                      </span>
                    </div>
                    {v.doctor_notes && (
                      <p className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">التشخيص والملاحظات: </span>
                        {v.doctor_notes}
                      </p>
                    )}
                    {v.procedures && v.procedures.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {v.procedures.map((p, pI) => (
                          <span key={pI} className="bg-teal-50 text-teal-800 px-2 py-0.5 rounded text-xs border border-teal-100">
                            {p.name} ({p.price} ج.م)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-left shrink-0 sm:border-r sm:border-slate-100 sm:pr-4">
                    <div className="font-bold text-emerald-600 text-sm">
                      سدد: {v.paid_amount || 0} ج.م
                    </div>
                    {v.remaining_amount > 0 ? (
                      <div className="text-xs font-semibold text-rose-500">
                        متبقي: {v.remaining_amount} ج.م
                      </div>
                    ) : (
                      <div className="text-xs font-semibold text-emerald-600">
                        خالص ✓
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-dashed border-slate-200 flex justify-between text-xs text-slate-400">
            <span>توقيع الطبيب: ....................</span>
            <span>ختم العيادة: ....................</span>
          </div>

        </div>

        <div className="text-center text-xs text-slate-400 no-print">
          DentFlow Medical Clinic Management System &copy; {new Date().getFullYear()}
        </div>

      </div>
    </div>
  );
}
