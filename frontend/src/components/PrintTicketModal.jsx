import React, { useState } from 'react';
import { 
  Printer, 
  Share2, 
  Copy, 
  Check, 
  X, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  CreditCard, 
  Building2, 
  Send,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { getAppBaseUrl } from '../api';

export default function PrintTicketModal({ isOpen, onClose, ticketData }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !ticketData) return null;

  const {
    id,
    queue_number,
    patient_name,
    patient_phone,
    visit_date,
    shift_display,
    appointment_time,
    visit_type_display,
    paid_amount = 0,
    remaining_amount = 0,
    total_amount = 0,
    clinic_name = 'عيادة الأسنان المتخصصة',
    clinic_phone = '01011079572',
  } = ticketData;

  const publicLink = `${getAppBaseUrl()}/?ticket=${id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const cleanPhone = (patient_phone || '').replace(/[^0-9]/g, '');
    let targetPhone = cleanPhone;
    if (targetPhone.startsWith('01')) {
      targetPhone = '2' + targetPhone; // Egyptian international code
    }

    const message = `مرحباً أ/ ${patient_name || ''} 🦷
تم حجز موعدك بنجاح في ${clinic_name}
📅 التاريخ: ${visit_date || ''}
⏰ التوقيت: ${appointment_time || shift_display || 'حسب الدور'}
🔢 رقم الدور: #${queue_number || '1'}
💰 حالة الدفع: ${paid_amount > 0 ? `تم دفع ${paid_amount} ج.م` : 'غير مدفوع'} ${remaining_amount > 0 ? `(متبقي: ${remaining_amount} ج.م)` : '✓ خالص'}

يمكنك متابعة التذكرة وموعدك عبر الرابط:
${publicLink}

نتشرف بزيارتك!`;

    const waUrl = targetPhone 
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    window.open(waUrl, '_blank');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=450,height=650');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة للطباعة');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>تذكرة موعد - ${patient_name || ''}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Cairo', sans-serif;
            background: #fff;
            color: #111;
            padding: 12px;
            width: 80mm;
            margin: 0 auto;
            font-size: 13px;
          }
          .ticket-card {
            border: 1.5px dashed #334155;
            border-radius: 12px;
            padding: 14px;
            text-align: center;
          }
          .clinic-header {
            border-bottom: 2px solid #0d9488;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .clinic-name {
            font-size: 16px;
            font-weight: 800;
            color: #0f766e;
          }
          .clinic-phone {
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
          }
          .queue-badge {
            background: #f0fdfa;
            border: 2px solid #0d9488;
            border-radius: 12px;
            padding: 8px 12px;
            margin: 10px 0;
            display: inline-block;
          }
          .queue-title {
            font-size: 12px;
            color: #0f766e;
            font-weight: 600;
          }
          .queue-num {
            font-size: 32px;
            font-weight: 900;
            color: #0f766e;
            line-height: 1;
            margin-top: 2px;
          }
          .info-list {
            text-align: right;
            margin-top: 12px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 8px;
            font-size: 12px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            border-bottom: 1px dotted #e2e8f0;
          }
          .info-label {
            color: #64748b;
            font-weight: 600;
          }
          .info-val {
            font-weight: 700;
            color: #0f172a;
          }
          .payment-box {
            background: #f8fafc;
            border-radius: 8px;
            padding: 8px;
            margin-top: 10px;
            text-align: right;
          }
          .footer-note {
            margin-top: 12px;
            font-size: 10px;
            color: #64748b;
            text-align: center;
            border-top: 1px dashed #cbd5e1;
            padding-top: 8px;
          }
          @media print {
            body { width: 100%; padding: 0; }
            .ticket-card { border: 1px solid #000; }
          }
        </style>
      </head>
      <body>
        <div class="ticket-card">
          <div class="clinic-header">
            <div class="clinic-name">🦷 ${clinic_name}</div>
            <div class="clinic-phone">📞 للتواصل: ${clinic_phone}</div>
          </div>

          <div class="queue-badge">
            <div class="queue-title">رقم الدور (Queue No)</div>
            <div class="queue-num">#${queue_number || '1'}</div>
          </div>

          <div class="info-list">
            <div class="info-row">
              <span class="info-label">اسم المريض:</span>
              <span class="info-val">${patient_name || 'غير محدد'}</span>
            </div>
            ${patient_phone ? `
            <div class="info-row">
              <span class="info-label">الهاتف:</span>
              <span class="info-val" dir="ltr">${patient_phone}</span>
            </div>` : ''}
            <div class="info-row">
              <span class="info-label">التاريخ:</span>
              <span class="info-val">${visit_date || ''}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الفترة / الشيفت:</span>
              <span class="info-val">${shift_display || 'صباحي'}</span>
            </div>
            ${appointment_time ? `
            <div class="info-row">
              <span class="info-label">الموعد المحدد:</span>
              <span class="info-val" style="color: #0d9488;">${appointment_time}</span>
            </div>` : ''}
            <div class="info-row">
              <span class="info-label">نوع الزيارة:</span>
              <span class="info-val">${visit_type_display || 'كشف'}</span>
            </div>
          </div>

          <div class="payment-box">
            <div class="info-row">
              <span class="info-label">المبلغ المدفوع:</span>
              <span class="info-val" style="color: #16a34a;">${paid_amount} ج.م</span>
            </div>
            ${remaining_amount > 0 ? `
            <div class="info-row">
              <span class="info-label">المتبقي:</span>
              <span class="info-val" style="color: #dc2626;">${remaining_amount} ج.م</span>
            </div>` : `
            <div class="info-row">
              <span class="info-label">حالة الحساب:</span>
              <span class="info-val" style="color: #16a34a;">خالص تماماً ✓</span>
            </div>`}
          </div>

          <div class="footer-note">
            * يرجى التواجد قبل الموعد بـ 10 دقائق.<br>
            رابط التذكرة الإلكتروني: ${publicLink}
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">تذكرة الحجز والموعد</h3>
              <p className="text-xs text-teal-100">طباعة إيصال أو مشاركة رابط إلكتروني</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ticket Preview Card */}
        <div className="p-6 bg-slate-50">
          <div className="bg-white border-2 border-dashed border-teal-200 rounded-2xl p-5 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-500" />
            
            {/* Clinic Info */}
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-xl">🦷</span>
              <h4 className="font-extrabold text-slate-800 text-base">{clinic_name}</h4>
            </div>
            <p className="text-xs text-slate-500 mb-3">هاتف الاستقبال: {clinic_phone}</p>

            {/* Queue Badge */}
            <div className="inline-flex flex-col items-center justify-center bg-teal-50/80 border-2 border-teal-500 rounded-2xl px-6 py-2.5 mb-4 shadow-inner">
              <span className="text-xs font-bold text-teal-800">رقم الدور في الشيفت</span>
              <span className="text-3xl font-black text-teal-700 tracking-wider">#{queue_number || '1'}</span>
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm text-right bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" /> المريض:
                </span>
                <span className="font-bold text-slate-800">{patient_name || 'غير محدد'}</span>
              </div>

              {patient_phone && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-slate-400" /> رقم الهاتف:
                  </span>
                  <span className="font-semibold text-slate-700" dir="ltr">{patient_phone}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" /> تاريخ الزيارة:
                </span>
                <span className="font-bold text-slate-800">{visit_date}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" /> الفترة / الوقت:
                </span>
                <span className="font-bold text-teal-700">
                  {shift_display} {appointment_time ? `(${appointment_time})` : ''}
                </span>
              </div>

              <div className="border-t border-slate-200/80 pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-slate-400" /> حالة الدفع:
                  </span>
                  <div className="text-left">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                      مدفوع: {paid_amount} ج.م
                    </span>
                    {remaining_amount > 0 && (
                      <span className="inline-block mr-1.5 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                        متبقي: {remaining_amount} ج.م
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-slate-400">
              يرجى إبراز هذه التذكرة أو رقم الدور عند وصولك العيادة
            </div>
          </div>

          {/* Public Link Box */}
          <div className="mt-4 bg-teal-50/70 border border-teal-200 rounded-xl p-3 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1 text-right">
              <span className="text-[11px] font-bold text-teal-800 block mb-0.5">رابط الموعد الإلكتروني للمريض:</span>
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
        <div className="p-4 bg-white border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
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
            <span>إرسال واتساب</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold flex items-center gap-2 shadow-md shadow-teal-500/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التذكرة</span>
          </button>
        </div>

      </div>
    </div>
  );
}
