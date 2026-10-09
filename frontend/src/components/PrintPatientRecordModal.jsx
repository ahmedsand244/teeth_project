import React, { useState } from 'react';
import { 
  Printer, 
  Share2, 
  Copy, 
  Check, 
  X, 
  Calendar, 
  User, 
  Phone, 
  FileText, 
  Activity, 
  DollarSign, 
  Send,
  Building2
} from 'lucide-react';
import { getAppBaseUrl } from '../api';

export default function PrintPatientRecordModal({ isOpen, onClose, recordData }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !recordData) return null;

  const {
    patient = {},
    summary = {},
    visits = []
  } = recordData;

  const publicLink = `${getAppBaseUrl()}/?patient_record=${patient.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const cleanPhone = (patient.phone || '').replace(/[^0-9]/g, '');
    let targetPhone = cleanPhone;
    if (targetPhone.startsWith('01')) {
      targetPhone = '2' + targetPhone;
    }

    const message = `مرحباً أ/ ${patient.name || ''} 🦷
ملفك الطبي وسجل زياراتك في ${patient.clinic_name || 'عيادة الأسنان'}:
📊 إجمالي الزيارات: ${summary.visits_count || visits.length}
💰 الرصيد المتبقي: ${summary.total_remaining > 0 ? `${summary.total_remaining} ج.م` : 'خالص تماماً ✓'}

يمكنك استعراض تفاصيل سجلك الطبي ومواعيدك عبر الرابط التالي:
${publicLink}

مع تمنياتنا لك بدوام الصحة والعافية!`;

    const waUrl = targetPhone 
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    window.open(waUrl, '_blank');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة للطباعة');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>السجل الطبي - ${patient.name || ''}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Cairo', sans-serif;
            background: #fff;
            color: #1e293b;
            padding: 24px;
            font-size: 13px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #0f766e;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .clinic-brand {
            text-align: right;
          }
          .clinic-name {
            font-size: 20px;
            font-weight: 800;
            color: #0f766e;
          }
          .clinic-sub {
            font-size: 12px;
            color: #64748b;
          }
          .report-title {
            text-align: left;
          }
          .report-title h2 {
            font-size: 18px;
            color: #0f172a;
            font-weight: 800;
          }
          .report-date {
            font-size: 11px;
            color: #64748b;
          }
          .patient-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 16px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 16px;
          }
          .info-item {
            text-align: right;
          }
          .info-label {
            font-size: 11px;
            color: #64748b;
            font-weight: 600;
          }
          .info-value {
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
          }
          .financial-summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 20px;
          }
          .fin-box {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px;
            text-align: center;
          }
          .fin-val {
            font-size: 16px;
            font-weight: 800;
          }
          .fin-lbl {
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            text-align: right;
          }
          th {
            background: #f1f5f9;
            color: #334155;
            font-weight: 700;
            padding: 8px 10px;
            border: 1px solid #cbd5e1;
            font-size: 12px;
          }
          td {
            padding: 8px 10px;
            border: 1px solid #e2e8f0;
            font-size: 12px;
            vertical-align: top;
          }
          tr:nth-child(even) {
            background: #f8fafc;
          }
          .procedures-tag {
            display: inline-block;
            background: #e0f2fe;
            color: #0369a1;
            padding: 2px 6px;
            border-radius: 4px;
            margin: 2px;
            font-size: 11px;
          }
          .signature-area {
            margin-top: 36px;
            display: flex;
            justify-content: space-between;
            padding-top: 16px;
            border-top: 1px dashed #cbd5e1;
          }
          .sig-box {
            text-align: center;
            width: 200px;
          }
          .sig-line {
            margin-top: 40px;
            border-bottom: 1px solid #94a3b8;
          }
          @media print {
            body { padding: 8mm; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-brand">
            <div class="clinic-name">🦷 ${patient.clinic_name || 'عيادة الأسنان المتخصصة'}</div>
            <div class="clinic-sub">هاتف: ${patient.clinic_phone || '01011079572'}</div>
          </div>
          <div class="report-title">
            <h2>ملف وسجل المريض الطبي</h2>
            <div class="report-date">تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-EG')}</div>
          </div>
        </div>

        <div class="patient-card">
          <div class="info-item">
            <div class="info-label">اسم المريض:</div>
            <div class="info-value">${patient.name || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">رقم الهاتف:</div>
            <div class="info-value" dir="ltr">${patient.phone || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">السن / الجنس:</div>
            <div class="info-value">${patient.age ? `${patient.age} سنة` : '-'} / ${patient.gender === 'F' ? 'أنثى' : 'ذكر'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">الملاحظات الطبية:</div>
            <div class="info-value">${patient.notes || 'لا توجد'}</div>
          </div>
        </div>

        <div class="financial-summary">
          <div class="fin-box" style="border-top: 3px solid #0d9488;">
            <div class="fin-val" style="color: #0f766e;">${summary.visits_count || visits.length}</div>
            <div class="fin-lbl">عدد الزيارات</div>
          </div>
          <div class="fin-box" style="border-top: 3px solid #3b82f6;">
            <div class="fin-val" style="color: #2563eb;">${summary.total_billed || 0} ج.م</div>
            <div class="fin-lbl">إجمالي المطالبات</div>
          </div>
          <div class="fin-box" style="border-top: 3px solid #16a34a;">
            <div class="fin-val" style="color: #16a34a;">${summary.total_paid || 0} ج.م</div>
            <div class="fin-lbl">إجمالي المسدد</div>
          </div>
          <div class="fin-box" style="border-top: 3px solid #ef4444;">
            <div class="fin-val" style="color: #dc2626;">${summary.total_remaining || 0} ج.م</div>
            <div class="fin-lbl">الرصيد المتبقي</div>
          </div>
        </div>

        <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">سجل الزيارات والكشوفات السابقة:</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 15%;">التاريخ والشيفت</th>
              <th style="width: 15%;">نوع الزيارة</th>
              <th style="width: 30%;">الإجراءات والعلاجات</th>
              <th style="width: 25%;">ملاحظات الطبيب</th>
              <th style="width: 15%;">الحساب (المدفوع / المتبقي)</th>
            </tr>
          </thead>
          <tbody>
            ${visits.length === 0 ? `
              <tr>
                <td colspan="5" style="text-align: center; padding: 20px; color: #64748b;">لا توجد زيارات مسجلة حتى الآن</td>
              </tr>
            ` : visits.map(v => `
              <tr>
                <td>
                  <strong>${v.date}</strong><br>
                  <span style="font-size: 11px; color: #64748b;">${v.shift || ''}</span>
                </td>
                <td>${v.visit_type || 'كشف'}</td>
                <td>
                  ${(v.procedures || []).map(p => `<span class="procedures-tag">${p.name} (${p.price} ج.م)</span>`).join(' ') || 'كشف روتيني'}
                </td>
                <td style="color: #334155;">
                  ${v.doctor_notes || '-'}
                </td>
                <td>
                  <span style="color: #16a34a; font-weight: 700;">+${v.paid_amount || 0} ج.م</span><br>
                  ${v.remaining_amount > 0 ? `<span style="color: #dc2626; font-size: 11px;">متبقي: ${v.remaining_amount} ج.م</span>` : '<span style="color: #16a34a; font-size: 11px;">خالص ✓</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="signature-area">
          <div class="sig-box">
            <div style="font-weight: 700;">توقيع الطبيب المعالج</div>
            <div class="sig-line"></div>
          </div>
          <div class="sig-box">
            <div style="font-weight: 700;">ختم العيادة</div>
            <div class="sig-line"></div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-700 to-cyan-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">طباعة ملف وسجل المريض</h3>
              <p className="text-xs text-teal-100">سجل الزيارات الكامل، التشخيصات، والحسابات المالية</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Preview Body */}
        <div className="p-6 overflow-y-auto space-y-4 bg-slate-50 flex-1">
          {/* Patient Info Card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div>
                <span className="text-xs text-slate-400 font-semibold block">المريض:</span>
                <h4 className="text-lg font-black text-slate-800">{patient.name}</h4>
              </div>
              <div className="text-left">
                <span className="text-xs text-slate-400 font-semibold block">الهاتف:</span>
                <span className="text-sm font-mono font-bold text-slate-700" dir="ltr">{patient.phone || '-'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-teal-50/70 p-2.5 rounded-lg border border-teal-100">
                <span className="text-teal-700 block font-semibold">عدد الزيارات</span>
                <span className="text-base font-bold text-teal-800">{summary.visits_count || visits.length}</span>
              </div>
              <div className="bg-blue-50/70 p-2.5 rounded-lg border border-blue-100">
                <span className="text-blue-700 block font-semibold">المطالبات</span>
                <span className="text-base font-bold text-blue-800">{summary.total_billed || 0} ج.م</span>
              </div>
              <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100">
                <span className="text-emerald-700 block font-semibold">المسدد</span>
                <span className="text-base font-bold text-emerald-800">{summary.total_paid || 0} ج.م</span>
              </div>
              <div className="bg-rose-50/70 p-2.5 rounded-lg border border-rose-100">
                <span className="text-rose-700 block font-semibold">المتبقي</span>
                <span className="text-base font-bold text-rose-800">{summary.total_remaining || 0} ج.م</span>
              </div>
            </div>
          </div>

          {/* Visits Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-100/70 border-b border-slate-200/70 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-teal-600" />
                سجل الزيارات السابقة ({visits.length})
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {visits.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  لا توجد زيارات مسجلة لهذا المريض بعد
                </div>
              ) : (
                visits.map((v, idx) => (
                  <div key={idx} className="p-3.5 hover:bg-slate-50 transition-colors text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{v.date}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                          {v.shift}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-teal-100 text-teal-800 font-bold">
                          {v.visit_type}
                        </span>
                      </div>
                      <div className="text-slate-500">
                        {v.doctor_notes ? (
                          <span>تشخيص: <strong className="text-slate-700">{v.doctor_notes}</strong></span>
                        ) : (
                          <span className="text-slate-400">لا توجد ملاحظات سريرية</span>
                        )}
                      </div>
                      {v.procedures && v.procedures.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {v.procedures.map((p, pIdx) => (
                            <span key={pIdx} className="bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded text-[10px] border border-teal-100">
                              {p.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-left shrink-0 sm:border-r sm:border-slate-100 sm:pr-3">
                      <div className="font-bold text-emerald-600">
                        سدد: {v.paid_amount || 0} ج.م
                      </div>
                      {v.remaining_amount > 0 && (
                        <div className="text-[11px] font-semibold text-rose-500">
                          متبقي: {v.remaining_amount} ج.م
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Shareable Link Box */}
          <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1 text-right">
              <span className="text-[11px] font-bold text-teal-800 block mb-0.5">رابط السجل الطبي الإلكتروني للمريض:</span>
              <p className="text-xs text-teal-600 truncate font-mono" dir="ltr">{publicLink}</p>
            </div>
            <button
              onClick={copyLink}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                copied 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'bg-white text-teal-700 border border-teal-300 hover:bg-teal-100'
              }`}
              title="نسخ الرابط"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors"
          >
            إغلاق
          </button>
          
          <button
            onClick={handleWhatsAppShare}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Send className="w-4 h-4" />
            <span>مشاركة واتساب</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold flex items-center gap-2 shadow-md shadow-teal-500/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة السجل الطبي (A4)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
