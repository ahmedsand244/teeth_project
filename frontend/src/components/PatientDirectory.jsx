import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Phone, User, Calendar, AlertCircle, Edit, Trash2, X, Check, Printer } from 'lucide-react';
import { api } from '../api';

export default function PatientDirectory({ 
  onSelectPatient, 
  onNewBookingForPatient,
  onPrintRecord
}) {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('MALE');
  const [age, setAge] = useState('');
  const [notes, setNotes] = useState('');
  const [isPreExistingOrtho, setIsPreExistingOrtho] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Edit modal state
  const [editingPatient, setEditingPatient] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGender, setEditGender] = useState('MALE');
  const [editAge, setEditAge] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  const fetchPatients = async (query = '') => {
    setLoading(true);
    try {
      const data = await api.getPatients(query);
      setPatients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(search);
  }, [search]);

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);

    try {
      let finalNotes = notes.trim();
      if (isPreExistingOrtho && !finalNotes.includes('تقويم مركب مسبقاً')) {
        finalNotes = finalNotes ? `${finalNotes} | [حالة تقويم مركب مسبقاً قبل النظام]` : '[حالة تقويم مركب مسبقاً قبل النظام]';
      }
      await api.createPatient({
        name: name.trim(),
        phone: phone.trim(),
        gender,
        age: age ? parseInt(age) : null,
        notes: finalNotes,
      });
      setShowAddModal(false);
      setName('');
      setPhone('');
      setAge('');
      setNotes('');
      setIsPreExistingOrtho(false);
      fetchPatients(search);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (p) => {
    setEditingPatient(p);
    setEditName(p.name || '');
    setEditPhone(p.phone || '');
    setEditGender(p.gender || 'MALE');
    setEditAge(p.age || '');
    setEditNotes(p.notes || '');
    setUpdateError(null);
  };

  const handleUpdatePatient = async (e) => {
    e.preventDefault();
    setUpdateError(null);
    setUpdating(true);

    try {
      await api.updatePatient(editingPatient.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        gender: editGender,
        age: editAge ? parseInt(editAge) : null,
        notes: editNotes.trim(),
      });
      setEditingPatient(null);
      fetchPatients(search);
    } catch (err) {
      setUpdateError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePatient = async (p) => {
    if (!window.confirm(`هل أنت متأكد من حذف المريض (${p.name}) وكافة سجلاته نهائياً؟`)) {
      return;
    }

    try {
      await api.deletePatient(p.id);
      fetchPatients(search);
    } catch (err) {
      alert(`خطأ في حذف المريض: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Search & Actions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            placeholder="بحث فوري بالاسم أو رقم الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ إضافة مريض جديد</span>
        </button>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="sm:hidden px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500 font-bold text-center">
          👈 اسحب أفقياً لعرض باقي بيانات الجدول 👉
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[600px] text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-3.5 px-4">اسم المريض</th>
                <th className="py-3.5 px-4">رقم الهاتف</th>
                <th className="py-3.5 px-4">النوع / العمر</th>
                <th className="py-3.5 px-4">عدد الزيارات</th>
                <th className="py-3.5 px-4">الباقي</th>
                <th className="py-3.5 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 font-semibold">
                    جاري تحميل سجل المرضى...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 font-semibold">
                    لا يوجد مرضى مطابقين للبحث
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition group">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => onSelectPatient(p.id)}
                          className="hover:text-teal-700 text-right underline decoration-dotted font-black"
                        >
                          {p.name}
                        </button>
                        {p.notes?.includes('تقويم') && (
                          <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded-md border border-indigo-200">
                            🦷 تقويم
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600" dir="ltr">
                      {p.phone || 'بدون هاتف'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {p.gender === 'MALE' ? 'ذكر' : 'أنثى'} {p.age ? `(${p.age} سنة)` : ''}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-700">
                      {p.visits_count}
                    </td>
                    <td className="py-3 px-4 font-bold">
                      <span className={p.total_remaining_balance > 0 ? 'text-red-600' : 'text-emerald-600'}>
                        {p.total_remaining_balance > 0 ? `${p.total_remaining_balance} ج.م` : 'خالص'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => onSelectPatient(p.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                        >
                          الملف
                        </button>
                        <button
                          onClick={() => onPrintRecord && onPrintRecord(p.id)}
                          className="p-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg transition"
                          title="طباعة ومشاركة السجل الطبي"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onNewBookingForPatient(p)}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 font-bold rounded-lg transition"
                        >
                          حجز
                        </button>
                        {p.notes?.includes('تقويم') && (
                          <button
                            onClick={() => onNewBookingForPatient(p, 'ORTHO_FOLLOWUP')}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-black rounded-lg transition"
                            title="حجز موعد متابعة وشد تقويم مباشر"
                          >
                            شد تقويم
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 rounded-lg transition"
                          title="تعديل بيانات المريض"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePatient(p)}
                          className="p-1 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-700 rounded-lg transition"
                          title="حذف المريض"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 font-['Cairo',sans-serif]">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-slate-200 overflow-hidden max-h-[92vh] flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-teal-50 border-b border-teal-100 flex items-center justify-between shrink-0">
              <h2 className="text-base font-black text-slate-900">+ إضافة مريض جديد</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold shrink-0">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreatePatient} className="p-5 sm:p-6 space-y-3.5 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المريض *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="محمد أحمد إبراهيم"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف (اختياري)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  dir="ltr"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-left focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">العمر</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="25"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">النوع</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-hidden"
                  >
                    <option value="MALE">ذكر</option>
                    <option value="FEMALE">أنثى</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات / تاريخ مرضي</label>
                <textarea
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي حساسيات أو أمراض مزمنة..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Pre-existing Ortho Checkbox */}
              <label className="flex items-center gap-2.5 p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl cursor-pointer hover:bg-indigo-100/70 transition">
                <input
                  type="checkbox"
                  checked={isPreExistingOrtho}
                  onChange={(e) => setIsPreExistingOrtho(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-sm border-indigo-300 focus:ring-indigo-500 cursor-pointer"
                />
                <div className="text-right">
                  <span className="block text-xs font-black text-indigo-950">
                    🦷 حالة تقويم مركب مسبقاً قبل إنشاء النظام
                  </span>
                  <span className="block text-[10px] font-bold text-indigo-700">
                    (تتيح حجز متابعة وشد فوري بدون كشف إجباري)
                  </span>
                </div>
              </label>

              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-1 -mx-5 sm:-mx-6 px-5 sm:px-6 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>{creating ? 'جاري الحفظ...' : 'حفظ المريض'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {editingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 font-['Cairo',sans-serif]">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-slate-200 overflow-hidden max-h-[92vh] flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-teal-50 border-b border-teal-100 flex items-center justify-between shrink-0">
              <h2 className="text-base font-black text-slate-900">تعديل بيانات المريض</h2>
              <button onClick={() => setEditingPatient(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {updateError && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold shrink-0">
                {updateError}
              </div>
            )}

            <form onSubmit={handleUpdatePatient} className="p-5 sm:p-6 space-y-3.5 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المريض *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف (اختياري)</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  dir="ltr"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-left focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">العمر</label>
                  <input
                    type="number"
                    value={editAge}
                    onChange={(e) => setEditAge(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">النوع</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-hidden"
                  >
                    <option value="MALE">ذكر</option>
                    <option value="FEMALE">أنثى</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات / تاريخ مرضي</label>
                <textarea
                  rows="3"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-1 -mx-5 sm:-mx-6 px-5 sm:px-6 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingPatient(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>{updating ? 'جاري الحفظ...' : 'تحديث البيانات'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
