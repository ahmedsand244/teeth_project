import React, { useState } from 'react';
import { DollarSign, X, Check, AlertCircle, Receipt } from 'lucide-react';
import { api } from '../api';

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  appointment, 
  onSuccess 
}) {
  if (!isOpen || !appointment) return null;

  const invoice = appointment.invoice || {};
  const currentNet = parseFloat(invoice.net_amount) || 0;
  const currentPaid = parseFloat(invoice.paid_amount) || 0;
  const currentRemaining = parseFloat(invoice.remaining_amount) || 0;

  const [paymentNow, setPaymentNow] = useState(currentRemaining.toString());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const payNum = parseFloat(paymentNow) || 0;
  const newRemaining = Math.max(0, currentRemaining - payNum);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (payNum <= 0) {
        throw new Error('يرجى كتابة مبلغ أكبر من الصفر');
      }
      if (payNum > currentRemaining) {
        throw new Error(`المبلغ المدفوع أكبر من الباقي (${currentRemaining} ج.م)`);
      }

      await api.recordPayment(invoice.id, payNum, notes);
      onSuccess(`تم حفظ دفعة ${payNum} ج.م بنجاح!`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">تحصيل مبلغ</h2>
              <p className="text-[11px] text-emerald-800">
                {appointment.patient_details?.name} (دور #{appointment.queue_number})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {/* Quick Account Summary */}
          <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <div>
              <span className="text-[10px] text-slate-500 block">المطلوب</span>
              <span className="font-bold text-slate-800">{currentNet} ج.م</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">المدفوع</span>
              <span className="font-bold text-emerald-600">{currentPaid} ج.م</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">الباقي</span>
              <span className="font-bold text-red-600">{currentRemaining} ج.م</span>
            </div>
          </div>

          {/* Amount Paid Now */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المدفوع الآن (ج.م) *</label>
            <input
              type="number"
              required
              step="any"
              min="1"
              max={currentRemaining}
              value={paymentNow}
              onChange={(e) => setPaymentNow(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-emerald-700 focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* Remaining After */}
          <div className="p-2.5 bg-emerald-50 rounded-xl flex items-center justify-between font-bold text-xs">
            <span className="text-slate-700">الباقي بعد هذا الدفع:</span>
            <span className={newRemaining === 0 ? 'text-emerald-700' : 'text-red-600'}>
              {newRemaining === 0 ? 'خالص (0 ج.م)' : `${newRemaining} ج.م`}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظة (اختياري)</label>
            <input
              type="text"
              placeholder="مثال: نقدي كاش"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || currentRemaining <= 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'جاري الحفظ...' : 'حفظ الدفعة'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
