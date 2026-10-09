import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, X, Trash2, Shield, Phone, 
  Stethoscope, UserCheck, AlertCircle, Check, KeyRound, User, 
  Copy, CheckCheck, Clock, UserX 
} from 'lucide-react';
import ToothIcon from './ToothIcon';
import { api } from '../api';

export default function StaffManagementModal({ isOpen, onClose, currentUser, onStaffUpdated }) {
  const [staffList, setStaffList] = useState([]);
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // New staff form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('ASSISTANT');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchStaffAndPending = async () => {
    setLoading(true);
    try {
      const [staffData, pendingData] = await Promise.all([
        api.getStaff(),
        currentUser?.is_doctor ? api.getPendingAssistants().catch(() => []) : Promise.resolve([])
      ]);
      setStaffList(staffData);
      setPendingList(pendingData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      fetchStaffAndPending();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    const code = currentUser?.clinic_info?.invite_code;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleApprove = async (assistantId) => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.approveAssistant(assistantId);
      setSuccessMsg(res.message);
      fetchStaffAndPending();
      if (onStaffUpdated) onStaffUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (assistantId) => {
    if (!window.confirm('هل أنت متأكد من رفض طلب هذا المساعد؟')) return;
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.rejectAssistant(assistantId);
      setSuccessMsg(res.message);
      fetchStaffAndPending();
      if (onStaffUpdated) onStaffUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      if (!fullName.trim() || !username.trim() || !password.trim()) {
        throw new Error('يرجى ملء جميع الحقول الإلزامية');
      }

      await api.createStaff({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        role,
        phone: phone.trim(),
        password: password.trim()
      });

      setSuccessMsg(`تم إضافة ${role === 'DOCTOR' ? 'الطبيب' : 'المساعد'} (${fullName}) بنجاح!`);
      setFullName('');
      setUsername('');
      setPassword('');
      setPhone('');
      setShowAddForm(false);
      fetchStaffAndPending();
      if (onStaffUpdated) onStaffUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (staffMember) => {
    if (staffMember.id === currentUser?.id) {
      alert('لا يمكنك حذف حسابك الحالي المسجل الدخول به!');
      return;
    }

    if (!window.confirm(`هل أنت متأكد من حذف حساب (${staffMember.full_name || staffMember.username}) نهائياً؟`)) {
      return;
    }

    try {
      await api.deleteStaff(staffMember.id);
      fetchStaffAndPending();
      if (onStaffUpdated) onStaffUpdated();
    } catch (err) {
      alert(err.message);
    }
  };

  const doctors = staffList.filter(s => s.role === 'DOCTOR');
  const assistants = staffList.filter(s => s.role === 'ASSISTANT');
  const inviteCode = currentUser?.clinic_info?.invite_code || 'CLINIC-XXXX';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto font-['Cairo',sans-serif]">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border-2 border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-inner">
              <ToothIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                إدارة فريق العمل والعيادة
                <span className="text-[11px] font-bold bg-white/25 px-2 py-0.5 rounded-full">
                  {staffList.length} أعضاء
                </span>
              </h2>
              <p className="text-xs text-teal-100 font-bold">
                {currentUser?.clinic_info?.name || 'عيادة الأسنان'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="p-6 space-y-5">
          {/* Clinic Invite Code Banner for Doctor */}
          {currentUser?.is_doctor && (
            <div className="p-3.5 bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-200 rounded-2xl flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black text-teal-950 block">
                  كود انضمام المساعدين لعيادتك:
                </span>
                <span className="text-[11px] text-teal-700 font-bold">
                  أعطِ هذا الكود للمساعدين ليسجلوا به في شاشة الدخول، وسيصلك طلبهم هنا للموافقة عليه
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-white border-2 border-teal-400 text-teal-900 rounded-xl font-mono font-black text-sm shadow-xs" dir="ltr">
                  {inviteCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition text-xs font-bold flex items-center gap-1 shadow-xs"
                  title="نسخ الكود"
                >
                  {copiedCode ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Pending Assistant Requests Section (For Doctor) */}
          {currentUser?.is_doctor && pendingList.length > 0 && (
            <div className="p-4 bg-amber-50/80 border-2 border-amber-300 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black text-amber-950">
                  <Clock className="w-4 h-4 text-amber-700 animate-pulse" />
                  <span>طلبات انضمام المساعدين المعلقة بانتظار موافقتك ({pendingList.length}):</span>
                </div>
                <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                  تحتاج موافقة
                </span>
              </div>

              <div className="space-y-2">
                {pendingList.map((ast) => (
                  <div 
                    key={ast.id}
                    className="p-3 bg-white border border-amber-200 rounded-xl flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="font-black text-xs text-slate-900 flex items-center gap-2">
                        <span>👩‍💼 {ast.full_name || ast.username}</span>
                        <span className="text-[10px] font-mono text-slate-500" dir="ltr">@{ast.username}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-bold mt-0.5">
                        {ast.phone ? `رقم الهاتف: ${ast.phone}` : 'بدون هاتف'} • تاريخ الطلب: {ast.date_joined?.split('T')[0]}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(ast.id)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1 transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>قبول وتفعيل ✓</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReject(ast.id)}
                        disabled={actionLoading}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-500">
              المساعدون والأطباء المفعلون في العيادة
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`px-4 py-2 rounded-xl text-xs font-black shadow-xs flex items-center gap-2 transition ${
                showAddForm
                  ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>{showAddForm ? 'إلغاء' : '+ إضافة عضو مباشرةً'}</span>
            </button>
          </div>

          {/* Add Staff Form Accordion */}
          {showAddForm && (
            <form onSubmit={handleCreate} className="p-4.5 bg-teal-50/70 border-2 border-teal-200 rounded-2xl space-y-4 animate-in slide-in-from-top-4 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-teal-200/60">
                <span className="text-xs font-black text-teal-950 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-teal-700" />
                  تسجيل عضو معتمد مباشرةً:
                </span>
                <span className="text-[11px] text-teal-700 font-bold">تفعيل فوري</span>
              </div>

              {/* Role Picker */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">الدور الوظيفي *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('DOCTOR')}
                    className={`py-2 px-3 rounded-xl text-xs font-black border-2 flex items-center justify-center gap-2 transition ${
                      role === 'DOCTOR'
                        ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4 text-emerald-400" />
                    <span>طبيب معالج</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('ASSISTANT')}
                    className={`py-2 px-3 rounded-xl text-xs font-black border-2 flex items-center justify-center gap-2 transition ${
                      role === 'ASSISTANT'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-blue-300" />
                    <span>مساعد / استقبال</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">الاسم بالكامل *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="الاسم الكامل..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    dir="ltr"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-left focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم المستخدم *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="اسم المستخدم..."
                    dir="ltr"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-left focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">كلمة المرور *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-left focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>{submitting ? 'جاري الحفظ...' : 'حفظ وتفعيل ✓'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Active Doctors Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-slate-800">
              <Stethoscope className="w-4 h-4 text-teal-700" />
              <span>الأطباء ({doctors.length})</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {doctors.map((doc) => (
                <div 
                  key={doc.id}
                  className="p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl flex items-center justify-between gap-3 hover:border-teal-300 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-black text-sm">
                      👨‍⚕️
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-slate-900">{doc.full_name || doc.username}</span>
                        {currentUser?.id === doc.id && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                            حسابك
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 block" dir="ltr">
                        @{doc.username}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Assistants Section */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>المساعدون المعتمدون ({assistants.length})</span>
              </div>
              <span className="text-[11px] text-slate-400">حسابات مفعلة بالاستقبال</span>
            </div>

            {assistants.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-400 font-bold">
                لا يوجد مساعدون مفعلون حالياً. يمكنك تفعيل المساعدين عبر قبول طلبات الانضمام أعلاه أو الضغط على (+ إضافة عضو مباشرةً).
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {assistants.map((ast) => (
                  <div 
                    key={ast.id}
                    className="p-3 bg-blue-50/50 border-2 border-blue-100 rounded-2xl flex items-center justify-between gap-3 hover:border-blue-300 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-sm">
                        👩‍💼
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs text-slate-900">{ast.full_name || ast.username}</span>
                          {currentUser?.id === ast.id && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                              حسابك
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 block" dir="ltr">
                          @{ast.username} {ast.phone ? `• ${ast.phone}` : ''}
                        </span>
                      </div>
                    </div>

                    {currentUser?.id !== ast.id && currentUser?.is_doctor && (
                      <button
                        type="button"
                        onClick={() => handleDelete(ast)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="إلغاء الحساب"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
