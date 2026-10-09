import React, { useState, useEffect } from 'react';
import { 
  X, Check, DollarSign, AlertCircle, Plus, 
  Trash2, AlertTriangle, Calculator, Sparkles, CheckCircle2 
} from 'lucide-react';
import { api } from '../api';

export default function CheckoutModal({ 
  isOpen, 
  onClose, 
  appointment, 
  onSuccess 
}) {
  if (!isOpen || !appointment) return null;

  const invoice = appointment.invoice || {};
  const depositPaid = parseFloat(invoice.paid_amount) || 0; // Deposit paid during booking
  const patient = appointment.patient_details || {};

  // Procedures list (initialized with doctor's procedures)
  const [procedures, setProcedures] = useState(appointment.procedures || []);
  const [newProcName, setNewProcName] = useState('');
  const [newProcPrice, setNewProcPrice] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // Prior debt from other visits
  const [priorDebt, setPriorDebt] = useState(0);
  const [discount, setDiscount] = useState(parseFloat(invoice.discount) || 0);
  const [amountPaidNow, setAmountPaidNow] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch patient's true prior debt (excluding this current appointment)
  useEffect(() => {
    if (appointment?.patient) {
      api.getPatient(appointment.patient)
        .then(pData => {
          const totalBalance = parseFloat(pData.total_remaining_balance) || 0;
          const currentAppRemaining = parseFloat(invoice.remaining_amount) || 0;
          // Prior debt from older visits = total debt - current visit remaining
          const debtFromPast = Math.max(0, totalBalance - currentAppRemaining);
          setPriorDebt(debtFromPast);
        })
        .catch(console.error);
    }
  }, [appointment]);

  // Autocomplete suggestions
  useEffect(() => {
    if (newProcName.trim().length >= 1) {
      api.getServices(newProcName)
        .then(setSuggestions)
        .catch(() => setSuggestions([]));
    } else {
      setSuggestions([]);
    }
  }, [newProcName]);

  // Math Calculations
  const todayProceduresTotal = procedures.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);
  const discountNum = parseFloat(discount) || 0;
  const todayNet = Math.max(0, todayProceduresTotal - discountNum);

  // Net Required today after deducting deposit + adding prior debt
  // المطلوب للدفع = (تكلفة اليوم + مديونية سابقة) - المقدم
  const netDueTotal = Math.max(0, (todayNet + priorDebt) - depositPaid);

  // Prefill amount paid now with net due if empty
  useEffect(() => {
    setAmountPaidNow(netDueTotal.toString());
  }, [netDueTotal]);

  const paidNowNum = parseFloat(amountPaidNow) || 0;
  const remainingAfterPayment = Math.max(0, netDueTotal - paidNowNum);

  const handleAddProcedure = (name, price) => {
    if (!name.trim()) return;
    setProcedures(prev => [...prev, {
      name: name.trim(),
      price: parseFloat(price) || 0
    }]);
    setNewProcName('');
    setNewProcPrice('');
    setSuggestions([]);
  };

  const handleRemoveProcedure = (index) => {
    setProcedures(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePrice = (index, val) => {
    setProcedures(prev => prev.map((p, i) => i === index ? { ...p, price: parseFloat(val) || 0 } : p));
  };

  const handleSubmitCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.checkoutAppointment(appointment.id, {
        procedures: procedures.map(p => ({ name: p.name, price: p.price })),
        discount: discountNum,
        paid_now: paidNowNum,
        notes: paymentNotes
      });

      onSuccess(`تم إنهاء الزيارة وتسجيل دفع ${paidNowNum} ج.م بنجاح!`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border-2 border-slate-200 overflow-hidden max-h-[92vh] flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-teal-600 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-white/20 font-mono font-black text-sm flex items-center justify-center">
                #{appointment.queue_number}
              </span>
              <h2 className="text-lg font-black text-white">إنهاء الزيارة وتسوية الحساب</h2>
            </div>
            <p className="text-xs text-teal-100 font-bold mt-0.5">
              المريض: {patient.name} {patient.phone ? `(${patient.phone})` : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-teal-200 hover:text-white p-1 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmitCheckout} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* 1. Procedures List & Doctor Note */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-slate-800">
                الإجراءات والخدمات المنفذة بالجلسة:
              </label>
              <span className="text-xs font-black text-teal-700 font-mono">
                مجموع اليوم: {todayProceduresTotal} ج.م
              </span>
            </div>

            {procedures.length === 0 ? (
              <div className="p-3 text-center bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800">
                لم يقم الطبيب بتسجيل إجراءات بعد. يمكنك إضافة الإجراءات بالأسفل يدوياً.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden max-h-44 overflow-y-auto bg-slate-50">
                {procedures.map((p, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800">• {p.name}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={p.price}
                        onChange={(e) => handleUpdatePrice(idx, e.target.value)}
                        className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg text-left text-xs font-black text-teal-700"
                      />
                      <span className="text-[11px] text-slate-500">ج.م</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveProcedure(idx)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick add custom procedure with Autocomplete */}
            <div className="mt-2.5 flex gap-2 relative">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="+ إضافة خدمة (مثل: طربوش، حشو...)"
                  value={newProcName}
                  onChange={(e) => setNewProcName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden"
                />
                {suggestions.length > 0 && (
                  <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-36 overflow-y-auto divide-y text-xs">
                    {suggestions.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => handleAddProcedure(s.name, s.default_price)}
                        className="p-2 hover:bg-teal-50 cursor-pointer flex justify-between font-bold"
                      >
                        <span>{s.name}</span>
                        <span className="text-teal-700">{s.default_price} ج.م</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="number"
                placeholder="السعر"
                value={newProcPrice}
                onChange={(e) => setNewProcPrice(e.target.value)}
                className="w-24 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-center font-bold"
              />

              <button
                type="button"
                onClick={() => handleAddProcedure(newProcName, newProcPrice || 0)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                + إضافة
              </button>
            </div>
          </div>

          {/* 2. Automated Financial Ledger Card */}
          <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-2.5 text-xs">
            <div className="flex justify-between font-bold text-slate-700">
              <span>إجمالي جلسة اليوم:</span>
              <span className="font-mono text-sm text-slate-900">{todayProceduresTotal} ج.م</span>
            </div>

            <div className="flex justify-between font-bold text-emerald-700">
              <span>الدفعة المبدئية المسددة (مقدم الحجز):</span>
              <span className="font-mono text-sm">- {depositPaid} ج.م</span>
            </div>

            {priorDebt > 0 && (
              <div className="flex justify-between font-black text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  مديونية سابقة على المريض من جلسات أخرى:
                </span>
                <span className="font-mono text-sm">+ {priorDebt} ج.م</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-sm font-black text-slate-900">
              <span>المطلوب للدفع الآن:</span>
              <span className="text-xl font-black text-teal-700 font-mono">
                {netDueTotal} ج.م
              </span>
            </div>
          </div>

          {/* 3. Amount Paid Now Input */}
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-xs font-black text-slate-800 mb-1">
                المبلغ المدفوع الآن (ج.م) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="number"
                  required
                  step="any"
                  min="0"
                  value={amountPaidNow}
                  onChange={(e) => setAmountPaidNow(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl text-base font-black text-emerald-700 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Remaining status */}
            <div className={`p-2.5 rounded-xl border text-center font-bold text-xs ${
              remainingAfterPayment === 0
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              <span className="block text-[10px] text-slate-500">الباقي بعد هذا الدفع:</span>
              <span className="text-sm font-black">
                {remainingAfterPayment === 0 ? '✓ تم السداد بالكامل (خالص)' : `${remainingAfterPayment} ج.م (يُرحل كمديونية)`}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">ملاحظة الدفع (اختياري)</label>
            <input
              type="text"
              placeholder="مثال: دفع نقدي كاش / فودافون كاش"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          {/* Buttons */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-1 -mx-5 sm:-mx-6 px-5 sm:px-6 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-black shadow-md shadow-emerald-600/20 flex items-center gap-2 transition"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'جاري الحفظ...' : 'دفع وإنهاء الزيارة ✓'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
