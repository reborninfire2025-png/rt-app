import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.chosen1.ai';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('rt_token');
      localStorage.removeItem('rt_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const auth = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
};

export const payments = {
  getPlans: () => api.get('/api/payments/plans'),
  createCheckout: (data) => api.post('/api/payments/create-checkout-session', data),
  getSubscription: () => api.get('/api/payments/subscription'),
  cancel: () => api.post('/api/payments/cancel'),
};

export const aiEngine = {
  query: (data) => api.post('/api/ai/query', data),
  interpretABG: (data) => api.post('/api/ai/abg-interpret', data),
  getDisease: (name, context) => api.get(`/api/ai/disease/${name}?context=${context}`),
};

export const practice = {
  getQuestions: (data) => api.post('/api/practice/questions', data),
  submitAnswer: (data) => api.post('/api/practice/submit-answer', data),
  getCategories: () => api.get('/api/practice/categories'),
  getStats: (userId) => api.get(`/api/practice/stats/${userId}`),
};

export const simulations = {
  analyzeVent: (data) => api.post('/api/simulations/analyze', data),
  getModes: () => api.get('/api/simulations/modes'),
  weaningAssessment: (data) => api.post('/api/simulations/weaning-assessment', data),
};

export default api;
