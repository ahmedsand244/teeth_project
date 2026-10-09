import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, ShieldAlert, Lock, Clock, Calendar, 
  Receipt, ArrowUpRight, ArrowDownRight, Tag, Stethoscope, AlertTriangle, RefreshCw
} from 'lucide-react';
import { api } from '../api';

export default function DoctorFinancialPanel({ 
  user, 
  selectedDate, 
  onSwitchToDoctor 
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [forbiddenError, setForbiddenError] = useState(null);
  const [dateFilter, setDateFilter] = useState(selectedDate);

  const fetchAnalytics = async (d) => {
    setLoading(true);
    setForbiddenError(null);
    try {
      const res = await api.getDoctorFinancialAnalytics(d);
      setData(res);
    } catch (err) {
      if (err.status === 403) {
        setForbiddenError(err.message || 'هذا القسم مخصص للطبيب فقط. غير مصرح للمساعد بالاطلاع على الإيرادات المجمعة.');
      } else {
        setForbiddenError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setDateFilter(selectedDate);
    fetchAnalytics(selectedDate);
  }, [selectedDate, user]);

  // If user is Assistant or forbidden error received:
  if (!user?.is_doctor || forbiddenError) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-3xl border border-red-200 p-8 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">قسم الحسابات المالية المشفر (خاص بالطبيب فقط)</h2>
            <p className="text-xs text-red-600 font-semibold mt-1">
              {forbiddenError || 'تم رفض الوصول (HTTP 403 Forbidden). صلاحيات الاستقبال لا تسمح بالاطلاع على الإيرادات المجمعة أو أرباح العيادة.'}
            </p>
          </div>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            وفقاً لسياسة الأمان والخصوصية (Role-Based Access Control)، يُمنع المساعد منعاً باتاً من الوصول لدفتر اليومية أو إحصائيات الدخل الشهري والشفتات.
          </p>
          <div className="pt-2">
            <span className="inline-block px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200">
              🔒 يرجى تسجيل الدخول بحساب الطبيب للوصول إلى هذه الشاشة
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="py-16 text-center text-xs text-slate-500 font-bold">
        جاري تحميل التقارير المالية والتحليلات...
      </div>
    );
  }

  const daySummary = data?.day_summary || {};
  const shiftBreakdown = data?.shift_breakdown || {};
  const treatmentBreakdown = data?.treatment_breakdown || {};
  const clinicTotals = data?.clinic_totals || {};
  const monthSummary = data?.month_summary || {};
  const ledger = data?.recent_ledger || [];

  return (
    <div className="space-y-6">
      {/* Top Filter & Refresh */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">التقرير المالي الذكي للعيادة (Doctor Exclusive)</h2>
            <p className="text-xs text-slate-500 font-medium">تحليل الدخل، الشفتات، الخصومات الممنوحة، والمتبقيات</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              fetchAnalytics(e.target.value);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
          />
          <button
            onClick={() => fetchAnalytics(dateFilter)}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected Today */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">الدخل المحصل اليوم</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono">
              {daySummary.total_revenue?.toLocaleString() || 0} <span className="text-xs font-normal text-slate-500">ج.م</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span>إجمالي المسدد من {daySummary.visits_count || 0} زيارات اليوم</span>
            </div>
          </div>
        </div>

        {/* Morning Shift Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">دخل الشيفت الصباحي</span>
            <span className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono">
              {shiftBreakdown.morning?.paid_amount?.toLocaleString() || 0} <span className="text-xs font-normal text-slate-500">ج.م</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              عدد الحالات: {shiftBreakdown.morning?.visits_count || 0} حالة
            </div>
          </div>
        </div>

        {/* Evening Shift Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">دخل الشيفت المسائي</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono">
              {shiftBreakdown.evening?.paid_amount?.toLocaleString() || 0} <span className="text-xs font-normal text-slate-500">ج.م</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              عدد الحالات: {shiftBreakdown.evening?.visits_count || 0} حالة
            </div>
          </div>
        </div>

        {/* Total Outstanding Balances */}
        <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي الباقي طرف المرضى</span>
            <span className="p-2 rounded-xl bg-red-50 text-red-600">
              <Receipt className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-red-600 font-mono">
              {clinicTotals.total_outstanding_balances?.toLocaleString() || 0} <span className="text-xs font-normal text-slate-500">ج.م</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              ديون معلقة جاري تحصيلها
            </div>
          </div>
        </div>
      </div>

      {/* Secondary KPI: VIP Discounts & Monthly overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Discounts Card */}
        <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">إجمالي خصومات VIP اليوم</span>
              <span className="text-base font-black text-amber-900 font-mono">
                {daySummary.total_discount?.toLocaleString() || 0} ج.م
              </span>
            </div>
          </div>
          <div className="text-left text-[11px] text-amber-800">
            طوال الوقت: {clinicTotals.total_lifetime_discounts?.toLocaleString() || 0} ج.م
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">دخل الشهر الحالي</span>
              <span className="text-base font-black text-emerald-900 font-mono">
                {monthSummary.total_revenue?.toLocaleString() || 0} ج.م
              </span>
            </div>
          </div>
          <div className="text-left text-[11px] text-emerald-800">
            {monthSummary.visits_count || 0} كشف هذا الشهر
          </div>
        </div>

        {/* Orthodontics Section Revenue */}
        <div className="bg-purple-50/70 border border-purple-200 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">إيراد قسم التقويم اليوم</span>
              <span className="text-base font-black text-purple-900 font-mono">
                {treatmentBreakdown.ortho_total?.paid_amount?.toLocaleString() || 0} ج.م
              </span>
            </div>
          </div>
          <div className="text-left text-[11px] text-purple-800">
            {treatmentBreakdown.ortho_total?.visits_count || 0} حالة تقويم
          </div>
        </div>
      </div>

      {/* Treatment Breakdown Grid */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>توزيع الإيرادات حسب نوع الخدمة والعيادة</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs text-slate-600 font-bold mb-1">كشف عام واستشارات</div>
            <div className="text-lg font-black text-slate-900 font-mono">
              {treatmentBreakdown.general?.paid_amount?.toLocaleString() || 0} ج.م
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {treatmentBreakdown.general?.visits_count || 0} حالة | متبقي: {treatmentBreakdown.general?.remaining_amount || 0} ج.م
            </div>
          </div>

          <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-200">
            <div className="text-xs text-purple-900 font-bold mb-1">تركيب تقويم جديد (9:00 ص)</div>
            <div className="text-lg font-black text-purple-900 font-mono">
              {treatmentBreakdown.ortho_new_fit?.paid_amount?.toLocaleString() || 0} ج.م
            </div>
            <div className="text-[11px] text-purple-700 mt-1">
              {treatmentBreakdown.ortho_new_fit?.visits_count || 0} حالة تركيب | متبقي: {treatmentBreakdown.ortho_new_fit?.remaining_amount || 0} ج.م
            </div>
          </div>

          <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-200">
            <div className="text-xs text-indigo-900 font-bold mb-1">متابعة تقويم دورية</div>
            <div className="text-lg font-black text-indigo-900 font-mono">
              {treatmentBreakdown.ortho_followup?.paid_amount?.toLocaleString() || 0} ج.م
            </div>
            <div className="text-[11px] text-indigo-700 mt-1">
              {treatmentBreakdown.ortho_followup?.visits_count || 0} حالة متابعة | متبقي: {treatmentBreakdown.ortho_followup?.remaining_amount || 0} ج.م
            </div>
          </div>
        </div>
      </div>

      {/* Live Financial Ledger (دفتر اليومية المباشر) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">دفتر اليومية وسجل المعاملات النقدية</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">آخر المعاملات المسجلة</span>
        </div>

        <div className="sm:hidden px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500 font-bold text-center">
          👈 اسحب أفقياً لعرض باقي تفاصيل دفتر اليومية 👉
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[760px] text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="py-3 px-4">الوقت</th>
                <th className="py-3 px-4">المريض</th>
                <th className="py-3 px-4">النوع</th>
                <th className="py-3 px-4">الشيفت</th>
                <th className="py-3 px-4">التكلفة</th>
                <th className="py-3 px-4">خصم</th>
                <th className="py-3 px-4">المطلوب</th>
                <th className="py-3 px-4">المدفوع</th>
                <th className="py-3 px-4">الباقي</th>
                <th className="py-3 px-4">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-slate-400 font-semibold">
                    لا توجد فواتير أو حركات نقدية مسجلة في هذا اليوم بعد
                  </td>
                </tr>
              ) : (
                ledger.map((item) => (
                  <tr key={item.invoice_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono text-slate-500">{item.time}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{item.patient_name}</td>
                    <td className="py-3 px-4 text-slate-700">{item.visit_type_display}</td>
                    <td className="py-3 px-4 text-slate-600">{item.shift_display}</td>
                    <td className="py-3 px-4 font-mono font-medium">{item.total_amount} ج.م</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-700">
                      {item.discount > 0 ? `-${item.discount} ج.م` : '0'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.net_amount} ج.م</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600">{item.paid_amount} ج.م</td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <span className={item.remaining_amount > 0 ? 'text-red-600' : 'text-slate-400'}>
                        {item.remaining_amount > 0 ? `${item.remaining_amount} ج.م` : 'خالص'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{item.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
