import axios from 'axios'

const api = axios.create({
  baseURL: 'https://soccer-trainer-production.up.railway.app/api/v1',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => {
    const form = new FormData()
    form.append('username', data.email)
    form.append('password', data.password)
    return api.post('/auth/login', form)
  },
}

export const submissionsAPI = {
  create: (file, drillType, config = {}) => {
    const form = new FormData()
    form.append('file', file)
    form.append('drill_type', drillType)
    return api.post('/submissions', form, config)
  },
  list: () => api.get('/submissions'),
  getAnalysis: (id) => api.get(`/submissions/${id}/analysis`),
}

export default api