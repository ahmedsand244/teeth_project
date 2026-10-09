import React, { useState } from 'react';
import { FileText, X, Check, AlertCircle, Stethoscope } from 'lucide-react';
import { api } from '../api';

export default function ClinicalNotesModal({ 
  isOpen, 
  onClose, 
  appointment, 
  onSuccess 
}) {
  if (!isOpen || !appointment) return null;

  const [notes, setNotes] = useState(appointment.doctor_notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.updateAppointmentNotes(appointment.id, notes);
      onSuccess('تم حفظ الملاحظات والتشخيص الطبي بنجاح!');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-teal-50 border-b border-teal-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">الملف الإكلينيكي والتشخيص الطبي</h2>
              <p className="text-xs text-teal-800 font-medium">
                {appointment.patient_details?.name} - {appointment.visit_type_display}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ملاحظات الطبيب وخطة العلاج (Doctor Clinical Notes)
            </label>
            <textarea
              rows="6"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب التشخيص، الإجراءات المنجزة، أو خطة الجلسة القادمة..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-2 transition"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'جاري الحفظ...' : 'حفظ التقرير الطبي'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
