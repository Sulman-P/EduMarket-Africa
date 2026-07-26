// src/components/home/CTASection.tsx
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export default function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center text-white"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Teaching?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of educators already using EduMarket Africa to access and share quality resources.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-3 bg-white text-blue-600 rounded-xl font-medium hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/marketplace"
              className="px-8 py-3 bg-blue-500/20 text-white rounded-xl font-medium hover:bg-blue-500/30 transition-colors border border-white/20"
            >
              Browse Resources
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
