// src/components/marketplace/FilterSidebar.tsx
'use client'

import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

interface FilterSidebarProps {
  curricula: string[]
  resourceTypes: string[]
  subjects: string[]
  currentFilters: any
}

export default function FilterSidebar({ 
  curricula, 
  resourceTypes, 
  subjects,
  currentFilters 
}: FilterSidebarProps) {
  const router = useRouter()

  const applyFilter = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/marketplace?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('/marketplace')
  }

  const hasFilters = Object.keys(currentFilters).some(key => currentFilters[key])

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Curriculum Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Curriculum
          </label>
          <select
            value={currentFilters.curriculum || ''}
            onChange={(e) => applyFilter('curriculum', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Curricula</option>
            {curricula.map((curriculum) => (
              <option key={curriculum} value={curriculum}>
                {curriculum}
              </option>
            ))}
          </select>
        </div>

        {/* Resource Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resource Type
          </label>
          <select
            value={currentFilters.resourceType || ''}
            onChange={(e) => applyFilter('resourceType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {resourceTypes.map((type) => (
              <option key={type} value={type}>
                {type.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject
          </label>
          <select
            value={currentFilters.subject || ''}
            onChange={(e) => applyFilter('subject', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
