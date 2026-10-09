import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, Clock, Shield, LogOut, UserCircle2, 
  Users, DollarSign, Stethoscope, AlertCircle, Type, Edit3, X, Check, Settings, 
  UserPlus, Crown, Building2, Copy, CheckCheck, Sparkles, MessageCircle, Phone 
} from 'lucide-react';
import ToothIcon from './ToothIcon';
import { api } from '../api';

export default function Header({ 
  user, 
  activeTab, 
  setActiveTab, 
  selectedDate, 
  setSelectedDate, 
  selectedShift, 
  setSelectedShift, 
  onLogout,
  fontScale,
  setFontScale,
  shiftTimes,
  onUpdateShiftTimes,
  onOpenStaffModal,
  onOpenSaaSOwnerModal,
  onClinicUpdated
}) {
  const [showEditShiftModal, setShowEditShiftModal] = useState(false);
  const [morningInput, setMorningInput] = useState(shiftTimes?.morning || '9:00 ص - 2:00 م');
  const [eveningInput, setEveningInput] = useState(shiftTimes?.evening || '5:00 م - 10:00 م');
  const [copiedCode, setCopiedCode] = useState(false);

  // Clinic Phone Edit state in settings
  const clinic = user?.clinic_info;
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [clinicPhoneInput, setClinicPhoneInput] = useState(clinic?.phone || '');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneSuccessMsg, setPhoneSuccessMsg] = useState('');

  useEffect(() => {
    if (clinic?.phone !== undefined) {
      setClinicPhoneInput(clinic.phone || '');
    }
  }, [clinic?.phone]);

  // Settings dropdown state
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyCode = () => {
    const code = user?.clinic_info?.invite_code;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSavePhone = async (e) => {
    e.preventDefault();
    setSavingPhone(true);
    setPhoneSuccessMsg('');
    try {
      const res = await api.updateClinicSettings({ phone: clinicPhoneInput.trim() });
      if (onClinicUpdated) {
        onClinicUpdated(res.clinic);
      }
      setIsEditingPhone(false);
      setPhoneSuccessMsg('تم حفظ رقم هاتف العيادة بنجاح ✓');
      setTimeout(() => setPhoneSuccessMsg(''), 3500);
    } catch (err) {
      alert(`خطأ في حفظ رقم العيادة: ${err.message}`);
    } finally {
      setSavingPhone(false);
    }
  };

  const handleSaveShiftTimes = (e) => {
    e.preventDefault();
    if (onUpdateShiftTimes) {
      onUpdateShiftTimes({
        morning: morningInput.trim() || '9:00 ص - 2:00 م',
        evening: eveningInput.trim() || '5:00 م - 10:00 م'
      });
    }
    setShowEditShiftModal(false);
  };

  // Arabic day name
  const dateObj = new Date(selectedDate);
  const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dayName = arabicDays[dateObj.getDay()];

  const daysLeft = clinic?.days_remaining;
  const isExpiringSoon = daysLeft !== undefined && daysLeft > 0 && daysLeft <= 7;
  const isExpired = clinic && !clinic.is_subscription_active;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs font-['Cairo',sans-serif] w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          
          {/* Logo & Clinic Title with Dental Tooth Branding */}
          <div className="flex items-center gap-2 sm:gap-3 shrink min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center shadow-md shadow-teal-600/20 shrink-0">
              <ToothIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-lg font-black text-slate-900 leading-tight whitespace-nowrap">DentFlow Pro</h1>
                <span className="hidden sm:inline-block text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-lg truncate max-w-[120px]">
                  {clinic?.name ? clinic.name.split(' ')[0] + ' ' + (clinic.name.split(' ')[1] || '') : 'عيادة الأسنان'}
                </span>
              </div>
              <p className="hidden md:block text-xs text-slate-500 font-bold">نظام إدارة العيادة الذكي وترتيب الطابور</p>
            </div>
          </div>

          {/* Navigation Tabs (Desktop only - mobile uses bottom nav) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'queue'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>لوحة الاستقبال</span>
            </button>

            <button
              onClick={() => setActiveTab('patients')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'patients'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>سجل المرضى</span>
            </button>

            {user?.is_doctor && (
              <button
                onClick={() => setActiveTab('doctor_clinic')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  activeTab === 'doctor_clinic'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="w-4 h-4 text-emerald-400" />
                <span>شاشة الطبيب (الكشف)</span>
              </button>
            )}

            {user?.is_doctor && (
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>لوحة الطبيب المالية</span>
              </button>
            )}
          </nav>

          {/* User Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* SaaS Platform Owner Button (If superuser / saas_admin) */}
            {user?.is_saas_admin && (
              <button
                type="button"
                onClick={onOpenSaaSOwnerModal}
                className="px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white rounded-xl text-xs font-black shadow-md shadow-amber-500/25 flex items-center gap-1.5 transition"
                title="لوحة تحكم صاحب المنصة وإدارة اشتراكات العيادات"
              >
                <Crown className="w-4 h-4 text-amber-200" />
                <span className="hidden sm:inline">لوحة المنصة (SaaS)</span>
              </button>
            )}

            {/* Pending Assistant Requests Notification (For Doctor) */}
            {user?.is_doctor && user?.pending_assistants_count > 0 && (
              <button
                type="button"
                onClick={onOpenStaffModal}
                className="px-2 sm:px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 border-2 border-amber-300 text-amber-950 rounded-xl text-xs font-black flex items-center gap-1 transition shadow-xs animate-pulse"
                title="يوجد طلبات انضمام مساعدين بانتظار موافقتك"
              >
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>({user.pending_assistants_count})</span>
              </button>
            )}

            {/* Settings Gear Dropdown */}
            <div className="relative" ref={settingsRef}>
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 sm:p-2 rounded-xl border transition flex items-center justify-center ${
                  showSettings
                    ? 'bg-teal-50 border-teal-400 text-teal-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="الإعدادات وحجم الخط والعيادة"
              >
                <Settings className="w-4 h-4" />
              </button>

              {showSettings && (
                <div className="fixed inset-x-3 top-16 sm:inset-x-auto sm:left-0 sm:right-auto sm:absolute sm:top-full mt-2 w-auto sm:w-80 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-4 z-50 text-right animate-in fade-in zoom-in-95 duration-100">
                  
                  {/* Clinic Info & Invite Code */}
                  {clinic && (
                    <div className="pb-3 border-b border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 block truncate max-w-[180px]">
                          🏥 {clinic.name}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isExpired 
                            ? 'bg-red-100 text-red-800' 
                            : isExpiringSoon 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isExpired ? 'الاشتراك منتهي' : `${daysLeft} يوم متبقي`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px]">
                        <span className="font-bold text-slate-600">كود انضمام المساعدين:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-teal-800" dir="ltr">{clinic.invite_code}</span>
                          <button
                            type="button"
                            onClick={handleCopyCode}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500"
                            title="نسخ كود العيادة"
                          >
                            {copiedCode ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Clinic Contact Phone Editor */}
                      <div className="pt-2 border-t border-slate-200/80">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-teal-600" />
                            <span>رقم العيادة (على التذاكر):</span>
                          </span>
                          {!isEditingPhone && (
                            <button
                              type="button"
                              onClick={() => setIsEditingPhone(true)}
                              className="text-[10px] font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>تغيير</span>
                            </button>
                          )}
                        </div>

                        {isEditingPhone ? (
                          <form onSubmit={handleSavePhone} className="space-y-2 mt-1">
                            <div className="relative">
                              <input
                                type="text"
                                value={clinicPhoneInput}
                                onChange={(e) => setClinicPhoneInput(e.target.value)}
                                placeholder="مثال: 01011079572"
                                dir="ltr"
                                autoFocus
                                className="w-full pl-3 pr-8 py-1.5 bg-slate-50 border border-teal-400 rounded-xl text-xs font-bold font-mono focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                              />
                              <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                            </div>

                            <div className="flex items-center gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditingPhone(false);
                                  setClinicPhoneInput(clinic.phone || '');
                                }}
                                className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 rounded-lg text-xs font-bold"
                              >
                                إلغاء
                              </button>
                              <button
                                type="submit"
                                disabled={savingPhone}
                                className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs disabled:opacity-50"
                              >
                                {savingPhone ? 'جاري الحفظ...' : 'حفظ الرقم ✓'}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px]">
                            <span className="text-slate-500">هاتف الاستقبال:</span>
                            <span className="font-mono font-bold text-slate-800" dir="ltr">
                              {clinic.phone || '01011079572'}
                            </span>
                          </div>
                        )}

                        {phoneSuccessMsg && (
                          <p className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1 animate-in fade-in">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>{phoneSuccessMsg}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Font Size Section */}
                  <div className="py-3 border-b border-slate-100">
                    <label className="block text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5">
                      <Type className="w-4 h-4 text-teal-600" />
                      <span>حجم الخط والنصوص:</span>
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setFontScale('normal')}
                        className={`py-1.5 rounded-lg text-xs font-bold transition text-center ${
                          fontScale === 'normal'
                            ? 'bg-white text-teal-800 shadow-xs font-black'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        عادي
                      </button>
                      <button
                        type="button"
                        onClick={() => setFontScale('large')}
                        className={`py-1.5 rounded-lg text-xs font-bold transition text-center ${
                          fontScale === 'large'
                            ? 'bg-white text-teal-800 shadow-xs font-black'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        كبير
                      </button>
                      <button
                        type="button"
                        onClick={() => setFontScale('xlarge')}
                        className={`py-1.5 rounded-lg text-xs font-bold transition text-center ${
                          fontScale === 'xlarge'
                            ? 'bg-white text-teal-800 shadow-xs font-black'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        كبير جداً
                      </button>
                    </div>
                  </div>

                  {/* Staff Management Button */}
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSettings(false);
                        if (onOpenStaffModal) onOpenStaffModal();
                      }}
                      className="w-full p-2.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 rounded-xl text-xs font-black flex items-center justify-between transition"
                    >
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-teal-700" />
                        <span>إدارة فريق العمل والمساعدين</span>
                      </span>
                      {user?.pending_assistants_count > 0 ? (
                        <span className="text-[10px] bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded-full font-black">
                          {user.pending_assistants_count} معلق
                        </span>
                      ) : (
                        <span className="text-[10px] bg-teal-200 text-teal-900 px-1.5 py-0.5 rounded-md font-bold">
                          فتح
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Current Logged-in User Pill */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl max-w-[110px] sm:max-w-none">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                {user?.is_doctor ? <Stethoscope className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <UserCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </div>
              <div className="text-right min-w-0">
                <div className="text-[11px] sm:text-xs font-black text-slate-900 leading-tight truncate">
                  {user?.full_name || user?.username}
                </div>
                <div className="hidden sm:block text-[10px] font-bold text-teal-700 leading-tight">
                  {user?.role_display || (user?.is_doctor ? 'طبيب' : 'مساعد')}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              title="تسجيل الخروج"
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Secondary Sub-Bar: Date, Shift, and Subscription Alerts */}
        <div className="py-2 sm:py-2.5 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 text-xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Date Picker */}
            <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shrink-0">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="font-black text-slate-700">{dayName}</span>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-hidden text-xs cursor-pointer"
              />
            </div>

            {/* Shift Picker with Edit Pencil Button */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <div className="grid grid-cols-2 gap-1 flex-1">
                <button
                  type="button"
                  onClick={() => setSelectedShift('MORNING')}
                  className={`px-2.5 py-1.5 rounded-lg font-black transition text-xs flex items-center justify-center gap-1 ${
                    selectedShift === 'MORNING'
                      ? 'bg-white text-teal-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>الصباحي</span>
                  <span className="hidden xl:inline font-normal text-[10px]">({shiftTimes?.morning || '9:00 ص - 2:00 م'})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedShift('EVENING')}
                  className={`px-2.5 py-1.5 rounded-lg font-black transition text-xs flex items-center justify-center gap-1 ${
                    selectedShift === 'EVENING'
                      ? 'bg-white text-teal-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>المسائي</span>
                  <span className="hidden xl:inline font-normal text-[10px]">({shiftTimes?.evening || '5:00 م - 10:00 م'})</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMorningInput(shiftTimes?.morning || '9:00 ص - 2:00 م');
                  setEveningInput(shiftTimes?.evening || '5:00 م - 10:00 م');
                  setShowEditShiftModal(true);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-teal-700 transition shrink-0"
                title="تعديل ساعات وأوقات الشفتات"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Subscription Expiry Alert / Live Notice */}
          <div className="flex items-center justify-center md:justify-end gap-2 text-center">
            {isExpiringSoon && (
              <div className="w-full sm:w-auto px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold flex items-center justify-center gap-1.5 text-[11px] animate-pulse">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>تنبيه اشتراك المنصة: متبقي {daysLeft} أيام</span>
              </div>
            )}

            {isExpired && (
              <div className="w-full sm:w-auto px-3 py-1.5 bg-red-100 text-red-900 border border-red-300 rounded-xl font-black flex items-center justify-center gap-2 text-[11px] flex-wrap">
                <AlertCircle className="w-3.5 h-3.5 text-red-700 shrink-0" />
                <span>انتهت فترة الاشتراك - للتجديد:</span>
                <a
                  href="https://wa.me/201011079572?text=مرحباً، أود تجديد اشتراك عيادتي في DentFlow Pro"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 shadow-xs transition"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>01011079572</span>
                </a>
              </div>
            )}

            {!isExpiringSoon && !isExpired && (
              <div className="hidden sm:flex text-[11px] text-slate-500 font-bold items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>التبديل التلقائي للشفت نشط حسب الوقت الفعلي</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Shift Modal */}
      {showEditShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border-2 border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 bg-teal-50 border-b border-teal-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-teal-700" />
                <h3 className="text-xs font-black text-slate-900">تعديل مواعيد وساعات الشفتات</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowEditShiftModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveShiftTimes} className="p-5 space-y-3.5 text-xs text-right">
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">
                  أوقات الشفت الصباحي:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: 9:00 ص - 2:00 م"
                  value={morningInput}
                  onChange={(e) => setMorningInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">
                  أوقات الشفت المسائي:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: 5:00 م - 10:00 م"
                  value={eveningInput}
                  onChange={(e) => setEveningInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditShiftModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:text-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black flex items-center gap-1.5 shadow-xs transition"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ المواعيد</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
