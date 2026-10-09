import React, { useState, useEffect } from 'react';
import { 
  Crown, X, RefreshCw, Calendar, CheckCircle2, 
  AlertTriangle, Building2, Phone, User, Plus, Shield, Ban, Sparkles 
} from 'lucide-react';
import ToothIcon from './ToothIcon';
import { api } from '../api';

export default function SaaSOwnerDashboardModal({ isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  // New clinic modal
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
    if (isOpen) {
      setMsg(null);
      setError(null);
      fetchClinics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

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

  const stats = data?.statistics || {};
  const clinics = data?.clinics || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 overflow-y-auto font-['Cairo',sans-serif]">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border-2 border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">لوحة تحكم صاحب المنصة (SaaS Admin)</h2>
                <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  المدير العام
                </span>
              </div>
              <p className="text-xs text-slate-400 font-bold">إدارة اشتراكات العيادات وتجديد الفترات ومتابعة الإيرادات</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alerts */}
        {msg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{msg}</span>
          </div>
        )}

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* SaaS Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl">
              <div className="text-[11px] font-bold text-slate-500">إجمالي العيادات:</div>
              <div className="text-xl font-black text-slate-900 mt-1">{stats.total_clinics || 0}</div>
            </div>

            <div className="p-3.5 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
              <div className="text-[11px] font-bold text-emerald-700">الاشتراكات النشطة:</div>
              <div className="text-xl font-black text-emerald-800 mt-1">{stats.active_clinics || 0}</div>
            </div>

            <div className="p-3.5 bg-amber-50 border-2 border-amber-200 rounded-2xl">
              <div className="text-[11px] font-bold text-amber-700">تنتهي قريباً (≤7 أيام):</div>
              <div className="text-xl font-black text-amber-800 mt-1">{stats.expiring_soon || 0}</div>
            </div>

            <div className="p-3.5 bg-teal-50 border-2 border-teal-200 rounded-2xl">
              <div className="text-[11px] font-bold text-teal-700">الإيراد الشهري المتوقع:</div>
              <div className="text-xl font-black text-teal-900 mt-1">{stats.total_monthly_revenue || 0} ج.م</div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-700" />
              <span>قائمة العيادات المشتركة في المنصة ({clinics.length}):</span>
            </h3>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchClinics}
                disabled={loading}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                title="تحديث القائمة"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => setShowAddClinic(!showAddClinic)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddClinic ? 'إلغاء' : '+ إضافة عيادة جديدة'}</span>
              </button>
            </div>
          </div>

          {/* Add Clinic Form Drawer */}
          {showAddClinic && (
            <form onSubmit={handleCreateClinic} className="p-4 bg-teal-50 border-2 border-teal-200 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-4 duration-150">
              <div className="font-black text-xs text-teal-950 pb-1 border-b border-teal-200">
                + إضافة عيادة وحساب دكتور جديد:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم العيادة *</label>
                  <input
                    type="text"
                    required
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="عيادة الدكتور للأسنان"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم الطبيب بالكامل *</label>
                  <input
                    type="text"
                    required
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="د. محمود كمال"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم مستخدم الدكتور *</label>
                  <input
                    type="text"
                    required
                    value={doctorUsername}
                    onChange={(e) => setDoctorUsername(e.target.value)}
                    placeholder="dr_mahmoud"
                    dir="ltr"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-left"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">كلمة المرور *</label>
                  <input
                    type="password"
                    required
                    value={doctorPassword}
                    onChange={(e) => setDoctorPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-left"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">فترة الاشتراك الأولية (بالأيام)</label>
                  <input
                    type="number"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    placeholder="30"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddClinic(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-xs transition"
                >
                  حفظ وإنشاء العيادة ✓
                </button>
              </div>
            </form>
          )}

          {/* Clinics Table */}
          <div className="border-2 border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="py-3 px-4">اسم العيادة والكود</th>
                    <th className="py-3 px-4">الطبيب المالك</th>
                    <th className="py-3 px-4">الباقة الشهرية</th>
                    <th className="py-3 px-4">انتهاء الاشتراك</th>
                    <th className="py-3 px-4">الأيام المتبقية</th>
                    <th className="py-3 px-4 text-center">إجراءات التجديد (SaaS)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clinics.map((c) => {
                    const daysLeft = c.days_remaining;
                    const isExp = !c.is_subscription_active;
                    const isWarn = daysLeft > 0 && daysLeft <= 7;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4 font-black text-slate-900">
                          <div>{c.name}</div>
                          <span className="text-[10px] font-mono text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded-md" dir="ltr">
                            {c.invite_code}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-bold">
                          {c.doctor_name}
                          {c.phone ? <span className="block text-[11px] font-mono text-slate-400" dir="ltr">{c.phone}</span> : null}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {c.monthly_price} ج.م / شهر
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700" dir="ltr">
                          {c.subscription_end_date}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2.5 py-1 rounded-xl font-black text-[11px] ${
                            isExp
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : isWarn
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}>
                            {isExp ? 'منتهي الصلاحية' : `${daysLeft} يوم متبقي`}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleRenew(c.id, 30)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-lg transition text-[11px] shadow-xs"
                              title="تجديد شهر إضافي (+30 يوم)"
                            >
                              +30 يوم ⚡
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRenew(c.id, 90)}
                              disabled={actionLoading}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition text-[11px]"
                              title="تجديد 3 أشهر (+90 يوم)"
                            >
                              +3 أشهر
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggle(c.id)}
                              disabled={actionLoading}
                              className={`p-1.5 rounded-lg transition ${
                                c.is_active
                                  ? 'bg-red-50 hover:bg-red-100 text-red-600'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                              }`}
                              title={c.is_active ? 'تجميد العيادة' : 'تفعيل العيادة'}
                            >
                              {c.is_active ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
