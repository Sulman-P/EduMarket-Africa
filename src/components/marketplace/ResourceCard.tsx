// src/components/marketplace/ResourceCard.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Download, Star } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface ResourceCardProps {
  resource: {
    id: string
    title: string
    description: string
    price_kes: number
    price_usd: number
    currency: string
    thumbnail_url: string
    curriculum: string
    grade_level: string
    subject: string
    resource_type: string
    downloads_count: number
    rating: number
    profiles: {
      full_name: string
      avatar_url: string
    }
  }
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  const [isLiked, setIsLiked] = useState(false)

  const displayPrice = resource.currency === 'KES' 
    ? formatPrice(resource.price_kes, 'KES')
    : formatPrice(resource.price_usd, 'USD')

  return (
    <div className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <Link href={`/resources/${resource.id}`}>
        <div className="relative h-48 bg-gray-100">
          {resource.thumbnail_url ? (
            <Image
              src={resource.thumbnail_url}
              alt={resource.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-blue-100">
              <span className="text-gray-400">No preview</span>
            </div>
          )}
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={(e) => {
                e.preventDefault()
                setIsLiked(!isLiked)
              }}
              className="p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
            >
              <Heart 
                className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
              />
            </button>
          </div>
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Link href={`/resources/${resource.id}`}>
            <h3 className="font-semibold text-lg text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
              {resource.title}
            </h3>
          </Link>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
            {resource.curriculum}
          </span>
          <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded-full text-xs">
            {resource.resource_type.replace('_', ' ')}
          </span>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {resource.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(resource.rating || 0)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              ({resource.downloads_count} downloads)
            </span>
          </div>
          <span className="text-lg font-bold text-blue-600">
            {displayPrice}
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>By {resource.profiles.full_name}</span>
          </div>
          <Link
            href={`/resources/${resource.id}`}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}
