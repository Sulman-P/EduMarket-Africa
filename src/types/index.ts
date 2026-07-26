// src/types/index.ts
export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: 'buyer' | 'teacher' | 'admin'
  country?: string
  phone?: string
  currency_preference: 'KES' | 'USD'
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface Resource {
  id: string
  title: string
  description?: string
  price_kes: number
  price_usd: number
  currency: 'KES' | 'USD'
  file_path: string
  file_size?: number
  mime_type?: string
  thumbnail_url?: string
  curriculum: 'CBC' | '8-4-4' | 'IGCSE' | 'IB' | 'Cambridge' | 'A-Levels'
  education_level?: string
  subject?: string
  grade_level?: string
  resource_type: 'scheme_of_work' | 'lesson_plan' | 'exam' | 'revision_notes' | 'past_paper'
  kicd_strand?: string
  knec_code?: string
  author_id: string
  downloads_count: number
  views_count: number
  rating: number
  is_published: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface Order {
  id: string
  buyer_id: string
  resource_id: string
  amount: number
  currency: 'KES' | 'USD'
  payment_method: 'mpesa' | 'card' | 'bank_transfer'
  megapay_transaction_id?: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  download_url?: string
  download_expires_at?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Payout {
  id: string
  teacher_id: string
  amount: number
  currency: 'KES' | 'USD'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  megapay_transfer_id?: string
  order_ids: string[]
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  resource_id: string
  reviewer_id: string
  rating: number
  comment?: string
  created_at: string
}
