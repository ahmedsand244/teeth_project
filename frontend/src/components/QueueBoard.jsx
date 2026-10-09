import React, { useState } from 'react';
import { 
  Clock, Search, CheckCircle2, 
  Receipt, Stethoscope, CalendarPlus, 
  Edit3, Trash2, X, Check, FileText, Printer
} from 'lucide-react';
import { api } from '../api';

export default function QueueBoard({
  appointments,
  loading,
  shiftSummary,
  selectedShift,
  searchTerm,
  setSearchTerm,
  onOpenNewBooking,
  onOpenPaymentModal,
  onOpenCheckoutModal,
  onOpenNotesModal,
  onOpenPatientProfile,
  onRefresh,
  onPrintTicket,
  user
}) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingApp, setEditingApp] = useState(null);
  const [editQueueNumber, setEditQueueNumber] = useState('');
  const [editAppointmentTime, setEditAppointmentTime] = useState('');
  const [editVisitType, setEditVisitType] = useState('GENERAL_CHECKUP');
  const [editShift, setEditShift] = useState('MORNING');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await api.updateAppointmentStatus(appointmentId, newStatus);
      onRefresh();
    } catch (err) {
      alert(`خطأ: ${err.message}`);
    }
  };

  const handleDeleteAppointment = async (appointmentId, patientName) => {
    if (!window.confirm(`هل أنت متأكد من حذف موعد المريض (${patientName}) نهائياً؟`)) {
      return;
    }
    try {
      await api.deleteAppointment(appointmentId);
      onRefresh();
    } catch (err) {
      alert(`خطأ في الحذف: ${err.message}`);
    }
  };

  const openEditModal = (app) => {
    setEditingApp(app);
    setEditQueueNumber(app.queue_number || '');
    setEditAppointmentTime(app.appointment_time || '');
    setEditVisitType(app.visit_type || 'GENERAL_CHECKUP');
    setEditShift(app.shift || 'MORNING');
    setEditError(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);
    try {
      await api.updateAppointment(editingApp.id, {
        queue_number: parseInt(editQueueNumber) || editingApp.queue_number,
        appointment_time: editAppointmentTime,
        visit_type: editVisitType,
        shift: editShift
      });
      setEditingApp(null);
      onRefresh();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  // Instant filtering
  const filteredAppointments = appointments.filter(app => {
    if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase().trim();
      const pName = (app.patient_details?.name || '').toLowerCase();
      const pPhone = (app.patient_details?.phone || '').toLowerCase();
      const qNum = String(app.queue_number);
      const vType = (app.visit_type_display || '').toLowerCase();
      if (!pName.includes(q) && !pPhone.includes(q) && !qNum.includes(q) && !vType.includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Action & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Instant keystroke search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            placeholder="بحث بالاسم أو رقم الهاتف أو رقم الدور..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={onOpenNewBooking}
            className="w-full md:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-teal-600/20 flex items-center justify-center gap-2 transition"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>+ حجز موعد جديد</span>
          </button>
        </div>
      </div>

      {/* Simplified Status Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">عدد الحالات المتبقية</span>
            <span className="text-2xl font-black text-amber-600 font-mono">
              {shiftSummary?.waiting || 0}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-teal-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">مع الطبيب حالياً</span>
            <span className="text-2xl font-black text-teal-600 font-mono">
              {shiftSummary?.with_doctor || 0}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Stethoscope className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">تم الكشف اليوم</span>
            <span className="text-2xl font-black text-emerald-600 font-mono">
              {shiftSummary?.completed || 0}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Queue Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs overflow-x-auto max-w-full">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الكل ({appointments.length})
          </button>
          <button
            onClick={() => setStatusFilter('WAITING')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              statusFilter === 'WAITING' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            انتظار ({appointments.filter(a => a.status === 'WAITING').length})
          </button>
          <button
            onClick={() => setStatusFilter('WITH_DOCTOR')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              statusFilter === 'WITH_DOCTOR' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            مع الطبيب ({appointments.filter(a => a.status === 'WITH_DOCTOR').length})
          </button>
          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              statusFilter === 'COMPLETED' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تم الكشف ({appointments.filter(a => a.status === 'COMPLETED').length})
          </button>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="sm:hidden px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500 font-bold text-center">
          👈 اسحب أفقياً لعرض باقي تفاصيل الجدول 👉
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[700px] text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-3.5 px-4 text-center">رقم</th>
                <th className="py-3.5 px-4">اسم المريض</th>
                <th className="py-3.5 px-4">نوع الزيارة</th>
                <th className="py-3.5 px-4">موعد الحجز / الساعة</th>
                <th className="py-3.5 px-4">المدفوع</th>
                <th className="py-3.5 px-4">الباقي</th>
                <th className="py-3.5 px-4 text-center">الحالة</th>
                <th className="py-3.5 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400 font-semibold">
                    جاري التحديث...
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400 font-semibold">
                    لا توجد كشوفات مسجلة حالياً
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((app) => {
                  const invoice = app.invoice || {};
                  const remaining = parseFloat(invoice.remaining_amount) || 0;
                  const paid = parseFloat(invoice.paid_amount) || 0;
                  const discount = parseFloat(invoice.discount) || 0;

                  return (
                    <tr 
                      key={app.id} 
                      className={`hover:bg-slate-50/80 transition ${
                        app.status === 'WITH_DOCTOR' ? 'bg-teal-50/40' : ''
                      }`}
                    >
                      {/* Queue Number */}
                      <td className="py-3.5 px-4 text-center">
                        <span 
                          onClick={() => openEditModal(app)}
                          title="انقر لتعديل رقم الدور"
                          className={`inline-flex items-center justify-center cursor-pointer w-8 h-8 rounded-xl font-mono font-bold text-sm shadow-xs transition hover:scale-110 ${
                            app.status === 'WITH_DOCTOR'
                              ? 'bg-teal-600 text-white ring-2 ring-teal-600 ring-offset-1'
                              : 'bg-slate-100 text-slate-800 border border-slate-300 hover:border-teal-500'
                          }`}
                        >
                          {app.queue_number}
                        </span>
                      </td>

                      {/* Patient Name & Phone & Badges */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <button
                          onClick={() => onOpenPatientProfile(app.patient)}
                          className="hover:text-teal-700 text-right block"
                        >
                          {app.patient_details?.name}
                        </button>
                        <span className="text-[11px] font-mono text-slate-500 font-normal block" dir="ltr">
                          {app.patient_details?.phone || 'بدون هاتف'}
                        </span>

                        {/* Prior Debt Warning from other visits */}
                        {(() => {
                          const totalPatDebt = parseFloat(app.patient_details?.total_remaining_balance) || 0;
                          const currentVisitDebt = parseFloat(app.invoice?.remaining_amount) || 0;
                          const debtFromPast = Math.max(0, totalPatDebt - currentVisitDebt);
                          if (debtFromPast <= 0) return null;
                          return (
                            <span className="inline-flex items-center gap-1 mt-1 text-[10px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-bold">
                              ⚠️ مديونية سابقة: {debtFromPast} ج.م
                            </span>
                          );
                        })()}

                        {/* Registered Procedures by Doctor */}
                        {app.procedures && app.procedures.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {app.procedures.map((p, pIdx) => (
                              <span 
                                key={p.id || pIdx} 
                                className="inline-block bg-teal-50 text-teal-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-teal-200"
                              >
                                {p.service_name} ({p.price}ج)
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Visit Type */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-md font-bold text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
                          {app.visit_type_display}
                        </span>
                      </td>

                      {/* Appointment Time / Shift */}
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {app.appointment_time ? (
                          <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded-md border border-teal-200">
                            <Clock className="w-3 h-3 text-teal-600" />
                            {app.appointment_time}
                          </span>
                        ) : (
                          <span className="text-slate-500">{app.shift_display}</span>
                        )}
                      </td>

                      {/* Paid Amount */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                        {paid} ج.م
                        {discount > 0 && (
                          <span className="block text-[10px] text-amber-700 font-normal">
                            (خصم: {discount} ج.م)
                          </span>
                        )}
                      </td>

                      {/* Remaining Amount */}
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span className={remaining > 0 ? 'text-red-600' : 'text-slate-600'}>
                          {remaining > 0 ? `${remaining} ج.م` : 'خالص'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          app.status === 'WAITING'
                            ? 'bg-amber-100 text-amber-800'
                            : app.status === 'WITH_DOCTOR'
                            ? 'bg-teal-100 text-teal-800 animate-pulse'
                            : app.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {app.status_display}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {app.status === 'WAITING' && (
                            <button
                              onClick={() => handleStatusChange(app.id, 'WITH_DOCTOR')}
                              className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-[11px] transition flex items-center gap-1 shadow-xs"
                              title="دخول المريض لغرفة الطبيب"
                            >
                              <Stethoscope className="w-3.5 h-3.5" />
                              <span>دخول للطبيب</span>
                            </button>
                          )}

                          {app.status === 'WITH_DOCTOR' && (
                            <button
                              onClick={() => onOpenCheckoutModal ? onOpenCheckoutModal(app) : handleStatusChange(app.id, 'COMPLETED')}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition flex items-center gap-1 shadow-xs ring-2 ring-emerald-500/30"
                              title="إنهاء الزيارة وتسوية الحساب المالي"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>إنهاء الزيارة</span>
                            </button>
                          )}

                          <button
                            onClick={() => onOpenCheckoutModal ? onOpenCheckoutModal(app) : onOpenPaymentModal(app)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-[11px] transition flex items-center gap-1"
                            title="تسوية ودفع الحساب"
                          >
                            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                            <span>دفع</span>
                          </button>

                          <button
                            onClick={() => onOpenNotesModal(app)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition"
                            title="الملاحظات الطبية"
                          >
                            ملاحظات
                          </button>

                          {/* Print Ticket & Share */}
                          <button
                            onClick={() => onPrintTicket && onPrintTicket({
                              id: app.id,
                              queue_number: app.queue_number,
                              patient_name: app.patient_details?.name,
                              patient_phone: app.patient_details?.phone,
                              visit_date: app.visit_date,
                              shift_display: app.shift_display,
                              appointment_time: app.appointment_time,
                              visit_type_display: app.visit_type_display,
                              paid_amount: paid,
                              remaining_amount: remaining,
                              clinic_name: user?.clinic_info?.name || user?.clinic_name || 'عيادة الأسنان المتخصصة',
                              clinic_phone: user?.clinic_info?.phone || user?.clinic_phone || '01011079572',
                            })}
                            className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg transition border border-teal-200"
                            title="طباعة التذكرة ومشاركة الرابط"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Appointment */}
                          <button
                            onClick={() => openEditModal(app)}
                            className="p-1.5 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 rounded-lg transition"
                            title="تعديل الموعد والدور"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Appointment */}
                          <button
                            onClick={() => handleDeleteAppointment(app.id, app.patient_details?.name)}
                            className="p-1.5 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-700 rounded-lg transition"
                            title="حذف الموعد"
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

      {/* Edit Appointment Modal */}
      {editingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-teal-50 border-b border-teal-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  تعديل الموعد: {editingApp.patient_details?.name}
                </h3>
              </div>
              <button onClick={() => setEditingApp(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الدور *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editQueueNumber}
                    onChange={(e) => setEditQueueNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وقت الحجز / الساعة</label>
                  <input
                    type="text"
                    placeholder="مثال: 09:30 ص"
                    value={editAppointmentTime}
                    onChange={(e) => setEditAppointmentTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع الزيارة</label>
                <select
                  value={editVisitType}
                  onChange={(e) => setEditVisitType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-hidden"
                >
                  <option value="GENERAL_CHECKUP">كشف</option>
                  <option value="FOLLOWUP_CHECKUP">متابعة كشف</option>
                  <option value="ORTHO_NEW_FIT">تركيب تقويم</option>
                  <option value="ORTHO_FOLLOWUP">متابعة تقويم</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الشيفت</label>
                <select
                  value={editShift}
                  onChange={(e) => setEditShift(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-hidden"
                >
                  <option value="MORNING">صباحي (9:00 ص - 2:00 م)</option>
                  <option value="EVENING">مسائي (5:00 م - 10:00 م)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>{editLoading ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
