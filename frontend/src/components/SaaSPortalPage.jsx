import React, { useState, useEffect } from 'react';
import { 
  Crown, RefreshCw, Calendar, CheckCircle2, 
  AlertTriangle, Building2, Phone, User, Plus, Shield, Ban, 
  Sparkles, KeyRound, LogOut, Search, MessageCircle, X, Check, Eye, EyeOff, Trash2 
} from 'lucide-react';
import ToothIcon from './ToothIcon';
import { api } from '../api';

export default function SaaSPortalPage({ user, onLogout, onPasswordChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  // Delete clinic state
  const [clinicToDelete, setClinicToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Change password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState(null);

  // Add clinic modal
  const [showAddClinic, setShowAddClinic] = useState(false);
  const [clinicName, setClinicName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorUsername, setDoctorUsername] = useState('');
  const [doctorPassword, setDoctorPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [planName, setPlanName] = useState('الاشتراك الشهري الاحترافي');
  const [monthlyPrice, setMonthlyPrice] = useState('500');
  const [days, setDays] = useState('30');

  const fetchClinics = async () => {
    setLoading(true);
    try {
      const res = await api.getSaaSClinics();
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  const handleRenew = async (clinicId, daysToRenew) => {
    setActionLoading(true);
    setMsg(null);
    setError(null);
    try {
      const res = await api.renewSaaSSubscription(clinicId, daysToRenew);
      setMsg(res.message);
      fetchClinics();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggle = async (clinicId) => {
    setActionLoading(true);
    setMsg(null);
    setError(null);
    try {
      const res = await api.toggleSaaSClinicStatus(clinicId);
      setMsg(res.message);
      fetchClinics();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDeleteClinic = async () => {
    if (!clinicToDelete) return;
    setDeleteLoading(true);
    setMsg(null);
    setError(null);
    try {
      const res = await api.deleteSaaSClinic(clinicToDelete.id);
      setMsg(res.message);
      setClinicToDelete(null);
      fetchClinics();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreateClinic = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMsg(null);
    setError(null);
    try {
      const res = await api.createSaaSClinic({
        clinic_name: clinicName.trim(),
        doctor_name: doctorName.trim(),
        doctor_username: doctorUsername.trim().toLowerCase(),
        doctor_password: doctorPassword.trim(),
        phone: phone.trim(),
        plan_name: planName,
        monthly_price: parseFloat(monthlyPrice) || 500,
        days: parseInt(days) || 30
      });
      setMsg(res.message);
      setShowAddClinic(false);
      setClinicName('');
      setDoctorName('');
      setDoctorUsername('');
      setDoctorPassword('');
      setPhone('');
      fetchClinics();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError(null);
    if (newPassword !== confirmPassword) {
      setPwdError('كلمة المرور الجديدة غير متطابقة مع تأكيد كلمة المرور');
      return;
    }
    setPwdLoading(true);
    try {
      const res = await api.changePassword({
        old_password: oldPassword,
        new_password: newPassword
      });
      setMsg(res.message);
      setShowPasswordModal(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (onPasswordChanged) onPasswordChanged();
    } catch (err) {
      setPwdError(err.message);
    } finally {
      setPwdLoading(false);
    }
  };

  const stats = data?.statistics || {};
  const rawClinics = data?.clinics || [];

  const filteredClinics = rawClinics.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (c.name || '').toLowerCase().includes(q) ||
           (c.doctor_name || '').toLowerCase().includes(q) ||
           (c.invite_code || '').toLowerCase().includes(q) ||
           (c.phone || '').includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-['Cairo',sans-serif] antialiased">
      
      {/* Top Navigation Bar */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black text-white leading-tight">DentFlow Pro</h1>
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                    بوابة مدير المنصة (SaaS Admin)
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-bold">لوحة التحكم المركزية لإدارة العيادات والاشتراكات الشهرية</p>
              </div>
            </div>

            {/* Admin Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* WhatsApp Quick Display */}
              <a
                href="https://wa.me/201011079572"
                target="_blank"
                rel="noreferrer"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold transition"
                title="رقم الواتساب المسجل لخدمة العملاء والتجديد"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>واتساب الدعم: 01011079572</span>
              </a>

              {/* Change Password Button */}
              <button
                type="button"
                onClick={() => { setShowPasswordModal(true); setPwdError(null); }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-black flex items-center gap-1.5 transition"
                title="تغيير كلمة المرور الخاصة بحساب المدير"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">تغيير كلمة المرور</span>
              </button>

              {/* Logout Button */}
              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 rounded-xl text-xs font-black flex items-center gap-1.5 transition"
                title="تسجيل الخروج والعودة لشاشة الدخول"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Feedback Alerts */}
        {msg && (
          <div className="p-4 bg-emerald-950/80 border border-emerald-600/40 rounded-2xl text-xs font-bold text-emerald-200 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{msg}</span>
            </div>
            <button onClick={() => setMsg(null)} className="text-emerald-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-950/80 border border-red-600/40 rounded-2xl text-xs font-bold text-red-200 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl shadow-lg">
            <div className="text-xs font-bold text-slate-400">إجمالي العيادات المشتركة:</div>
            <div className="text-2xl font-black text-white mt-1.5">{stats.total_clinics || 0}</div>
            <div className="text-[11px] text-slate-500 mt-1">عيادات مسجلة بالمنصة</div>
          </div>

          <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl shadow-lg">
            <div className="text-xs font-bold text-emerald-400">الاشتراكات النشطة والشغالة:</div>
            <div className="text-2xl font-black text-emerald-300 mt-1.5">{stats.active_clinics || 0}</div>
            <div className="text-[11px] text-emerald-500/80 mt-1">تعمل بشكل سليم</div>
          </div>

          <div className="p-4 bg-amber-950/30 border border-amber-800/40 rounded-2xl shadow-lg">
            <div className="text-xs font-bold text-amber-400">اشتراكات قاربت على الانتهاء:</div>
            <div className="text-2xl font-black text-amber-300 mt-1.5">{stats.expiring_soon || 0}</div>
            <div className="text-[11px] text-amber-500/80 mt-1">خلال 7 أيام أو أقل</div>
          </div>

          <div className="p-4 bg-teal-950/30 border border-teal-800/40 rounded-2xl shadow-lg">
            <div className="text-xs font-bold text-teal-400">الإيراد الشهري المتوقع:</div>
            <div className="text-2xl font-black text-teal-300 mt-1.5">{stats.total_monthly_revenue || 0} ج.م</div>
            <div className="text-[11px] text-teal-500/80 mt-1">إجمالي رسوم الاشتراكات</div>
          </div>
        </div>

        {/* Action Header & Search Bar */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          {/* Search */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، كود العيادة، اسم الدكتور، أو الهاتف..."
              className="w-full pr-10 pl-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={fetchClinics}
              disabled={loading}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl transition"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setShowAddClinic(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>+ إضافة عيادة جديدة</span>
            </button>
          </div>
        </div>

        {/* Clinics Table */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold">
                <tr>
                  <th className="py-3.5 px-4">العيادة والكود</th>
                  <th className="py-3.5 px-4">الطبيب المالك</th>
                  <th className="py-3.5 px-4">قيمة الاشتراك</th>
                  <th className="py-3.5 px-4">تاريخ الانتهاء</th>
                  <th className="py-3.5 px-4">حالة الاشتراك</th>
                  <th className="py-3.5 px-4 text-center">إجراءات التجديد الفوري ⚡</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredClinics.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-500 font-bold">
                      {loading ? 'جاري تحميل قائمة العيادات...' : 'لا توجد عيادات مطابقة للبحث'}
                    </td>
                  </tr>
                ) : (
                  filteredClinics.map((c) => {
                    const daysLeft = c.days_remaining;
                    const isExp = !c.is_subscription_active;
                    const isWarn = daysLeft > 0 && daysLeft <= 7;

                    return (
                      <tr key={c.id} className="hover:bg-slate-900/60 transition">
                        {/* Clinic & Code */}
                        <td className="py-3.5 px-4">
                          <span className="font-black text-white text-sm block">{c.name}</span>
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md font-mono text-[10px] font-black bg-slate-800 text-amber-400 border border-slate-700" dir="ltr">
                            {c.invite_code}
                          </span>
                        </td>

                        {/* Doctor info */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-200 block">{c.doctor_name}</span>
                          {c.phone ? (
                            <span className="text-[11px] font-mono text-slate-400 block" dir="ltr">{c.phone}</span>
                          ) : (
                            <span className="text-[10px] text-slate-500">بدون هاتف</span>
                          )}
                        </td>

                        {/* Plan */}
                        <td className="py-3.5 px-4 font-bold text-slate-300">
                          {c.monthly_price} ج.م / شهر
                          <span className="block text-[10px] text-slate-500">{c.plan_name}</span>
                        </td>

                        {/* Expiry Date */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-300" dir="ltr">
                          {c.subscription_end_date}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2.5 py-1 rounded-xl font-black text-[11px] ${
                            isExp
                              ? 'bg-red-950 border border-red-700 text-red-300'
                              : isWarn
                              ? 'bg-amber-950 border border-amber-600 text-amber-300 animate-pulse'
                              : 'bg-emerald-950 border border-emerald-700 text-emerald-300'
                          }`}>
                            {isExp ? 'منتهي الصلاحية' : `${daysLeft} يوم متبقي`}
                          </span>
                        </td>

                        {/* Quick Renewal Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleRenew(c.id, 30)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg transition text-[11px] shadow-sm"
                              title="تجديد شهر إضافي فور استلام التحويل"
                            >
                              +30 يوم ⚡
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRenew(c.id, 90)}
                              disabled={actionLoading}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold rounded-lg transition text-[11px]"
                              title="تجديد 3 أشهر (ربع سنوي)"
                            >
                              +3 أشهر
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggle(c.id)}
                              disabled={actionLoading}
                              className={`p-1.5 rounded-lg border transition ${
                                c.is_active
                                  ? 'bg-red-950/60 hover:bg-red-900 border-red-800 text-red-300'
                                  : 'bg-emerald-950/60 hover:bg-emerald-900 border-emerald-800 text-emerald-300'
                              }`}
                              title={c.is_active ? 'تجميد العيادة' : 'إلغاء التجميد والتفعيل'}
                            >
                              {c.is_active ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => setClinicToDelete(c)}
                              disabled={actionLoading}
                              className="p-1.5 rounded-lg border border-red-800/80 bg-red-950/70 hover:bg-red-900 text-red-400 hover:text-white transition"
                              title="حذف العيادة وحساب الطبيب نهائياً من المنصة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* WhatsApp Notice Banner */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              رقم الواتساب المسجل للعيادات في شاشة انتهاء الاشتراك: <strong className="text-white font-mono" dir="ltr">01011079572</strong>
            </span>
          </div>
          <a
            href="https://wa.me/201011079572"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition"
          >
            تجربة رابط الواتساب ↗
          </a>
        </div>
      </main>

      {/* Change Admin Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-sm w-full p-6 text-right shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                تغيير كلمة مرور المدير (Admin)
              </h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {pwdError && (
              <div className="p-3 bg-red-950/80 border border-red-700 rounded-xl text-xs text-red-300 font-bold">
                {pwdError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">كلمة المرور الحالية (اختياري)</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="•••••••• (يمكن تركه فارغاً للتعيين المباشر)"
                  dir="ltr"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white text-left focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">كلمة المرور الجديدة *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white text-left focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">تأكيد كلمة المرور الجديدة *</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white text-left focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-md transition"
                >
                  {pwdLoading ? 'جاري التحديث...' : 'تأكيد الحفظ ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Clinic Modal */}
      {showAddClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-lg w-full p-6 text-right shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                + إضافة عيادة جديدة واشتراك لطبيب
              </h3>
              <button onClick={() => setShowAddClinic(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClinic} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">اسم العيادة *</label>
                  <input
                    type="text"
                    required
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="عيادة الدكتور للأسنان"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">اسم الطبيب بالكامل *</label>
                  <input
                    type="text"
                    required
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="د. أحمد الشناوي"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">اسم المستخدم للدكتور *</label>
                  <input
                    type="text"
                    required
                    value={doctorUsername}
                    onChange={(e) => setDoctorUsername(e.target.value)}
                    placeholder="dr_ahmed"
                    dir="ltr"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white text-left focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">كلمة المرور للدكتور *</label>
                  <input
                    type="password"
                    required
                    value={doctorPassword}
                    onChange={(e) => setDoctorPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white text-left focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    dir="ltr"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white text-left focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">قيمة الاشتراك (ج.م)</label>
                  <input
                    type="number"
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(e.target.value)}
                    placeholder="500"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">فترة البدء (أيام)</label>
                  <input
                    type="number"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    placeholder="30"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddClinic(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-md transition"
                >
                  {actionLoading ? 'جاري الإنشاء...' : 'حفظ وإنشاء العيادة ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Clinic Confirmation Modal */}
      {clinicToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border-2 border-red-700/60 rounded-3xl max-w-sm w-full p-6 text-right shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-700 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-black text-white">تأكيد حذف العيادة والحساب نهائياً</h3>
              <p className="text-xs text-slate-400 font-bold mt-2 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف عيادة <strong className="text-red-300">({clinicToDelete.name})</strong> وحساب الطبيب <strong className="text-white">({clinicToDelete.doctor_name})</strong>؟
              </p>
              <p className="text-[11px] text-red-400 font-bold mt-2 bg-red-950/50 p-2.5 rounded-xl border border-red-900/50">
                ⚠️ تحذير: سيتم مسح حساب الطبيب والمساعدين وكافة السجلات نهائياً ولا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClinicToDelete(null)}
                className="w-1/2 py-2 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={confirmDeleteClinic}
                className="w-1/2 py-2 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition"
              >
                {deleteLoading ? 'جاري الحذف...' : 'نعم، حذف نهائي 🗑️'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
