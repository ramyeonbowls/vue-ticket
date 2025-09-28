import { defineStore } from 'pinia'
import axios from '@/plugins/axios'

interface User {
  id: number
  name: string
  email: string
}

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: User | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('token'),
    refreshToken: localStorage.getItem('refreshToken'),
    user: null,
  }),

  actions: {
    async login(email: string, password: string) {
      try {
        const res = await axios.post('/login', {
          email,
          password,
        })

        this.token = res.data.access_token
        this.refreshToken = res.data.refresh_token

        localStorage.setItem('token', this.token)
        localStorage.setItem('refreshToken', this.refreshToken)

        await this.fetchUser()
      } catch (err) {
        throw err
      }
    },

    async fetchUser() {
      if (!this.token) return
      try {
        const res = await axios.get('/me', {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        })
        this.user = res.data
      } catch (err) {
        this.logout()
      }
    },

    async refresh() {
      if (!this.refreshToken) return
      try {
        const res = await axios.post('/refresh', {
          refresh_token: this.refreshToken,
        })

        this.token = res.data.access_token
        localStorage.setItem('token', this.token)
      } catch (err) {
        this.logout()
        throw err
      }
    },

    logout() {
      this.token = null
      this.refreshToken = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
    },
  },
})
