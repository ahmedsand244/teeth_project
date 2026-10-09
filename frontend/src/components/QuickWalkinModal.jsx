import React, { useState } from 'react';
import { Zap, X, User, Phone, DollarSign, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function QuickWalkinModal({ 
  isOpen, 
  onClose, 
  selectedDate, 
  selectedShift, 
  shiftSummary, 
  onSuccess,
  onBookingCreated
}) {
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('MALE');
  const [age, setAge] = useState('');
  const [fee, setFee] = useState('300');
  const [paid, setPaid] = useState('300');
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const quotaRemaining = shiftSummary?.dawn_walkins_remaining ?? 0;
  const isMorning = selectedShift === 'MORNING';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!patientName.trim() || !phone.trim()) {
        throw new Error('يرجى إدخال اسم المريض ورقم الهاتف');
      }

      // 1. Create or find patient
      let patientId;
      const searchRes = await api.getPatients(phone.trim());
      const existing = searchRes.find(p => p.phone === phone.trim());
      if (existing) {
        patientId = existing.id;
      } else {
        const newPatient = await api.createPatient({
          name: patientName.trim(),
          phone: phone.trim(),
          gender,
          age: age ? parseInt(age) : null,
          notes: 'حالة مسجلة كشف فوري / فجر'
        });
        patientId = newPatient.id;
      }

      // 2. Book walk-in appointment consuming from reserved pool
      const createdApp = await api.createAppointment({
        patient: patientId,
        visit_type: 'GENERAL_CHECKUP',
        shift: selectedShift,
        visit_date: selectedDate,
        is_dawn_walkin: true,
        initial_total_amount: fee ? parseFloat(fee) : 0,
        initial_discount: discount ? parseFloat(discount) : 0,
        initial_paid_amount: paid ? parseFloat(paid) : 0,
        initial_invoice_notes: notes || 'كشف فجر / فوري مستعجل'
      });

      onSuccess('تم تسجيل كشف الفجر الفوري وحجز رقم الطابور بنجاح!');
      if (onBookingCreated && createdApp) {
        onBookingCreated(createdApp);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">تسجيل كشف فجر / فوري (كوتة محجوزة)</h2>
              <p className="text-xs text-amber-800 font-medium">حجز فوري مباشر من الكوتة المخصصة للشيفت</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quota Status Box */}
        <div className="mx-6 mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
          <span className="text-slate-600 font-semibold">
            كوتة الفجر المتبقية ({isMorning ? 'صباحي' : 'مسائي'}):
          </span>
          <span className={`font-bold px-2 py-0.5 rounded-md ${
            quotaRemaining > 0 
              ? 'bg-emerald-100 text-emerald-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {quotaRemaining} / {isMorning ? 7 : 3} أرقام متاحة
          </span>
        </div>

        {error && (
          <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اسم المريض *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="أحمد محمد مصطفى"
                className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01012345678"
                  className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden text-left"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">العمر</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="28"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">النوع</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden"
                >
                  <option value="MALE">ذكر</option>
                  <option value="أنثى">أنثى</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Payment Block */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>المحاسبة الفورية</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">قيمة الكشف (ج.م)</label>
                <input
                  type="number"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">خصم VIP (ج.م)</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-amber-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">المسدد الآن (ج.م)</label>
                <input
                  type="number"
                  value={paid}
                  onChange={(e) => setPaid(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-emerald-700"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || quotaRemaining <= 0}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-2 transition"
            >
              <Zap className="w-4 h-4" />
              <span>{loading ? 'جاري التسجيل...' : 'تأكيد وحجز رقم فجر فوري'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
