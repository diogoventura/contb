import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';
const BASE_URL = API_URL ? (API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL) : '';

export const api = axios.create({ baseURL: `${BASE_URL}/api`, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; }
        return Promise.reject(error);
    }
);

export const authApi = {
    login: (email: string, password: string) => api.post('/auth/login', { email, password }),
    getProfile: () => api.get('/auth/me'),
};

export const usersApi = {
    getAll: (page = 1, limit = 20) => api.get('/users', { params: { page, limit } }),
    getById: (id: string) => api.get(`/users/${id}`),
    create: (data: any) => api.post('/users', data),
    update: (id: string, data: any) => api.put(`/users/${id}`, data),
    delete: (id: string) => api.delete(`/users/${id}`),
};

export const productsApi = {
    getAll: (page = 1, limit = 20, search?: string) => api.get('/products', { params: { page, limit, search } }),
    getById: (id: string) => api.get(`/products/${id}`),
    create: (data: any) => api.post('/products', data),
    update: (id: string, data: any) => api.put(`/products/${id}`, data),
    delete: (id: string) => api.delete(`/products/${id}`),
};

export const consortiumsApi = {
    getAll: (page = 1, limit = 20) => api.get('/consortiums', { params: { page, limit } }),
    getById: (id: string) => api.get(`/consortiums/${id}`),
    create: (data: any) => api.post('/consortiums', data),
    update: (id: string, data: any) => api.put(`/consortiums/${id}`, data),
    delete: (id: string) => api.delete(`/consortiums/${id}`),
    getParticipants: (id: string) => api.get(`/consortiums/${id}/participants`),
    addParticipant: (id: string, data: any) => api.post(`/consortiums/${id}/participants`, data),
    updateParticipant: (id: string, data: any) => api.put(`/consortiums/participants/${id}`, data),
    removeParticipant: (id: string) => api.delete(`/consortiums/participants/${id}`),
};

export const salesApi = {
    getAll: (page = 1, limit = 20, status?: string) => api.get('/sales', { params: { page, limit, status } }),
    getById: (id: string) => api.get(`/sales/${id}`),
    create: (data: any) => api.post('/sales', data),
    update: (id: string, data: any) => api.put(`/sales/${id}`, data),
    delete: (id: string) => api.delete(`/sales/${id}`),
    payInstallment: (installmentId: string) => api.post(`/sales/installments/${installmentId}/pay`),
    generateBoleto: (installmentId: string) => api.post(`/sales/installments/${installmentId}/boleto`),
    bulkNotify: (installmentIds: number[]) => api.post(`/sales/installments/bulk-notify`, { installmentIds }),
    getHistory: (phone?: string, email?: string) => api.get('/sales/history', { params: { phone, email } }),
};

export const dashboardApi = {
    getSummary: () => api.get('/dashboard'),
};

export const notificationsApi = {
    getAll: () => api.get('/notifications'),
    getUnreadCount: () => api.get('/notifications/unread-count'),
    markAsRead: (id: number) => api.post(`/notifications/${id}/read`),
    markAllAsRead: () => api.post('/notifications/mark-all-read'),
};

export const whatsappApi = {
    getStatus: () => api.get('/whatsapp/status'),
    getQr: () => api.get('/whatsapp/qr'),
    sendMessage: (to: string, message: string) => api.post('/whatsapp/send', { to, message }),
    logout: () => api.post('/whatsapp/logout'),
};

export const reportsApi = {
    getSummary: () => api.get('/reports/summary'),
    getSalesByMonth: () => api.get('/reports/sales-by-month'),
};

export const settingsApi = {
    getAll: () => api.get('/settings'),
    save: (key: string, value: string) => api.post('/settings', { key, value }),
};

export default api;
