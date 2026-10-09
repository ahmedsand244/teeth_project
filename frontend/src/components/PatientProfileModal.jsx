import React, { useState, useEffect } from 'react';
import { 
  User, Phone, Calendar, Clock, DollarSign, X, 
  AlertTriangle, CheckCircle2, History, CreditCard, 
  Check, Stethoscope, ChevronLeft, FileText, Receipt, Printer
} from 'lucide-react';
import { api } from '../api';

export default function PatientProfileModal({ 
  isOpen, 
  onClose, 
  patientId, 
  onBookAppointment,
  onPrintRecord
}) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pay debt state
  const [showPayDebt, setShowPayDebt] = useState(false);
  const [debtPayAmount, setDebtPayAmount] = useState('');
  const [debtPayNote, setDebtPayNote] = useState('');
  const [debtSubmitting, setDebtSubmitting] = useState(false);
  const [debtSuccessMsg, setDebtSuccessMsg] = useState(null);

  const fetchProfile = async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPatientFinancialProfile(patientId);
      setProfileData(data);
      const rem = data?.summary?.total_remaining_balance || data?.summary?.total_remaining_debt || 0;
      if (rem > 0) {
        setDebtPayAmount(String(rem));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && patientId) {
      setShowPayDebt(false);
      setDebtSuccessMsg(null);
      fetchProfile();
    }
  }, [isOpen, patientId]);

  if (!isOpen) return null;

  const patient = profileData?.patient;
  const summary = profileData?.summary || {
    total_billed: 0,
    total_paid: 0,
    total_remaining_balance: 0,
    total_visits: 0
  };
  const visits = profileData?.visits || [];
  const remainingDebt = summary.total_remaining_balance ?? summary.total_remaining_debt ?? 0;

  const handlePayDebtSubmit = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(debtPayAmount);
    if (!amountNum || amountNum <= 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }
    setDebtSubmitting(true);
    try {
      await api.payPatientDebt(patientId, amountNum, debtPayNote || 'سداد مديونية سابقة');
      setDebtSuccessMsg(`تم سداد ${amountNum} ج.م بنجاح وتحديث الحساب!`);
      setShowPayDebt(false);
      await fetchProfile();
    } catch (err) {
      alert(`خطأ في السداد: ${err.message}`);
    } finally {
      setDebtSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-teal-600 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 text-white flex items-center justify-center font-bold">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">{patient?.name || 'الملف الطبي والمالي'}</h2>
                <span className="text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-lg font-mono">
                  كود #{patient?.id}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-teal-100 font-medium mt-0.5">
                <span dir="ltr" className="font-mono">{patient?.phone || 'بدون هاتف'}</span>
                {patient?.age && <span>• {patient.age} سنة</span>}
                {patient?.gender && <span>• {patient.gender === 'MALE' ? 'ذكر' : 'أنثى'}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPrintRecord && onPrintRecord(patientId)}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center gap-1.5 text-xs font-bold transition shadow-xs"
              title="طباعة ومشاركة السجل الطبي"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">طباعة ومشاركة السجل</span>
            </button>
            <button 
              onClick={onClose} 
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-right">
          {loading ? (
            <div className="text-center py-16 text-sm text-slate-400 font-bold">
              جاري تحميل بيانات وسجل المريض...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-bold">
              خطأ: {error}
            </div>
          ) : (
            <>
              {debtSuccessMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{debtSuccessMsg}</span>
                </div>
              )}

              {/* Top 3 Financial Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Total Billed */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">إجمالي الخدمات</span>
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {summary.total_billed} <span className="text-xs font-bold text-slate-500">ج.م</span>
                  </span>
                </div>

                {/* Total Paid */}
                <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 text-center">
                  <span className="text-[11px] font-bold text-emerald-800 block mb-1">إجمالي المدفوع</span>
                  <span className="text-2xl font-black text-emerald-700 font-mono">
                    {summary.total_paid} <span className="text-xs font-bold text-emerald-600">ج.م</span>
                  </span>
                </div>

                {/* Remaining Debt */}
                <div className={`p-4 rounded-2xl border text-center ${
                  remainingDebt > 0 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-teal-50 border-teal-200'
                }`}>
                  <span className="text-[11px] font-bold block mb-1 text-slate-600">
                    {remainingDebt > 0 ? 'الرصيد المتبقي (مديونية)' : 'حالة الحساب'}
                  </span>
                  <span className={`text-2xl font-black font-mono ${
                    remainingDebt > 0 ? 'text-red-700' : 'text-teal-700'
                  }`}>
                    {remainingDebt > 0 ? (
                      <>{remainingDebt} <span className="text-xs font-bold text-red-600">ج.م</span></>
                    ) : (
                      'خالص'
                    )}
                  </span>
                </div>
              </div>

              {/* Debt Settlement Form (if debt > 0) */}
              {remainingDebt > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span className="text-xs font-bold text-red-900">
                        على المريض مديونية سابقة بمبلغ {remainingDebt} ج.م
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPayDebt(!showPayDebt)}
                      className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{showPayDebt ? 'إلغاء' : 'سداد مديونية سابقة / دفع'}</span>
                    </button>
                  </div>

                  {showPayDebt && (
                    <form onSubmit={handlePayDebtSubmit} className="pt-3 border-t border-red-200 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">المبلغ المراد دفعه (ج.م) *</label>
                        <input
                          type="number"
                          step="any"
                          min="1"
                          max={remainingDebt}
                          required
                          value={debtPayAmount}
                          onChange={(e) => setDebtPayAmount(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-emerald-700 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">بيان / ملاحظة</label>
                        <input
                          type="text"
                          placeholder="سداد مديونية سابقة"
                          value={debtPayNote}
                          onChange={(e) => setDebtPayNote(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-hidden"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="submit"
                          disabled={debtSubmitting}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          <span>{debtSubmitting ? 'جاري الدفع...' : 'دفع وتصفية المديونية'}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Medical notes / allergies if any */}
              {patient?.notes && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    <span>ملاحظات طبية وتاريخ مرضي:</span>
                  </div>
                  <p className="text-amber-800 leading-relaxed font-medium">{patient.notes}</p>
                </div>
              )}

              {/* Visits & Procedures History */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-teal-600" />
                    <span>سجل الزيارات والإجراءات ({visits.length})</span>
                  </h3>
                </div>

                {visits.length === 0 ? (
                  <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-400 font-semibold">
                    لا توجد زيارات سابقة مسجلة لهذا المريض.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visits.map((v) => {
                      const isComplete = v.status === 'تم الكشف';
                      const vTotal = parseFloat(v.total_amount ?? v.invoice?.total_amount) || 0;
                      const vPaid = parseFloat(v.paid_amount ?? v.invoice?.paid_amount) || 0;
                      const vRemaining = parseFloat(v.remaining_amount ?? v.invoice?.remaining_amount) || 0;

                      return (
                        <div 
                          key={v.appointment_id} 
                          className="bg-white rounded-2xl border-2 border-slate-200 hover:border-teal-400 transition-all shadow-xs overflow-hidden"
                        >
                          {/* 1. Visit Header Bar */}
                          <div className="bg-slate-50/90 px-4 py-3 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-slate-900 font-mono flex items-center gap-1.5 text-xs">
                                <Calendar className="w-4 h-4 text-teal-600" />
                                <span>{v.date}</span>
                              </span>
                              <span className="text-[11px] text-teal-800 font-bold bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-lg">
                                {v.shift}
                              </span>
                            </div>

                            <span className={`text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                              isComplete 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                : 'bg-amber-100 text-amber-900 border border-amber-200'
                            }`}>
                              {isComplete ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> : <Clock className="w-3.5 h-3.5 text-amber-700" />}
                              <span>{v.status}</span>
                            </span>
                          </div>

                          <div className="p-4 space-y-3.5">
                            {/* 2. Structured Financial Summary Bar */}
                            <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50/80 rounded-xl border border-slate-200 text-center">
                              <div>
                                <span className="text-[10px] text-slate-500 font-bold block mb-0.5">إجمالي الجلسة</span>
                                <span className="text-sm font-black text-slate-900 font-mono">{vTotal} ج.م</span>
                              </div>
                              <div className="border-r border-slate-200">
                                <span className="text-[10px] text-emerald-700 font-bold block mb-0.5">المدفوع</span>
                                <span className="text-sm font-black text-emerald-600 font-mono">{vPaid} ج.م</span>
                              </div>
                              <div className="border-r border-slate-200">
                                <span className={`text-[10px] font-bold block mb-0.5 ${vRemaining > 0 ? 'text-red-600' : 'text-teal-700'}`}>
                                  {vRemaining > 0 ? 'المتبقي' : 'الحالة المالية'}
                                </span>
                                <span className={`text-sm font-black font-mono ${vRemaining > 0 ? 'text-red-600' : 'text-teal-700'}`}>
                                  {vRemaining > 0 ? `${vRemaining} ج.م` : 'خالص ✓'}
                                </span>
                              </div>
                            </div>

                            {/* 3. Clinical Procedures List */}
                            {v.procedures && v.procedures.length > 0 ? (
                              <div className="space-y-1.5">
                                <span className="text-[11px] font-black text-slate-700 flex items-center gap-1.5">
                                  <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                                  <span>الإجراءات والخدمات الطبية:</span>
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {v.procedures.map((p, idx) => (
                                    <div 
                                      key={p.id || idx}
                                      className="flex items-center justify-between p-2.5 bg-teal-50/50 hover:bg-teal-50 border border-teal-200/80 rounded-xl transition"
                                    >
                                      <span className="text-xs font-black text-teal-950 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                                        {p.name || p.service_name || 'إجراء طبي'}
                                      </span>
                                      <span className="text-xs font-black text-teal-800 font-mono bg-white px-2 py-0.5 rounded-md border border-teal-200 shadow-2xs">
                                        {p.price} ج.م
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400 italic bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-200 text-center">
                                لم يتم تسجيل إجراءات طبية في هذه الجلسة
                              </div>
                            )}

                            {/* 4. Doctor Notes */}
                            {v.doctor_notes && (
                              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-1">
                                <div className="font-black text-amber-950 flex items-center gap-1.5 text-[11px]">
                                  <FileText className="w-3.5 h-3.5 text-amber-700" />
                                  <span>تقرير وملاحظات الطبيب:</span>
                                </div>
                                <p className="text-amber-900 font-medium leading-relaxed mr-4">{v.doctor_notes}</p>
                              </div>
                            )}

                            {/* 5. Payment Receipts */}
                            {v.payments && v.payments.length > 0 && (
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                                <span className="text-[11px] font-black text-slate-500 flex items-center gap-1.5">
                                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>إيصالات الدفع المسجلة:</span>
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {v.payments.map((pmt) => (
                                    <span 
                                      key={pmt.id}
                                      className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5"
                                    >
                                      <span className="text-slate-500 font-sans text-[10px]">{pmt.type_display || 'سداد'}:</span>
                                      <span className="text-emerald-700 font-black">{pmt.amount} ج.م</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Actions: Book new appointment & Print Record */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onBookAppointment(patient);
                  }}
                  className="flex-1 py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-black shadow-xs transition flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>حجز موعد جديد لهذا المريض</span>
                </button>

                <button
                  type="button"
                  onClick={() => onPrintRecord && onPrintRecord(patientId)}
                  className="py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 border border-slate-200"
                >
                  <Printer className="w-4 h-4 text-teal-600" />
                  <span>طباعة ومشاركة السجل (A4)</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
