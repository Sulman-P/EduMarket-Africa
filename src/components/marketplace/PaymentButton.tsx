// src/components/marketplace/PaymentButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface PaymentButtonProps {
  resource: {
    id: string
    title: string
    price_kes: number
    price_usd: number
    currency: string
  }
  user: any
}

export default function PaymentButton({ resource, user }: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card'>('mpesa')
  const [phoneNumber, setPhoneNumber] = useState('')
  const router = useRouter()

  const handlePayment = async () => {
    if (!user) {
      router.push('/login?redirect=/resources/' + resource.id)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceId: resource.id,
          paymentMethod,
          phoneNumber: paymentMethod === 'mpesa' ? phoneNumber : undefined,
        }),
      })

      const data = await response.json()

      if (data.checkoutUrl) {
        // Redirect to Megapay checkout
        window.location.href = data.checkoutUrl
      } else if (data.transactionId) {
        // Handle M-Pesa STK Push
        router.push(`/payment/status?transaction=${data.transactionId}`)
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment initiation failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Payment Method</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setPaymentMethod('mpesa')}
            className={`px-4 py-2 rounded-md text-sm transition-colors ${
              paymentMethod === 'mpesa'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            M-Pesa
          </button>
          <button
            onClick={() => setPaymentMethod('card')}
            className={`px-4 py-2 rounded-md text-sm transition-colors ${
              paymentMethod === 'card'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Card
          </button>
        </div>
      </div>

      {paymentMethod === 'mpesa' && (
        <div>
          <label className="text-sm font-medium text-gray-700">Phone Number</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="254712345678"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">Enter your M-Pesa registered number</p>
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={isLoading || (paymentMethod === 'mpesa' && !phoneNumber)}
        className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Processing...' : `Pay ${resource.currency === 'KES' ? `KSh ${resource.price_kes}` : `$${resource.price_usd}`}`}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Secured by Megapay • 100% Safe
      </p>
    </div>
  )
}
