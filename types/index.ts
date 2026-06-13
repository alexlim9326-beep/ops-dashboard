export type Stage = 'prospect' | 'qualified' | 'proposal' | 'won' | 'lost'
export type Priority = 'low' | 'medium' | 'high'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'nurturing' | 'converted' | 'dead'

export interface Deal {
  id: string
  user_id: string
  name: string
  company: string | null
  contact: string | null
  value: number | null
  stage: Stage
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  user_id: string
  name: string
  company: string | null
  source: string | null
  status: LeadStatus
  priority: Priority
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  project: string | null
  due_date: string | null
  priority: Priority
  status: TaskStatus
  created_at: string
  updated_at: string
}

export interface Meeting {
  id: string
  user_id: string
  title: string
  date: string | null
  time: string | null
  attendees: string | null
  location: string | null
  agenda: string | null
  created_at: string
  updated_at: string
}

export interface Deadline {
  id: string
  user_id: string
  title: string
  project: string | null
  date: string
  priority: Priority
  done: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'member'
  created_at: string
}
