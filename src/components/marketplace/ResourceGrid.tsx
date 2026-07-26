// src/components/marketplace/ResourceGrid.tsx
'use client'

import ResourceCard from './ResourceCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ResourceGridProps {
  resources: any[]
  totalCount: number
  currentPage: number
  totalPages: number
}

export default function ResourceGrid({ 
  resources, 
  totalCount, 
  currentPage, 
  totalPages 
}: ResourceGridProps) {
  const router = useRouter()

  if (resources.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No resources found
        </h3>
        <p className="text-gray-600">
          Try adjusting your filters or search terms
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-600">
          Showing {resources.length} of {totalCount} resources
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => router.push(`/marketplace?page=${currentPage - 1}`)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => router.push(`/marketplace?page=${currentPage + 1}`)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}
