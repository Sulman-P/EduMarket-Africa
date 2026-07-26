// src/app/api/webhooks/megapay/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { megapayClient } from '@/lib/megapay/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-megapay-signature') || ''
    
    // Verify webhook signature
    const isValid = await megapayClient.verifyWebhookSignature(body, signature)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(body)
    const { transactionId, status, amount, currency, metadata } = payload

    const supabase = createServerSupabaseClient()

    // Update order status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({ 
        status: status === 'completed' ? 'paid' : status,
        megapay_transaction_id: transactionId,
        updated_at: new Date().toISOString()
      })
      .eq('megapay_transaction_id', transactionId)
      .select()
      .single()

    if (orderError) {
      console.error('Error updating order:', orderError)
      return NextResponse.json({ error: 'Order update failed' }, { status: 500 })
    }

    // If payment successful, generate download URL
    if (status === 'completed' && order) {
      const { data: resource } = await supabase
        .from('resources')
        .select('file_path')
        .eq('id', order.resource_id)
        .single()

      if (resource) {
        // Generate signed URL
        const { data: signedUrl } = await supabase
          .storage
          .from('resources')
          .createSignedUrl(resource.file_path, 3600) // 1 hour expiry

        // Update order with download URL
        await supabase
          .from('orders')
          .update({ 
            download_url: signedUrl?.signedUrl,
            download_expires_at: new Date(Date.now() + 3600000).toISOString()
          })
          .eq('id', order.id)

        // Increment download count
        await supabase
          .from('resources')
          .update({ downloads_count: supabase.rpc('increment', { x: 1 }) })
          .eq('id', order.resource_id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
