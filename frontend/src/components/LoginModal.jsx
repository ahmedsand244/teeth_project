import React, { useState } from 'react';
import { 
  Lock, User, AlertCircle, Stethoscope, UserCheck, 
  UserPlus, Phone, KeyRound, Check, ArrowRight, ShieldCheck, 
  HelpCircle, Building2, Key, Sparkles, Clock, Crown, MessageCircle 
} from 'lucide-react';
import ToothIcon from './ToothIcon';
import { api, setAuthToken, setStoredUser } from '../api';

export default function LoginModal({ isOpen, onLoginSuccess }) {
  // Modes: 'login' | 'register_doctor' | 'register_assistant' | 'forgot_password' | 'saas_admin'
  const [mode, setMode] = useState('login');

  // Login form state (100% private, no public account lists!)
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');


  // Register Doctor & Clinic form state
  const [docFullName, setDocFullName] = useState('');
  const [docClinicName, setDocClinicName] = useState('');
  const [docUsername, setDocUsername] = useState('');
  const [docPassword, setDocPassword] = useState('');
  const [docPhone, setDocPhone] = useState('');

  // Register Assistant form state
  const [astFullName, setAstFullName] = useState('');
  const [astInviteCode, setAstInviteCode] = useState('');
  const [astUsername, setAstUsername] = useState('');
  const [astPassword, setAstPassword] = useState('');
  const [astPhone, setAstPhone] = useState('');

  // Forgot password form state
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const resetMessages = () => {
    setError(null);
    setSuccessMsg(null);
  };

  // 1. Secure Login Submit
  const handleLogin = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const res = await api.login(loginUsername.trim(), loginPassword);
      setAuthToken(res.token);
      setStoredUser(res.user);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Doctor & Clinic Registration Submit
  const handleRegisterDoctor = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      if (!docFullName.trim() || !docClinicName.trim() || !docUsername.trim() || !docPassword.trim()) {
        throw new Error('يرجى ملء جميع الحقول الإلزامية');
      }
      const res = await api.registerDoctor({
        full_name: docFullName.trim(),
        clinic_name: docClinicName.trim(),
        username: docUsername.trim().toLowerCase(),
        password: docPassword.trim(),
        phone: docPhone.trim()
      });
      setAuthToken(res.token);
      setStoredUser(res.user);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Assistant Registration Submit (Needs Doctor Approval!)
  const handleRegisterAssistant = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      if (!astFullName.trim() || !astInviteCode.trim() || !astUsername.trim() || !astPassword.trim()) {
        throw new Error('يرجى كتابة الاسم وكود انضمام العيادة واسم المستخدم وكلمة المرور');
      }
      const res = await api.registerAssistant({
        full_name: astFullName.trim(),
        invite_code: astInviteCode.trim().toUpperCase(),
        username: astUsername.trim().toLowerCase(),
        password: astPassword.trim(),
        phone: astPhone.trim()
      });
      setSuccessMsg(res.message);
      // Reset assistant form
      setAstFullName('');
      setAstInviteCode('');
      setAstUsername('');
      setAstPassword('');
      setAstPhone('');
      setMode('login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Forgot Password Submit
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      if (!forgotUsername.trim() || !forgotPhone.trim() || !forgotNewPassword.trim()) {
        throw new Error('يرجى إدخال اسم المستخدم ورقم الهاتف المسجل وكلمة المرور الجديدة');
      }
      const res = await api.forgotPassword({
        username: forgotUsername.trim(),
        phone: forgotPhone.trim(),
        new_password: forgotNewPassword.trim()
      });
      setSuccessMsg(res.message);
      setForgotUsername('');
      setForgotPhone('');
      setForgotNewPassword('');
      setMode('login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 overflow-y-auto font-['Cairo',sans-serif]">
      {/* Decorative Glows */}
      <div className="absolute top-1/4 -right-16 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -left-16 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Banner with Dental Branding */}
        <div className="relative px-8 pt-7 pb-5 text-center bg-gradient-to-b from-teal-700 via-teal-600 to-teal-800 text-white overflow-hidden shadow-sm">
          <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
            <ToothIcon className="w-48 h-48 text-white" />
          </div>

          <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-br from-white to-teal-100 text-teal-700 flex items-center justify-center mx-auto shadow-xl ring-4 ring-white/20 mb-3">
            <ToothIcon className="w-9 h-9 text-teal-700 drop-shadow-sm" />
          </div>

          <h2 className="text-xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <span>DentFlow Pro</span>
            <span className="text-[10px] font-bold bg-white/20 backdrop-blur-xs text-white px-2 py-0.5 rounded-full border border-white/25">
              منظومة السحابية
            </span>
          </h2>
          <p className="text-xs text-teal-100 font-bold mt-1">
            تسجيل دخول آمن ومشفر لحماية بيانات العيادة والمرضى
          </p>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-bold flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-start gap-2.5 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. SECURE LOGIN FORM */}
        {mode === 'login' && (
          <div className="p-6 space-y-4">
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">اسم المستخدم</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="اسم المستخدم الخاص بك..."
                    dir="ltr"
                    className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-left focus:bg-white focus:border-teal-500 focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-black text-slate-700">كلمة المرور</label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot_password'); resetMessages(); }}
                    className="text-[11px] text-teal-700 hover:text-teal-900 font-bold hover:underline"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-left focus:bg-white focus:border-teal-500 focus:outline-hidden transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-teal-600/25 flex items-center justify-center transition"
              >
                <span>{loading ? 'جاري التحقق...' : 'تسجيل الدخول'}</span>
              </button>
            </form>

            {/* Registration Options Footer */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-center">
              <button
                type="button"
                onClick={() => { setMode('register_doctor'); resetMessages(); }}
                className="w-full py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-black flex items-center justify-center transition"
              >
                <span>طبيب جديد؟ إنشاء عيادة واشتراك جديد</span>
              </button>

              <button
                type="button"
                onClick={() => { setMode('register_assistant'); resetMessages(); }}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center transition"
              >
                <span>مساعد في عيادة؟ طلب انضمام لعيادة دكتور (بانتظار موافقته)</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. REGISTER DOCTOR & CLINIC */}
        {mode === 'register_doctor' && (
          <form onSubmit={handleRegisterDoctor} className="p-6 space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-teal-700" />
                تسجيل طبيب جديد وإنشاء عيادة
              </span>
              <button
                type="button"
                onClick={() => { setMode('login'); resetMessages(); }}
                className="text-xs text-teal-700 font-bold hover:underline"
              >
                ← العودة للدخول
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">اسم الطبيب بالكامل *</label>
              <input
                type="text"
                required
                value={docFullName}
                onChange={(e) => setDocFullName(e.target.value)}
                placeholder="د. أحمد الشناوي"
                className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">اسم العيادة *</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={docClinicName}
                  onChange={(e) => setDocClinicName(e.target.value)}
                  placeholder="عيادة الشناوي التخصصية للأسنان"
                  className="w-full pr-9 pl-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">اسم المستخدم *</label>
                <input
                  type="text"
                  required
                  value={docUsername}
                  onChange={(e) => setDocUsername(e.target.value)}
                  placeholder="dr_ahmed"
                  dir="ltr"
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-left focus:bg-white focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">كلمة المرور *</label>
                <input
                  type="password"
                  required
                  value={docPassword}
                  onChange={(e) => setDocPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-left focus:bg-white focus:border-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">رقم الهاتف (لاستعادة الحساب)</label>
              <input
                type="text"
                value={docPhone}
                onChange={(e) => setDocPhone(e.target.value)}
                placeholder="010XXXXXXXX"
                dir="ltr"
                className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-left focus:bg-white focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'جاري إنشاء العيادة...' : 'تأكيد إنشاء العيادة والبدء ✓'}</span>
            </button>
          </form>
        )}

        {/* 3. REGISTER ASSISTANT WITH CLINIC CODE (NEEDS DOCTOR APPROVAL) */}
        {mode === 'register_assistant' && (
          <form onSubmit={handleRegisterAssistant} className="p-6 space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                طلب انضمام مساعد لعيادة
              </span>
              <button
                type="button"
                onClick={() => { setMode('login'); resetMessages(); }}
                className="text-xs text-teal-700 font-bold hover:underline"
              >
                ← العودة للدخول
              </button>
            </div>

            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 font-bold leading-relaxed">
              ℹ️ تنبيه الأمان: بعد إرسال بياناتك، سيتم إرسال طلب انضمامك لطبيب العيادة، ولن تتمكن من الدخول إلا بعد موافقة الدكتور على حسابك.
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">
                كود انضمام العيادة (اطلبه من الدكتور) *
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={astInviteCode}
                  onChange={(e) => setAstInviteCode(e.target.value)}
                  placeholder="مثال: CLINIC-1001"
                  dir="ltr"
                  className="w-full pr-9 pl-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-mono font-black text-left focus:bg-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">اسم المساعد بالكامل *</label>
              <input
                type="text"
                required
                value={astFullName}
                onChange={(e) => setAstFullName(e.target.value)}
                placeholder="سارة ممدوح"
                className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">اسم المستخدم *</label>
                <input
                  type="text"
                  required
                  value={astUsername}
                  onChange={(e) => setAstUsername(e.target.value)}
                  placeholder="sara"
                  dir="ltr"
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-left focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">كلمة المرور *</label>
                <input
                  type="password"
                  required
                  value={astPassword}
                  onChange={(e) => setAstPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-left focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">رقم الهاتف *</label>
              <input
                type="text"
                required
                value={astPhone}
                onChange={(e) => setAstPhone(e.target.value)}
                placeholder="010XXXXXXXX"
                dir="ltr"
                className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-left focus:bg-white focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'جاري إرسال الطلب...' : 'إرسال طلب الانضمام للدكتور ✓'}</span>
            </button>
          </form>
        )}

        {/* 4. FORGOT PASSWORD FLOW */}
        {mode === 'forgot_password' && (
          <form onSubmit={handleForgotPassword} className="p-6 space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-teal-700" />
                استعادة كلمة المرور
              </span>
              <button
                type="button"
                onClick={() => { setMode('login'); resetMessages(); }}
                className="text-xs text-teal-700 font-bold hover:underline"
              >
                ← العودة للدخول
              </button>
            </div>

            <p className="text-[11px] text-slate-500 font-bold">
              يرجى إدخال اسم المستخدم ورقم الهاتف المسجل للتحقق وتعيين كلمة المرور الجديدة فوراً:
            </p>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">اسم المستخدم *</label>
              <input
                type="text"
                required
                value={forgotUsername}
                onChange={(e) => setForgotUsername(e.target.value)}
                placeholder="اسم المستخدم..."
                dir="ltr"
                className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-left focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">رقم الهاتف المسجل *</label>
              <input
                type="text"
                required
                value={forgotPhone}
                onChange={(e) => setForgotPhone(e.target.value)}
                placeholder="010XXXXXXXX"
                dir="ltr"
                className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-left focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">كلمة المرور الجديدة *</label>
              <input
                type="password"
                required
                value={forgotNewPassword}
                onChange={(e) => setForgotNewPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
                className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-bold text-left focus:bg-white focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'جاري التحقق...' : 'تحديث كلمة المرور والدخول ✓'}</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
