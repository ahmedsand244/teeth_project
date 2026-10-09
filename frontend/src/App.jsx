import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import QueueBoard from './components/QueueBoard';
import PatientDirectory from './components/PatientDirectory';
import DoctorFinancialPanel from './components/DoctorFinancialPanel';
import QuickWalkinModal from './components/QuickWalkinModal';
import NewBookingModal from './components/NewBookingModal';
import PaymentModal from './components/PaymentModal';
import CheckoutModal from './components/CheckoutModal';
import SeniorDoctorPortal from './components/SeniorDoctorPortal';
import ClinicalNotesModal from './components/ClinicalNotesModal';
import PatientProfileModal from './components/PatientProfileModal';
import StaffManagementModal from './components/StaffManagementModal';
import SaaSOwnerDashboardModal from './components/SaaSOwnerDashboardModal';
import SaaSPortalPage from './components/SaaSPortalPage';
import LoginModal from './components/LoginModal';
import PrintTicketModal from './components/PrintTicketModal';
import PrintPatientRecordModal from './components/PrintPatientRecordModal';
import PublicTicketViewer from './components/PublicTicketViewer';
import PublicPatientRecordViewer from './components/PublicPatientRecordViewer';
import { api, getStoredUser, clearAuthToken, setAuthToken, setStoredUser } from './api';
import { CheckCircle2, AlertCircle, Clock, Users, Stethoscope, DollarSign, MessageCircle, Phone } from 'lucide-react';

export default function App() {
  // Check for public tickets or medical record URLs (shared with patients)
  const urlParams = new URLSearchParams(window.location.search);
  const ticketParam = urlParams.get('ticket');
  const patientRecordParam = urlParams.get('patient_record');

  if (ticketParam) {
    return <PublicTicketViewer ticketId={ticketParam} />;
  }

  if (patientRecordParam) {
    return <PublicPatientRecordViewer patientId={patientRecordParam} />;
  }

  const getInitialDate = () => new Date().toISOString().split('T')[0];

  // Auto-detect current shift based on real-time clock (Morning 6am-3:30pm, Evening otherwise)
  const getInitialShift = () => {
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    return (currentHour >= 6 && currentHour < 15.5) ? 'MORNING' : 'EVENING';
  };

  const [user, setUser] = useState(getStoredUser());
  const [activeTab, setActiveTab] = useState('queue');
  const [selectedDate, setSelectedDate] = useState(getInitialDate());
  const [selectedShift, setSelectedShift] = useState(getInitialShift());
  const [searchTerm, setSearchTerm] = useState('');

  // Shift custom working hours
  const [shiftTimes, setShiftTimes] = useState(() => {
    const saved = localStorage.getItem('dentflow_shift_times');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      morning: '9:00 ص - 2:00 م',
      evening: '5:00 م - 10:00 م'
    };
  });

  const handleUpdateShiftTimes = (newTimes) => {
    setShiftTimes(newTimes);
    localStorage.setItem('dentflow_shift_times', JSON.stringify(newTimes));
  };

  // Global Font Scale Control (normal = 15px, large = 18px, xlarge = 21px)
  const [fontScale, setFontScale] = useState(() => {
    return localStorage.getItem('dentflow_font_scale') || 'normal';
  });

  useEffect(() => {
    localStorage.setItem('dentflow_font_scale', fontScale);
    let size = '15px';
    if (fontScale === 'large') size = '18px';
    if (fontScale === 'xlarge') size = '21px';
    document.documentElement.style.fontSize = size;
  }, [fontScale]);

  // Queue data
  const [appointments, setAppointments] = useState([]);
  const [shiftSummary, setShiftSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // Modals state
  const [isQuickWalkinOpen, setIsQuickWalkinOpen] = useState(false);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isSaaSOwnerModalOpen, setIsSaaSOwnerModalOpen] = useState(false);
  const [bookingInitialData, setBookingInitialData] = useState(null);
  const [paymentModalApp, setPaymentModalApp] = useState(null);
  const [checkoutModalApp, setCheckoutModalApp] = useState(null);
  const [notesModalApp, setNotesModalApp] = useState(null);
  const [selectedPatientProfileId, setSelectedPatientProfileId] = useState(null);
  const [printTicketData, setPrintTicketData] = useState(null);
  const [printRecordData, setPrintRecordData] = useState(null);

  // Handlers for printing and sharing tickets & patient records
  const handleOpenPrintTicket = (ticketInfo) => {
    setPrintTicketData(ticketInfo);
  };

  const handleOpenPrintRecord = async (patientId) => {
    try {
      const rec = await api.getPublicPatientRecord(patientId);
      setPrintRecordData(rec);
    } catch (err) {
      showToast(err.message || 'تعذر تحميل بيانات السجل الطبي', 'error');
    }
  };

  // Toast notifications
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Verify auth on mount
  useEffect(() => {
    if (user) {
      api.getCurrentUser()
        .then(u => {
          setUser(u);
          setStoredUser(u);
        })
        .catch(() => {
          setUser(null);
          clearAuthToken();
        });
    }
  }, []);

  // Protect doctor-only tabs
  useEffect(() => {
    if (!user?.is_doctor && (activeTab === 'analytics' || activeTab === 'doctor_clinic')) {
      setActiveTab('queue');
    }
  }, [user, activeTab]);

  // Fetch appointments and shift summary
  const loadQueueData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [apps, summary] = await Promise.all([
        api.getAppointments(selectedDate, selectedShift, searchTerm),
        api.getShiftSummary(selectedDate, selectedShift)
      ]);
      setAppointments(apps);
      setShiftSummary(summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, selectedDate, selectedShift, searchTerm]);

  useEffect(() => {
    loadQueueData();
  }, [loadQueueData]);

  // Handle Logout
  const handleLogout = () => {
    clearAuthToken();
    setUser(null);
  };

  // Quick Switch between Doctor and Assistant for easy role verification
  const handleSwitchUser = async () => {
    setIsSwitching(true);
    try {
      const targetUser = user?.is_doctor ? 'assistant' : 'doctor';
      const targetPass = user?.is_doctor ? 'assistant123' : 'doctor123';
      const res = await api.login(targetUser, targetPass);
      setAuthToken(res.token);
      setStoredUser(res.user);
      setUser(res.user);
      showToast(`تم التبديل بنجاح إلى حساب: ${res.user.full_name}`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSwitching(false);
    }
  };

  // Check if unauthenticated
  if (!user) {
    return (
      <LoginModal 
        isOpen={true} 
        onLoginSuccess={(u) => {
          setUser(u);
          showToast(`أهلاً بك ${u.full_name || u.username}`);
        }} 
      />
    );
  }

  // 2. Dedicated SaaS Admin Portal (صفحة مستقلة وخاصة لمالك المنصة لا تدخل على العيادة إطلاقاً)
  if (user?.is_saas_admin) {
    return (
      <SaaSPortalPage 
        user={user} 
        onLogout={handleLogout} 
        onPasswordChanged={() => showToast('تم تحديث كلمة المرور بنجاح ✓')}
      />
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 text-slate-800 flex flex-col font-['Cairo',sans-serif]">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold ${
            toast.type === 'error'
              ? 'bg-red-600 text-white border-red-700'
              : 'bg-slate-900 text-white border-slate-800'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-300 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Header */}
      <Header
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedShift={selectedShift}
        setSelectedShift={setSelectedShift}
        onLogout={handleLogout}
        fontScale={fontScale}
        setFontScale={setFontScale}
        shiftTimes={shiftTimes}
        onUpdateShiftTimes={handleUpdateShiftTimes}
        onOpenStaffModal={() => setIsStaffModalOpen(true)}
        onOpenSaaSOwnerModal={() => setIsSaaSOwnerModalOpen(true)}
      />

      {/* Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-6">
        {user?.clinic_info && !user.clinic_info.is_subscription_active && !user.is_saas_admin ? (
          <div className="py-12 px-4 flex items-center justify-center min-h-[60vh]">
            <div className="bg-white rounded-3xl border-2 border-red-200 p-6 sm:p-8 max-w-md w-full text-center shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100 shadow-inner">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-black mb-2">
                  تم إيقاف الاشتراك مؤقتاً
                </span>
                <h2 className="text-xl font-black text-slate-900">انتهت فترة اشتراك العيادة بالمنصة</h2>
                <p className="text-xs text-slate-600 font-bold mt-2 leading-relaxed">
                  نأسف، لقد انتهت صلاحية اشتراك عيادتكم ({user.clinic_info.name}) في DentFlow Pro.
                  يرجى التواصل مع إدارة المنصة لتجديد الاشتراك واستئناف العمل فوراً.
                </p>
              </div>

              {/* Direct WhatsApp Contact */}
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl text-center space-y-3 shadow-sm">
                <div className="text-xs font-black text-emerald-900 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>للتجديد السريع وتفعيل المنصة تواصل مباشرة:</span>
                </div>
                
                <div className="py-2 px-3 bg-white rounded-xl border border-emerald-200 shadow-xs">
                  <div className="text-[11px] text-slate-500 font-bold">رقم الواتساب والاتصال:</div>
                  <div className="text-xl font-black text-emerald-700 font-mono tracking-wider mt-0.5" dir="ltr">
                    01011079572
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <a
                    href="https://wa.me/201011079572?text=مرحباً، أود تجديد اشتراك عيادتي في DentFlow Pro"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>مراسلة واتساب الآن</span>
                  </a>
                  <a
                    href="tel:01011079572"
                    className="w-full sm:w-auto py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>اتصال</span>
                  </a>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                تسجيل الخروج والعودة
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'queue' && (
              <QueueBoard
                appointments={appointments}
                loading={loading}
                shiftSummary={shiftSummary}
                selectedShift={selectedShift}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onOpenQuickWalkin={() => setIsQuickWalkinOpen(true)}
                onOpenNewBooking={(initialData) => {
                  setBookingInitialData(initialData || null);
                  setIsNewBookingOpen(true);
                }}
                onOpenPaymentModal={(app) => setCheckoutModalApp(app)}
                onOpenCheckoutModal={(app) => setCheckoutModalApp(app)}
                onOpenNotesModal={(app) => setNotesModalApp(app)}
                onOpenPatientProfile={(pId) => setSelectedPatientProfileId(pId)}
                onRefresh={loadQueueData}
                onPrintTicket={handleOpenPrintTicket}
                user={user}
              />
            )}

            {activeTab === 'doctor_clinic' && (
              <SeniorDoctorPortal
                user={user}
                selectedDate={selectedDate}
                onDone={() => {
                  showToast('تم إرسال الإجراءات والأسعار للاستقبال بنجاح!');
                  loadQueueData();
                }}
              />
            )}

            {activeTab === 'patients' && (
              <PatientDirectory
                onSelectPatient={(pId) => setSelectedPatientProfileId(pId)}
                onPrintRecord={handleOpenPrintRecord}
                onNewBookingForPatient={(patient, initialVisitType) => {
                  setBookingInitialData({ patient, visitType: initialVisitType || 'GENERAL_CHECKUP' });
                  setIsNewBookingOpen(true);
                }}
              />
            )}

            {activeTab === 'analytics' && (
              <DoctorFinancialPanel
                user={user}
                selectedDate={selectedDate}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <QuickWalkinModal
        isOpen={isQuickWalkinOpen}
        onClose={() => setIsQuickWalkinOpen(false)}
        selectedDate={selectedDate}
        selectedShift={selectedShift}
        shiftSummary={shiftSummary}
        onSuccess={(msg) => {
          showToast(msg);
          loadQueueData();
        }}
        onBookingCreated={(newApp) => {
          const inv = newApp.invoice;
          handleOpenPrintTicket({
            id: newApp.id,
            queue_number: newApp.queue_number,
            patient_name: newApp.patient_details?.name,
            patient_phone: newApp.patient_details?.phone,
            visit_date: newApp.visit_date,
            shift_display: newApp.shift_display,
            appointment_time: newApp.appointment_time,
            visit_type_display: newApp.visit_type_display,
            paid_amount: inv ? inv.paid_amount : (newApp.initial_paid_amount || 0),
            remaining_amount: inv ? inv.remaining_amount : 0,
            total_amount: inv ? inv.total_amount : (newApp.initial_total_amount || 0),
            clinic_name: user?.clinic_name || 'عيادة الأسنان المتخصصة',
            clinic_phone: user?.clinic_phone || '01011079572',
          });
        }}
      />

      <NewBookingModal
        isOpen={isNewBookingOpen}
        onClose={() => {
          setIsNewBookingOpen(false);
          setBookingInitialData(null);
        }}
        initialData={bookingInitialData}
        selectedDate={selectedDate}
        selectedShift={selectedShift}
        onSuccess={(msg) => {
          showToast(msg);
          loadQueueData();
        }}
        onBookingCreated={(newApp) => {
          const inv = newApp.invoice;
          handleOpenPrintTicket({
            id: newApp.id,
            queue_number: newApp.queue_number,
            patient_name: newApp.patient_details?.name,
            patient_phone: newApp.patient_details?.phone,
            visit_date: newApp.visit_date,
            shift_display: newApp.shift_display,
            appointment_time: newApp.appointment_time,
            visit_type_display: newApp.visit_type_display,
            paid_amount: inv ? inv.paid_amount : (newApp.initial_paid_amount || 0),
            remaining_amount: inv ? inv.remaining_amount : 0,
            total_amount: inv ? inv.total_amount : (newApp.initial_total_amount || 0),
            clinic_name: user?.clinic_name || 'عيادة الأسنان المتخصصة',
            clinic_phone: user?.clinic_phone || '01011079572',
          });
        }}
      />

      <CheckoutModal
        isOpen={!!checkoutModalApp}
        onClose={() => setCheckoutModalApp(null)}
        appointment={checkoutModalApp}
        onSuccess={(msg) => {
          showToast(msg);
          loadQueueData();
        }}
      />

      <PaymentModal
        isOpen={!!paymentModalApp}
        onClose={() => setPaymentModalApp(null)}
        appointment={paymentModalApp}
        onSuccess={(msg) => {
          showToast(msg);
          loadQueueData();
        }}
      />

      <ClinicalNotesModal
        isOpen={!!notesModalApp}
        onClose={() => setNotesModalApp(null)}
        appointment={notesModalApp}
        onSuccess={(msg) => {
          showToast(msg);
          loadQueueData();
        }}
      />

      <PatientProfileModal
        isOpen={!!selectedPatientProfileId}
        onClose={() => setSelectedPatientProfileId(null)}
        patientId={selectedPatientProfileId}
        onBookAppointment={() => setIsNewBookingOpen(true)}
        onPrintRecord={handleOpenPrintRecord}
      />

      <PrintTicketModal
        isOpen={!!printTicketData}
        onClose={() => setPrintTicketData(null)}
        ticketData={printTicketData}
      />

      <PrintPatientRecordModal
        isOpen={!!printRecordData}
        onClose={() => setPrintRecordData(null)}
        recordData={printRecordData}
      />

      <StaffManagementModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        currentUser={user}
        onStaffUpdated={() => {
          showToast('تم تحديث بيانات فريق العمل بنجاح');
          api.getCurrentUser().then(setUser).catch(() => {});
        }}
      />

      <SaaSOwnerDashboardModal
        isOpen={isSaaSOwnerModalOpen}
        onClose={() => {
          setIsSaaSOwnerModalOpen(false);
          api.getCurrentUser().then(setUser).catch(() => {});
        }}
      />

      {/* Mobile Bottom Navigation Bar (Visible on mobile/tablet screens < md) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 py-1.5 px-3 shadow-xl">
        <div className="flex items-center justify-around text-center max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
              activeTab === 'queue' ? 'text-teal-700 font-black' : 'text-slate-500 font-bold'
            }`}
          >
            <Clock className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">الاستقبال</span>
          </button>

          <button
            onClick={() => setActiveTab('patients')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
              activeTab === 'patients' ? 'text-teal-700 font-black' : 'text-slate-500 font-bold'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">المرضى</span>
          </button>

          {user?.is_doctor && (
            <button
              onClick={() => setActiveTab('doctor_clinic')}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
                activeTab === 'doctor_clinic' ? 'text-teal-700 font-black' : 'text-slate-500 font-bold'
              }`}
            >
              <Stethoscope className="w-5 h-5 mb-0.5 text-teal-600" />
              <span className="text-[11px]">الكشف</span>
            </button>
          )}

          {user?.is_doctor && (
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
                activeTab === 'analytics' ? 'text-emerald-700 font-black' : 'text-slate-500 font-bold'
              }`}
            >
              <DollarSign className="w-5 h-5 mb-0.5 text-emerald-600" />
              <span className="text-[11px]">المالية</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
