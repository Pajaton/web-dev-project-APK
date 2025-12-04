import axios from 'axios'

export const Api = axios.create({
  baseURL: import.meta.env.VITE_API_ENDPOINT || 'https://localhost:3000/api/v1'
})

export const drinkApi = axios.create({
  baseURL: 'http://localhost:3000/api/v1'
})
