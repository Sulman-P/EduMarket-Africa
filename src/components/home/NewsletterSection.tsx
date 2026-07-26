// src/components/home/NewsletterSection.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Send } from 'lucide-react'

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      // API call to subscribe
      await new Promise(resolve => setTimeout(resolve, 1000))
      setStatus('success')
      setEmail('')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (error) {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex p-3 bg-blue-50 rounded-2xl mb-4">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Stay Updated
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Subscribe to our newsletter for new resources, teaching tips, and special offers.
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
              <Send className="w-4 h-4" />
            </button>
          </form>

          {status === 'success' && (
            <p className="mt-3 text-green-600">✓ Successfully subscribed!</p>
          )}
          {status === 'error' && (
            <p className="mt-3 text-red-600">Something went wrong. Please try again.</p>
          )}
        </motion.div>
      </div>
    </section>
  )
}
