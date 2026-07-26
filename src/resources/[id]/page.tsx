// src/app/resources/[id]/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ResourceViewer from '@/components/marketplace/ResourceViewer'
import PaymentButton from '@/components/marketplace/PaymentButton'

export default async function ResourcePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerSupabaseClient()

  const { data: resource, error } = await supabase
    .from('resources')
    .select(`
      *,
      profiles:author_id (
        id,
        full_name,
        avatar_url,
        bio,
        rating
      )
    `)
    .eq('id', params.id)
    .eq('is_published', true)
    .single()

  if (error || !resource) {
    notFound()
  }

  // Get user session
  const { data: { user } } = await supabase.auth.getUser()

  // Check if user has already purchased this resource
  let hasPurchased = false
  if (user) {
    const { data: order } = await supabase
      .from('orders')
      .select('id')
      .eq('resource_id', resource.id)
      .eq('buyer_id', user.id)
      .eq('status', 'paid')
      .single()
    
    hasPurchased = !!order
  }

  // Get reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles:reviewer_id (
        full_name,
        avatar_url
      )
    `)
    .eq('resource_id', resource.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ResourceViewer resource={resource} />
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {resource.title}
              </h2>
              <div className="mt-2 flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  {resource.curriculum}
                </span>
                <span className="px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-sm">
                  {resource.resource_type.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="border-t border-b border-gray-100 py-4 my-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Price</span>
                <span className="text-2xl font-bold text-blue-600">
                  {resource.currency === 'KES' 
                    ? `KSh ${resource.price_kes}`
                    : `$${resource.price_usd}`
                  }
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {resource.currency === 'KES' 
                  ? '~ $' + (resource.price_kes / 150).toFixed(2)
                  : '~ KSh ' + (resource.price_usd * 150).toFixed(0)
                }
              </div>
            </div>

            <div className="space-y-3">
              {hasPurchased ? (
                <div className="p-4 bg-green-50 text-green-800 rounded-md text-center">
                  <p className="font-semibold">✓ Purchased</p>
                  <a
                    href={`/api/resources/${resource.id}/download`}
                    className="mt-2 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Download Now
                  </a>
                </div>
              ) : (
                <PaymentButton resource={resource} user={user} />
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>📥 {resource.downloads_count} downloads</span>
                <span>👁 {resource.views_count} views</span>
                <span>⭐ {resource.rating || 0} rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
