import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface Course {
  code: string
  name: string
  desc: string
  credits: number
  category: string
  prereqs: string[]
  unlocks: string[]
  reviews: Array<{ user: string; text: string; upvotes: number }>
  resources: Array<{
    icon: string
    title: string
    type: string
    meta: string
    desc: string
  }>
}

export async function getCourses(): Promise<Record<string, Course>> {
  const response = await axios.get(`${API_BASE}/courses`)
  return response.data
}

export interface ChatResponse {
  message: string
  course_states: Record<string, string>
  recommended_courses: Array<{ code: string; reason: string }>
}

export async function chat(message: string, completedCourses: string[]): Promise<ChatResponse> {
  const response = await axios.post(`${API_BASE}/chat`, {
    message,
    completed_courses: completedCourses,
  })
  return response.data
}
