/**
 * Centralized API client for DentFlow Pro
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

/**
 * Returns dynamic public base URL of the site automatically:
 * On localhost: http://localhost:5173
 * On hosting/domain: https://myclinic.com (or custom VITE_PUBLIC_URL)
 */
export const getAppBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return (import.meta.env.VITE_PUBLIC_URL || window.location.origin).replace(/\/$/, '');
  }
  return '';
};

export const getAuthToken = () => localStorage.getItem('dentflow_token');
export const setAuthToken = (token) => localStorage.setItem('dentflow_token', token);
export const clearAuthToken = () => {
  localStorage.removeItem('dentflow_token');
  localStorage.removeItem('dentflow_user');
};

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('dentflow_user'));
  } catch (e) {
    return null;
  }
};

export const setStoredUser = (user) => {
  localStorage.setItem('dentflow_user', JSON.stringify(user));
};

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Token ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errorMessage = 'حدث خطأ في الاتصال بالخادم';
    if (typeof data === 'string') {
      errorMessage = data;
    } else if (data.detail) {
      errorMessage = data.detail;
    } else if (data.error) {
      errorMessage = data.error;
    } else if (typeof data === 'object') {
      const messages = Object.entries(data).map(([field, err]) => {
        const text = Array.isArray(err) ? err.join(', ') : err;
        return `${field !== 'non_field_errors' ? field + ': ' : ''}${text}`;
      });
      errorMessage = messages.join(' | ');
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (username, password) => request('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }),
  getCurrentUser: () => request('/auth/me/'),
  logout: () => request('/auth/logout/', { method: 'POST' }),
  changePassword: (data) => request('/auth/change-password/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  forgotPassword: (data) => request('/auth/forgot-password/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getClinicSettings: () => request('/auth/clinic-settings/'),
  updateClinicSettings: (data) => request('/auth/clinic-settings/', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  registerDoctor: (data) => request('/auth/register-doctor/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  registerAssistant: (data) => request('/auth/register-assistant/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getPendingAssistants: () => request('/auth/pending-assistants/'),
  approveAssistant: (assistant_id) => request('/auth/pending-assistants/', {
    method: 'POST',
    body: JSON.stringify({ assistant_id, action: 'approve' }),
  }),
  rejectAssistant: (assistant_id) => request('/auth/pending-assistants/', {
    method: 'POST',
    body: JSON.stringify({ assistant_id, action: 'reject' }),
  }),
  getStaff: () => request('/auth/staff/'),
  createStaff: (data) => request('/auth/staff/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteStaff: (id) => request(`/auth/staff/${id}/`, {
    method: 'DELETE',
  }),

  // SaaS Platform Owner Management (لصاحب الموقع)
  getSaaSClinics: () => request('/auth/saas/clinics/'),
  createSaaSClinic: (data) => request('/auth/saas/clinics/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  renewSaaSSubscription: (clinicId, days = 30) => request(`/auth/saas/renew-subscription/${clinicId}/`, {
    method: 'POST',
    body: JSON.stringify({ days }),
  }),
  toggleSaaSClinicStatus: (clinicId) => request(`/auth/saas/toggle-clinic/${clinicId}/`, {
    method: 'POST',
  }),
  deleteSaaSClinic: (clinicId) => request(`/auth/saas/delete-clinic/${clinicId}/`, {
    method: 'DELETE',
  }),

  // Patients
  getPatients: (search = '') => request(`/patients/?search=${encodeURIComponent(search)}`),
  createPatient: (data) => request('/patients/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updatePatient: (id, data) => request(`/patients/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deletePatient: (id) => request(`/patients/${id}/`, {
    method: 'DELETE',
  }),
  getPatient: (id) => request(`/patients/${id}/`),

  // Appointments
  getAppointments: (date, shift, search = '') => {
    let url = `/appointments/?date=${date}&shift=${shift}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return request(url);
  },
  getShiftSummary: (date, shift) => request(`/appointments/shift_summary/?date=${date}&shift=${shift}`),
  createAppointment: (data) => request('/appointments/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateAppointment: (id, data) => request(`/appointments/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteAppointment: (id) => request(`/appointments/${id}/`, {
    method: 'DELETE',
  }),
  updateAppointmentStatus: (id, status) => request(`/appointments/${id}/update_status/`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  updateAppointmentNotes: (id, doctor_notes) => request(`/appointments/${id}/update_notes/`, {
    method: 'PATCH',
    body: JSON.stringify({ doctor_notes }),
  }),
  callInPatient: (id) => request(`/appointments/${id}/call_in/`, {
    method: 'POST',
  }),
  saveAppointmentProcedures: (id, data) => request(`/appointments/${id}/procedures/`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  checkoutAppointment: (id, data) => request(`/appointments/${id}/checkout/`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getDoctorDashboard: (date = '') => request(`/appointments/doctor_dashboard/?date=${date}`),

  // Services Catalog
  getServices: (search = '') => request(`/billing/services/?search=${encodeURIComponent(search)}`),
  getCommonServices: () => request('/billing/services/common/'),
  createService: (data) => request('/billing/services/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Payments & Billing
  updateInvoice: (id, data) => request(`/billing/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  recordPayment: (id, additional_payment, notes = '') => request(`/billing/${id}/record_payment/`, {
    method: 'PATCH',
    body: JSON.stringify({ additional_payment, notes }),
  }),
  createPayment: (data) => request('/billing/payments/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getPatientFinancialProfile: (patientId) => request(`/patients/${patientId}/financial_profile/`),
  payPatientDebt: (patientId, amount, notes = '') => request(`/patients/${patientId}/pay_debt/`, {
    method: 'POST',
    body: JSON.stringify({ amount, notes }),
  }),

  // Analytics (Doctor Only)
  getDoctorFinancialAnalytics: (date) => request(`/analytics/dashboard/?date=${date}`),

  // Public Shared Records & Tickets (No auth required)
  getPublicTicket: (id) => request(`/appointments/public-ticket/${id}/`),
  getPublicPatientRecord: (id) => request(`/patients/public-record/${id}/`),
};
