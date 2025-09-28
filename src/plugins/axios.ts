import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const instance = axios.create({
  baseURL: 'http://localhost:3000/api',
})

let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  failedQueue = []
}

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor response untuk handle expired token
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const auth = useAuthStore()

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return instance(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await auth.refresh()
        isRefreshing = false
        processQueue(null, auth.token)

        originalRequest.headers.Authorization = `Bearer ${auth.token}`
        return instance(originalRequest)
      } catch (err) {
        isRefreshing = false
        processQueue(err, null)
        auth.logout()
        return Promise.reject(err)
      }
    }

    return Promise.reject(error)
  },
)

export default instance
