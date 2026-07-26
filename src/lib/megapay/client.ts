// src/lib/megapay/client.ts
interface MegapayConfig {
  apiKey: string
  environment: 'sandbox' | 'production'
  callbackUrl: string
}

interface MegapayTransaction {
  id: string
  amount: number
  currency: string
  phoneNumber?: string
  paymentMethod: 'mpesa' | 'card'
  status: 'pending' | 'completed' | 'failed'
}

export class MegapayClient {
  private apiKey: string
  private baseUrl: string

  constructor(config: MegapayConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.environment === 'production' 
      ? 'https://api.megapay.com/v1' 
      : 'https://sandbox-api.megapay.com/v1'
  }

  async initiatePayment(data: {
    amount: number
    currency: string
    phoneNumber?: string
    email: string
    description: string
    metadata?: Record<string, any>
  }): Promise<{ transactionId: string; redirectUrl?: string; checkoutUrl?: string }> {
    const response = await fetch(`${this.baseUrl}/payments/initiate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: data.amount,
        currency: data.currency,
        phone_number: data.phoneNumber,
        email: data.email,
        description: data.description,
        metadata: data.metadata,
        callback_url: process.env.NEXT_PUBLIC_MEGAPAY_WEBHOOK_URL,
      }),
    })

    if (!response.ok) {
      throw new Error(`Megapay API error: ${response.statusText}`)
    }

    const result = await response.json()
    return {
      transactionId: result.transaction_id,
      redirectUrl: result.redirect_url,
      checkoutUrl: result.checkout_url,
    }
  }

  async verifyPayment(transactionId: string): Promise<MegapayTransaction> {
    const response = await fetch(`${this.baseUrl}/payments/${transactionId}/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Megapay API error: ${response.statusText}`)
    }

    return await response.json()
  }

  async verifyWebhookSignature(
    payload: string,
    signature: string
  ): Promise<boolean> {
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(payload + this.apiKey)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const computedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      return signature === computedSignature
    } catch (error) {
      console.error('Signature verification error:', error)
      return false
    }
  }
}

// Export a singleton instance
export const megapayClient = new MegapayClient({
  apiKey: process.env.MEGAPAY_API_KEY || '',
  environment: (process.env.MEGAPAY_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
  callbackUrl: process.env.NEXT_PUBLIC_MEGAPAY_WEBHOOK_URL || '',
})
