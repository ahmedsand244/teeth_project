import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, User, Clock, CheckCircle2, Plus, 
  Trash2, AlertTriangle, ArrowRight, UserPlus, Sparkles, RefreshCw, Check
} from 'lucide-react';
import { api } from '../api';

export default function SeniorDoctorPortal({ 
  user, 
  selectedDate,
  onRefresh,
  showToast 
}) {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [currentApp, setCurrentApp] = useState(null);
  const [procedures, setProcedures] = useState([]);
  const [doctorNotes, setDoctorNotes] = useState('');
  
  // Custom procedure search / add
  const [searchProcedure, setSearchProcedure] = useState('');
  const [procedureSuggestions, setProcedureSuggestions] = useState([]);
  const [customPrice, setCustomPrice] = useState('');
  const [saving, setSaving] = useState(false);

  const loadDoctorData = async () => {
    setLoading(true);
    try {
      const data = await api.getDoctorDashboard(selectedDate);
      setDashboardData(data);
      if (data.current_patient) {
        setCurrentApp(data.current_patient);
        setProcedures(data.current_patient.procedures || []);
        setDoctorNotes(data.current_patient.doctor_notes || '');
      } else {
        setCurrentApp(null);
        setProcedures([]);
        setDoctorNotes('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorData();
  }, [selectedDate]);

  // Autocomplete suggestions for custom procedures
  useEffect(() => {
    if (searchProcedure.trim().length >= 1) {
      api.getServices(searchProcedure)
        .then(res => setProcedureSuggestions(res))
        .catch(() => setProcedureSuggestions([]));
    } else {
      setProcedureSuggestions([]);
    }
  }, [searchProcedure]);

  // Quick 1-click add procedure
  const handleAddProcedure = (name, price) => {
    const newProc = {
      id: Date.now(),
      name,
      price: parseFloat(price) || 0
    };
    setProcedures(prev => [...prev, newProc]);
    setSearchProcedure('');
    setCustomPrice('');
    setProcedureSuggestions([]);
  };

  const handleRemoveProcedure = (index) => {
    setProcedures(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateProcedurePrice = (index, newPrice) => {
    setProcedures(prev => prev.map((p, i) => i === index ? { ...p, price: parseFloat(newPrice) || 0 } : p));
  };

  // Call in next waiting patient
  const handleCallInPatient = async (appId) => {
    try {
      await api.callInPatient(appId);
      if (showToast) showToast('تم دخول المريض لغرفة الكشف');
      loadDoctorData();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`خطأ: ${err.message}`);
    }
  };

  // Save procedures & send to Reception
  const handleSaveAndSend = async () => {
    if (!currentApp) return;
    setSaving(true);
    try {
      await api.saveAppointmentProcedures(currentApp.id, {
        procedures: procedures.map(p => ({ name: p.name, price: p.price })),
        doctor_notes: doctorNotes,
        complete_and_send: true
      });
      if (showToast) showToast('✓ تم حفظ الإجراءات وإرسالها للاستقبال بنجاح!');
      loadDoctorData();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`خطأ في الحفظ: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const totalProceduresCost = procedures.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);

  // Common quick-click buttons
  const commonServices = dashboardData?.common_services || [
    { name: 'كشف', default_price: 100 },
    { name: 'خلع', default_price: 200 },
    { name: 'حشو عادي', default_price: 300 },
    { name: 'حشو عصب', default_price: 800 },
    { name: 'طربوش', default_price: 1200 },
    { name: 'ضرس / تركيبة', default_price: 1500 },
    { name: 'تنظيف جير', default_price: 250 },
    { name: 'أشعة', default_price: 100 },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-['Cairo',sans-serif]">
      {/* Top Banner / Doctor Welcome */}
      <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-md">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              غرفة الكشف - لوحة الطبيب
            </h1>
            <p className="text-sm font-bold text-slate-500 mt-0.5">
              تسجيل خدمات المريض وإرسالها فوراً للاستقبال
            </p>
          </div>
        </div>

        <button
          onClick={loadDoctorData}
          disabled={loading}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm flex items-center gap-2 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث الشاشة</span>
        </button>
      </div>

      {/* Main Examination Room Card */}
      {currentApp ? (
        <div className="bg-white rounded-3xl border-3 border-teal-500 shadow-lg overflow-hidden animate-in fade-in duration-200">
          {/* Header of Active Patient */}
          <div className="bg-teal-600 text-white p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="w-14 h-14 rounded-2xl bg-white text-teal-800 font-mono font-black text-2xl flex items-center justify-center shadow-inner">
                {currentApp.queue_number}
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-100 block">
                  المريض الحالي داخل الغرفة الآن
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                  {currentApp.patient_details?.name}
                </h2>
                <div className="flex items-center gap-3 text-sm text-teal-100 font-bold mt-1">
                  <span>{currentApp.patient_details?.gender === 'MALE' ? 'ذكر' : 'أنثى'}</span>
                  {currentApp.patient_details?.age && <span>• {currentApp.patient_details?.age} سنة</span>}
                  <span>• نوع الزيارة: {currentApp.visit_type_display}</span>
                </div>
              </div>
            </div>

            {/* Medical history or Allergy notice */}
            {currentApp.patient_details?.notes && (
              <div className="bg-amber-400 text-amber-950 px-4 py-2.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-sm">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-900" />
                <span>تنبيه طبي: {currentApp.patient_details.notes}</span>
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* 1. Quick 1-Click Procedure Buttons (Senior-Friendly Large Buttons) */}
            <div>
              <label className="block text-base sm:text-lg font-black text-slate-800 mb-3">
                اضغط لاختيار الإجراءات المطلوبة للمريض:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {commonServices.map((srv, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddProcedure(srv.name, srv.default_price)}
                    className="p-4 bg-slate-50 hover:bg-teal-50 hover:border-teal-500 border-2 border-slate-200 rounded-2xl text-right transition group active:scale-95 shadow-xs"
                  >
                    <span className="text-base sm:text-lg font-black text-slate-900 block group-hover:text-teal-800">
                      + {srv.name}
                    </span>
                    <span className="text-sm font-bold text-teal-600 block mt-1">
                      {srv.default_price} ج.م
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Custom Procedure Input / Search */}
            <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl relative">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                أو اكتب أي إجراء آخر غير موجود بالأعلى:
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="اكتب اسم الخدمة (مثلاً: زراعة، خلع جراحي، تبييض...)"
                    value={searchProcedure}
                    onChange={(e) => setSearchProcedure(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-base font-bold focus:border-teal-600 focus:outline-hidden"
                  />
                  {/* Suggestions dropdown */}
                  {procedureSuggestions.length > 0 && (
                    <div className="absolute top-full right-0 left-0 mt-1 bg-white border-2 border-teal-500 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y">
                      {procedureSuggestions.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => handleAddProcedure(s.name, s.default_price)}
                          className="p-3 hover:bg-teal-50 cursor-pointer flex justify-between items-center text-sm font-bold"
                        >
                          <span className="text-slate-900">{s.name}</span>
                          <span className="text-teal-700">{s.default_price} ج.م</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="w-full sm:w-36">
                  <input
                    type="number"
                    placeholder="السعر (ج.م)"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-base font-bold text-teal-700 text-center focus:border-teal-600 focus:outline-hidden"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (searchProcedure.trim()) {
                      handleAddProcedure(searchProcedure.trim(), customPrice || 0);
                    }
                  }}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-5 h-5" />
                  <span>إضافة</span>
                </button>
              </div>
            </div>

            {/* 3. Selected Procedures List */}
            <div className="space-y-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center justify-between">
                <span>الإجراءات التي تم اختيارها لهذه الجلسة ({procedures.length}):</span>
                <span className="text-2xl font-black text-emerald-700 font-mono">
                  الإجمالي: {totalProceduresCost} ج.م
                </span>
              </h3>

              {procedures.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 font-bold text-base">
                  لم يتم إضافة أي إجراءات بعد. اضغط على أحد الأزرار بالأعلى لإضافة خدمة للمريض.
                </div>
              ) : (
                <div className="border-2 border-slate-200 rounded-2xl divide-y-2 divide-slate-100 overflow-hidden bg-white shadow-xs">
                  {procedures.map((proc, index) => (
                    <div key={index} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 font-bold text-sm flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-lg font-black text-slate-900">
                          {proc.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border">
                          <span className="text-xs font-bold text-slate-500">السعر:</span>
                          <input
                            type="number"
                            value={proc.price}
                            onChange={(e) => handleUpdateProcedurePrice(index, e.target.value)}
                            className="w-24 bg-transparent font-black text-base text-emerald-700 text-center focus:outline-hidden"
                          />
                          <span className="text-xs font-bold text-slate-600">ج.م</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveProcedure(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"
                          title="حذف هذا الإجراء"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Optional Doctor Notes / Diagnosis */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                ملاحظات الطبيب / التشخيص (اختياري):
              </label>
              <textarea
                rows="2"
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder="اكتب أي ملاحظة عن حالة الأسنان أو خطة العلاج القادمة..."
                className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-base font-medium focus:bg-white focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            {/* 5. GIANT GREEN ACTION BUTTON: حفظ وإرسال للحسابات / إنهاء الكشف */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveAndSend}
                disabled={saving}
                className="w-full py-5 px-8 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl text-xl sm:text-2xl font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-3 transition transform active:scale-98"
              >
                <CheckCircle2 className="w-8 h-8" />
                <span>
                  {saving ? 'جاري الحفظ والإرسال...' : 'حفظ وإرسال للحسابات / إنهاء الكشف ✓'}
                </span>
              </button>
              <p className="text-center text-xs font-bold text-slate-500 mt-2">
                بمجرد الضغط، ستظهر تفاصيل الجلسة والأسعار فوراً على شاشة الاستقبال لتسوية الحساب وخروج المريض
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Examination Room State */
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-8 sm:p-12 text-center space-y-6 shadow-sm">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border-2 border-amber-200">
            <Clock className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              لا يوجد مريض بالداخل حالياً
            </h2>
            <p className="text-base text-slate-500 font-bold mt-1 max-w-md mx-auto">
              غرفة الكشف جاهزة. يمكنك طلب دخول المريض التالي مباشرة من القائمة بالأسفل بنقرة واحدة:
            </p>
          </div>

          {/* Next Waiting Patients List */}
          {dashboardData?.waiting_patients?.length > 0 ? (
            <div className="max-w-lg mx-auto space-y-3 pt-2 text-right">
              <span className="text-sm font-black text-slate-700 block">
                المرضى في الانتظار بالخارج:
              </span>
              {dashboardData.waiting_patients.map((app) => (
                <div
                  key={app.id}
                  className="p-4 bg-slate-50 border-2 border-slate-200 hover:border-teal-500 rounded-2xl flex items-center justify-between gap-3 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 font-black text-lg flex items-center justify-center font-mono">
                      {app.queue_number}
                    </span>
                    <div>
                      <span className="text-base font-black text-slate-900 block">
                        {app.patient_details?.name}
                      </span>
                      <span className="text-xs text-slate-500 font-bold">
                        {app.visit_type_display}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCallInPatient(app.id)}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black text-sm shadow-sm flex items-center gap-1.5 transition"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>دخول للطبيب</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm font-bold text-slate-400">
              لا توجد حالات في صالة الانتظار حالياً
            </div>
          )}
        </div>
      )}
    </div>
  );
}
