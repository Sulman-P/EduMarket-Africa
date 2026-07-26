// src/app/api/payments/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { megapayClient } from '@/lib/megapay/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { resourceId, paymentMethod, phoneNumber } = body

    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('*')
      .eq('id', resourceId)
      .single()

    if (resourceError || !resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        resource_id: resourceId,
        amount: resource.currency === 'KES' ? resource.price_kes : resource.price_usd,
        currency: resource.currency,
        payment_method: paymentMethod === 'mpesa' ? 'mpesa' : 'card',
        status: 'pending',
        metadata: { paymentMethod, phoneNumber },
      })
      .select()
      .single()

    if (orderError) {
      return NextResponse.json({ error: 'Order creation failed' }, { status: 500 })
    }

    const paymentData: any = {
      amount: resource.currency === 'KES' ? resource.price_kes : resource.price_usd,
      currency: resource.currency,
      email: user.email!,
      description: `Purchase: ${resource.title}`,
      metadata: { orderId: order.id, resourceId: resource.id, userId: user.id },
    }

    if (paymentMethod === 'mpesa' && phoneNumber) {
      paymentData.phoneNumber = phoneNumber
    }

    const result = await megapayClient.initiatePayment(paymentData)

    await supabase
      .from('orders')
      .update({ megapay_transaction_id: result.transactionId })
      .eq('id', order.id)

    return NextResponse.json({
      success: true,
      transactionId: result.transactionId,
      checkoutUrl: result.checkoutUrl,
    })
  } catch (error) {
    console.error('Payment error:', error)
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 })
  }
}
