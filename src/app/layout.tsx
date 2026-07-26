// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EduMarket Africa - Digital School Resource Marketplace',
  description: 'Discover, share and grow with Africa\'s premier education marketplace. Access CBC, IGCSE, and international curriculum resources.',
  keywords: 'education resources, CBC curriculum, IGCSE, lesson plans, KNEC past papers, teaching materials, Kenya',
  authors: [{ name: 'EduMarket Africa' }],
  openGraph: {
    title: 'EduMarket Africa - Education Resource Marketplace',
    description: 'Access thousands of curriculum-aligned resources from CBC to IGCSE',
    url: 'https://edumarket-africa.com',
    siteName: 'EduMarket Africa',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EduMarket Africa - Education Resource Marketplace',
    description: 'Access thousands of curriculum-aligned resources from CBC to IGCSE',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full flex flex-col`}>
        <Providers>
          <Navigation />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
