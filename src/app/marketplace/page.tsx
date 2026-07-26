// src/app/marketplace/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ResourceGrid from '@/components/marketplace/ResourceGrid'
import FilterSidebar from '@/components/marketplace/FilterSidebar'
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader'

interface SearchParams {
  curriculum?: string
  resourceType?: string
  subject?: string
  gradeLevel?: string
  search?: string
  page?: string
}

export const dynamic = 'force-dynamic'

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createServerSupabaseClient()
  const page = parseInt(searchParams.page || '1', 10)
  const limit = 20
  const offset = (page - 1) * limit

  // Build query
  let query = supabase
    .from('resources')
    .select(`
      *,
      profiles:author_id (
        full_name,
        avatar_url
      )
    `, { count: 'exact' })
    .eq('is_published', true)

  // Apply filters
  if (searchParams.curriculum) {
    query = query.eq('curriculum', searchParams.curriculum)
  }
  if (searchParams.resourceType) {
    query = query.eq('resource_type', searchParams.resourceType)
  }
  if (searchParams.subject) {
    query = query.eq('subject', searchParams.subject)
  }
  if (searchParams.gradeLevel) {
    query = query.eq('grade_level', searchParams.gradeLevel)
  }
  if (searchParams.search) {
    query = query.ilike('title', `%${searchParams.search}%`)
  }

  // Get total count for pagination
  const { count: totalCount } = await query

  // Get paginated results
  const { data: resources, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching resources:', error)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Error Loading Resources</h2>
          <p className="text-gray-600">Please try again later</p>
        </div>
      </div>
    )
  }

  // Get filter options
  const { data: curricula } = await supabase
    .from('resources')
    .select('curriculum')
    .eq('is_published', true)
    .distinct()

  const { data: resourceTypes } = await supabase
    .from('resources')
    .select('resource_type')
    .eq('is_published', true)
    .distinct()

  const { data: subjects } = await supabase
    .from('resources')
    .select('subject')
    .eq('is_published', true)
    .distinct()

  const totalPages = Math.ceil((totalCount || 0) / limit)

  return (
    <div className="container mx-auto px-4 py-8">
      <MarketplaceHeader />
      
      <div className="flex flex-col lg:flex-row gap-8 mt-8">
        <aside className="lg:w-64 flex-shrink-0">
          <FilterSidebar
            curricula={curricula?.map(c => c.curriculum) || []}
            resourceTypes={resourceTypes?.map(r => r.resource_type) || []}
            subjects={subjects?.map(s => s.subject) || []}
            currentFilters={searchParams}
          />
        </aside>
        
        <main className="flex-1">
          <ResourceGrid 
            resources={resources || []} 
            totalCount={totalCount || 0}
            currentPage={page}
            totalPages={totalPages}
          />
        </main>
      </div>
    </div>
  )
}
