// src/types/index.ts
export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: 'buyer' | 'teacher' | 'admin'
  created_at: string
}

export interface Resource {
  id: string
  title: string
  description?: string
  price_kes: number
  price_usd: number
  currency: 'KES' | 'USD'
  file_path: string
  curriculum: string
  resource_type: string
  author_id: string
  is_published: boolean
  created_at: string
}

export interface Order {
  id: string
  buyer_id: string
  resource_id: string
  amount: number
  currency: 'KES' | 'USD'
  status: 'pending' | 'paid' | 'failed'
  created_at: string
}
