import React, { useState, useEffect } from 'react';
import { 
  CalendarPlus, X, User, Phone, DollarSign, AlertCircle, 
  Clock, Check, Search, UserCheck, AlertTriangle, Sparkles 
} from 'lucide-react';
import { api } from '../api';

export default function NewBookingModal({ 
  isOpen, 
  onClose, 
  initialData,
  selectedDate, 
  selectedShift, 
  onSuccess,
  onBookingCreated
}) {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isNewPatient, setIsNewPatient] = useState(false);

  // New patient fields (phone is optional)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('MALE');
  const [age, setAge] = useState('');
  const [patientNotes, setPatientNotes] = useState('');

  // Booking fields
  const [visitType, setVisitType] = useState('GENERAL_CHECKUP');
  const [bookingDate, setBookingDate] = useState(selectedDate);
  const [shift, setShift] = useState(selectedShift);
  const [appointmentTime, setAppointmentTime] = useState('');
  const [queueNumber, setQueueNumber] = useState('');

  // Initial deposit / booking fee (الدفعة المبدئية - الاستقبال لا يعرف التكلفة الكاملة)
  const [depositAmount, setDepositAmount] = useState('100');
  const [depositNotes, setDepositNotes] = useState('');
  const [isPreExistingOrtho, setIsPreExistingOrtho] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSelectVisitType = (type) => {
    setVisitType(type);
    if (type === 'ORTHO_FOLLOWUP') {
      setIsPreExistingOrtho(true);
      if (depositAmount === '100' || depositAmount === '') {
        setDepositAmount('0');
      }
    } else {
      if (type !== 'ORTHO_NEW_FIT') {
        setIsPreExistingOrtho(false);
      }
      if (depositAmount === '0') {
        setDepositAmount('100');
      }
    }
  };

  const handleTogglePreExistingOrtho = (checked) => {
    setIsPreExistingOrtho(checked);
    if (checked) {
      handleSelectVisitType('ORTHO_FOLLOWUP');
      setDepositAmount('0');
    } else {
      handleSelectVisitType('GENERAL_CHECKUP');
      setDepositAmount('100');
    }
  };

  // Pre-load patients when opened
  useEffect(() => {
    if (isOpen) {
      setBookingDate(selectedDate);
      setShift(selectedShift);
      setAppointmentTime('');
      setQueueNumber('');
      setDepositNotes('');
      setError(null);

      if (initialData?.patient) {
        setSelectedPatient(initialData.patient);
        setIsNewPatient(false);
      } else {
        setSelectedPatient(null);
        setIsNewPatient(false);
      }

      if (initialData?.visitType) {
        handleSelectVisitType(initialData.visitType);
      } else {
        setVisitType('GENERAL_CHECKUP');
        setDepositAmount('100');
      }

      api.getPatients().then(setPatients).catch(console.error);
    }
  }, [isOpen, selectedDate, selectedShift, initialData]);

  if (!isOpen) return null;

  const filteredPatients = patients.filter(p => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    return (p.name || '').toLowerCase().includes(q) || (p.phone || '').includes(q);
  });

  const depositNum = parseFloat(depositAmount) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let patientId = selectedPatient ? selectedPatient.id : null;

      if (isNewPatient) {
        if (!name.trim()) {
          throw new Error('يرجى كتابة اسم المريض');
        }
        let combinedNotes = patientNotes.trim();
        if (isPreExistingOrtho && !combinedNotes.includes('تقويم مركب مسبقاً')) {
          combinedNotes = combinedNotes ? `${combinedNotes} | [حالة تقويم مركب مسبقاً قبل النظام]` : '[حالة تقويم مركب مسبقاً قبل النظام]';
        }
        const created = await api.createPatient({
          name: name.trim(),
          phone: phone.trim(),
          gender,
          age: age ? parseInt(age) : null,
          notes: combinedNotes
        });
        patientId = created.id;
      }

      if (!patientId) {
        throw new Error('يرجى اختيار مريض من القائمة أو تسجيل مريض جديد');
      }

      const createdApp = await api.createAppointment({
        patient: patientId,
        visit_type: visitType,
        shift,
        visit_date: bookingDate,
        appointment_time: appointmentTime.trim(),
        queue_number: queueNumber ? parseInt(queueNumber) : undefined,
        initial_total_amount: depositNum, // Initially equal to deposit until doctor adds procedures
        initial_paid_amount: depositNum,
        initial_discount: 0,
        initial_invoice_notes: depositNotes || 'دفعة مبدئية عند الحجز بالاستقبال'
      });

      onSuccess('تم حجز الموعد وتسجيل الدفعة المبدئية بنجاح!');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 font-['Cairo',sans-serif]">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-2 border-slate-200 overflow-hidden max-h-[92vh] flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-teal-600 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">حجز موعد جديد بالاستقبال</h2>
              <p className="text-xs text-teal-100 font-bold">تسجيل المريض والدور وتحصيل المقدم</p>
            </div>
          </div>
          <button onClick={onClose} className="text-teal-200 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-start gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Patient Selection / Creation */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-slate-800">بيانات المريض:</label>
              <button
                type="button"
                onClick={() => {
                  setIsNewPatient(!isNewPatient);
                  setSelectedPatient(null);
                }}
                className="text-xs text-teal-700 font-bold hover:underline"
              >
                {isNewPatient ? '← اختيار مريض مسجل مسبقاً' : '+ تسجيل مريض جديد'}
              </button>
            </div>

            {isNewPatient ? (
              <div className="p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">اسم المريض *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="محمد أحمد إبراهيم"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">رقم الهاتف (اختياري)</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="010XXXXXXXX"
                      dir="ltr"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-left"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">العمر</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="السن بالسنين"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">النوع</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-2 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                    >
                      <option value="MALE">ذكر</option>
                      <option value="FEMALE">أنثى</option>
                    </select>
                  </div>
                </div>

                {/* Pre-existing Ortho Checkbox */}
                <label className="flex items-center gap-2.5 p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl cursor-pointer hover:bg-indigo-100/70 transition">
                  <input
                    type="checkbox"
                    checked={isPreExistingOrtho}
                    onChange={(e) => handleTogglePreExistingOrtho(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded-sm border-indigo-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="text-right">
                    <span className="block text-xs font-black text-indigo-950">
                      🦷 المريض مركب تقويم مسبقاً قبل إنشاء النظام
                    </span>
                    <span className="block text-[10px] font-bold text-indigo-700">
                      (حجز متابعة وشد فوري بدون كشف إجباري، والدفعة المبدئية 0 ج.م)
                    </span>
                  </div>
                </label>
              </div>
            ) : selectedPatient ? (
              /* Patient Selected Card with Outstanding Debt Notice */
              <div className="p-3.5 bg-teal-50 border-2 border-teal-300 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-teal-700" />
                    <span className="font-black text-sm text-slate-900">{selectedPatient.name}</span>
                    <span className="text-xs font-mono text-slate-500" dir="ltr">
                      {selectedPatient.phone || 'بدون هاتف'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPatient(null)}
                    className="text-xs text-teal-700 hover:text-teal-900 font-bold underline"
                  >
                    تغيير
                  </button>
                </div>

                {/* Outstanding Debt Alert */}
                {selectedPatient.total_remaining_balance > 0 && (
                  <div className="p-2.5 bg-amber-100 border border-amber-300 rounded-xl text-amber-950 font-black text-xs flex items-center gap-2 shadow-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
                    <span>
                      ⚠️ تنبيه: على المريض متبقي سابق: {selectedPatient.total_remaining_balance} ج.م (سيتم جدولتها وتسويتها تلقائياً عند خروجه)
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* Live Search with Debt Badges */
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="ابحث بالاسم أو رقم الهاتف..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-bold focus:bg-white focus:border-teal-500 focus:outline-hidden"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto border-2 border-slate-200 rounded-2xl divide-y divide-slate-100 bg-white">
                  {filteredPatients.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400 font-bold">
                      لا يوجد مريض بهذا الاسم.{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewPatient(true);
                          setName(searchTerm);
                        }}
                        className="text-teal-600 font-bold hover:underline"
                      >
                        + تسجيله كمريض جديد؟
                      </button>
                    </div>
                  ) : (
                    filteredPatients.slice(0, 6).map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPatient(p);
                          setSearchTerm('');
                        }}
                        className="p-3 hover:bg-teal-50/70 cursor-pointer flex items-center justify-between transition text-xs"
                      >
                        <div>
                          <span className="font-black text-slate-900 block">{p.name}</span>
                          <span className="text-[11px] text-slate-500 font-mono" dir="ltr">
                            {p.phone || 'بدون هاتف'}
                          </span>
                        </div>
                        {p.total_remaining_balance > 0 ? (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-lg font-black text-[11px]">
                            ⚠️ متبقي سابق: {p.total_remaining_balance} ج.م
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-bold text-[11px]">✓ خالص</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Visit Type */}
          <div>
            <label className="block text-xs font-black text-slate-800 mb-1.5">نوع الكشف / الزيارة:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleSelectVisitType('GENERAL_CHECKUP')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border-2 transition text-center ${
                  visitType === 'GENERAL_CHECKUP'
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                كشف
              </button>

              <button
                type="button"
                onClick={() => handleSelectVisitType('FOLLOWUP_CHECKUP')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border-2 transition text-center ${
                  visitType === 'FOLLOWUP_CHECKUP'
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                متابعة كشف
              </button>

              <button
                type="button"
                onClick={() => handleSelectVisitType('ORTHO_NEW_FIT')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border-2 transition text-center ${
                  visitType === 'ORTHO_NEW_FIT'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                تركيب تقويم
              </button>

              <button
                type="button"
                onClick={() => handleSelectVisitType('ORTHO_FOLLOWUP')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border-2 transition text-center ${
                  visitType === 'ORTHO_FOLLOWUP'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                متابعة تقويم (مركب سابقاً)
              </button>
            </div>

            {/* Informational Banner for Ortho Follow-up */}
            {visitType === 'ORTHO_FOLLOWUP' && (
              <div className="mt-2.5 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-950 text-xs font-bold flex items-start gap-2 shadow-xs">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black text-indigo-950 block">حالة تقويم مركب مسبقاً (متابعة وشد دوري):</span>
                  <span className="text-[11px] text-indigo-800 font-medium">
                    هذه الزيارة مخصصة للمتابعة والشد مباشرةً لحالات التقويم المركب قبل إنشاء النظام. لا يوجد كشف إجباري، والمقدم بالاستقبال اختياري (0 ج.م).
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Date, Shift, and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">تاريخ الحجز *</label>
              <input
                type="date"
                required
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold cursor-pointer focus:bg-white focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">فترة الشيفت *</label>
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 h-[38px] items-center">
                <button
                  type="button"
                  onClick={() => setShift('MORNING')}
                  className={`h-full rounded-lg text-xs font-black transition text-center flex items-center justify-center ${
                    shift === 'MORNING'
                      ? 'bg-white text-teal-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  صباحي
                </button>
                <button
                  type="button"
                  onClick={() => setShift('EVENING')}
                  className={`h-full rounded-lg text-xs font-black transition text-center flex items-center justify-center ${
                    shift === 'EVENING'
                      ? 'bg-white text-teal-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  مسائي
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">الساعة (اختياري)</label>
              <input
                type="text"
                placeholder="مثال: 10:00 ص"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Queue Number Manual Override */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">رقم الدور (اختياري):</label>
              <span className="text-[11px] text-slate-400">اتركه فارغاً للتسلسل التلقائي (1، 2، 3...)</span>
            </div>
            <input
              type="number"
              min="1"
              placeholder="تلقائي"
              value={queueNumber}
              onChange={(e) => setQueueNumber(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold font-mono"
            />
          </div>

          {/* Initial Deposit Section (لا يعرف الاستقبال التكلفة الإجمالية) */}
          <div className={`p-4 rounded-2xl border-2 space-y-2.5 transition-all ${
            visitType === 'ORTHO_FOLLOWUP'
              ? 'bg-indigo-50/70 border-indigo-200'
              : 'bg-teal-50/70 border-teal-200'
          }`}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <DollarSign className={`w-4 h-4 ${visitType === 'ORTHO_FOLLOWUP' ? 'text-indigo-600' : 'text-emerald-600'}`} />
                {visitType === 'ORTHO_FOLLOWUP' 
                  ? 'دفعة المتابعة / القسط (اختياري 0 ج.م):' 
                  : 'الدفعة المبدئية / رسوم الكشف بالاستقبال:'}
              </label>
              <span className={`text-[11px] font-bold ${visitType === 'ORTHO_FOLLOWUP' ? 'text-indigo-800' : 'text-teal-800'}`}>
                {visitType === 'ORTHO_FOLLOWUP' 
                  ? '(يمكن الحجز بـ 0 ج.م بدون كشف)' 
                  : '(التكلفة الكاملة يحددها الطبيب بالداخل)'}
              </span>
            </div>

            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="number"
                step="any"
                min="0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder={visitType === 'ORTHO_FOLLOWUP' ? "0" : "100"}
                className={`w-full pr-9 pl-3 py-2.5 bg-white border-2 rounded-xl text-base font-black focus:outline-hidden ${
                  visitType === 'ORTHO_FOLLOWUP'
                    ? 'border-indigo-300 text-indigo-700'
                    : 'border-teal-300 text-emerald-700'
                }`}
              />
            </div>

            <input
              type="text"
              placeholder={visitType === 'ORTHO_FOLLOWUP'
                ? "ملاحظات الدفع (مثال: متابعة بدون مقدم / قسط دوري)..."
                : "ملاحظات دفع المقدم (مثال: كاش بالاستقبال / بدون مقدم)..."}
              value={depositNotes}
              onChange={(e) => setDepositNotes(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
            />
          </div>

          {/* Action Buttons */}
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
              className="px-7 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-sm font-black shadow-md shadow-teal-600/20 flex items-center gap-2 transition"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'جاري الحجز...' : 'تأكيد الحجز والدور ✓'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
