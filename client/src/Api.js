import axios from 'axios'

export const Api = axios.create({
  baseURL: import.meta.env.VITE_API_ENDPOINT || 'https://localhost:3000/api/v1',
  withCredentials: true
})
