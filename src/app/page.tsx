// src/app/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import HeroSection from '@/components/home/HeroSection'
import FeaturedResources from '@/components/home/FeaturedResources'
import CategoriesSection from '@/components/home/CategoriesSection'
import StatsSection from '@/components/home/StatsSection'
import TestimonialsSection from '@/components/home/TestimonialsSection'
import CTASection from '@/components/home/CTASection'
import HowItWorks from '@/components/home/HowItWorks'
import NewsletterSection from '@/components/home/NewsletterSection'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

export default async function HomePage() {
  const supabase = createServerSupabaseClient()

  try {
    // Fetch featured resources
    const { data: featuredResources } = await supabase
      .from('resources')
      .select(`
        *,
        profiles:author_id (
          full_name,
          avatar_url
        )
      `)
      .eq('is_published', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(8)

    // Fetch popular resources
    const { data: popularResources } = await supabase
      .from('resources')
      .select(`
        *,
        profiles:author_id (
          full_name,
          avatar_url
        )
      `)
      .eq('is_published', true)
      .order('downloads_count', { ascending: false })
      .limit(6)

    // Get statistics
    const { count: totalResources } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)

    const { count: totalTeachers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'teacher')

    const { count: totalDownloads } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'paid')

    const stats = {
      resources: totalResources || 0,
      teachers: totalTeachers || 0,
      downloads: totalDownloads || 0,
    }

    return (
      <main className="min-h-screen">
        <HeroSection />
        <CategoriesSection />
        <FeaturedResources resources={featuredResources || []} />
        <HowItWorks />
        <StatsSection stats={stats} />
        <TestimonialsSection />
        <CTASection />
        <NewsletterSection />
      </main>
    )
  } catch (error) {
    console.error('Error fetching data:', error)
    // Return fallback UI with empty data
    return (
      <main className="min-h-screen">
        <HeroSection />
        <CategoriesSection />
        <FeaturedResources resources={[]} />
        <HowItWorks />
        <StatsSection stats={{ resources: 0, teachers: 0, downloads: 0 }} />
        <TestimonialsSection />
        <CTASection />
        <NewsletterSection />
      </main>
    )
  }
}
