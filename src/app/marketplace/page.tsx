// src/app/marketplace/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ResourceGrid from '@/components/marketplace/ResourceGrid'
import FilterSidebar from '@/components/marketplace/FilterSidebar'

interface SearchParams {
  curriculum?: string
  resourceType?: string
  subject?: string
  gradeLevel?: string
  search?: string
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createServerSupabaseClient()

  let query = supabase
    .from('resources')
    .select(`
      *,
      profiles:author_id (
        full_name,
        avatar_url
      )
    `)
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
    query = query.textSearch('title', searchParams.search)
  }

  const { data: resources, error } = await query
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching resources:', error)
    return <div>Error loading resources</div>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        <aside className="w-64 flex-shrink-0">
          <FilterSidebar
            curricula={curricula?.map(c => c.curriculum) || []}
            resourceTypes={resourceTypes?.map(r => r.resource_type) || []}
          />
        </aside>
        <main className="flex-1">
          <ResourceGrid resources={resources} />
        </main>
      </div>
    </div>
  )
}
