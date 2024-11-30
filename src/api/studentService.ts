import axios, { AxiosError } from 'axios'
import type { Student } from '@/interfaces/studentInterface'

// const API_URL = 'http://localhost:3001'
const API_URL = 'http://localhost:8081/api'

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const studentService = {
  async getAllStudents (): Promise<Student[]> {
    try {
      const response = await apiClient.get('/students')
      return response.data
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        })
        throw new Error(`Failed to fetch students: ${error.message}`)
      }
      throw error
    }
  },

  async getStudentById (id: number): Promise<Student> {
    const response = await apiClient.get(`/students/${id}`)
    return response.data
  },

  async createStudent (student: Omit<Student, 'id'>): Promise<Student> {
    const response = await apiClient.post('/students', student)
    return response.data
  },

  async updateStudent (id: string, student: Partial<Student>): Promise<Student> {
    const response = await apiClient.put(`/students/${id}`, student)
    return response.data
  },

  async deleteStudent (id: string): Promise<void> {
    await apiClient.delete(`/students/${id}`)
  },
}
