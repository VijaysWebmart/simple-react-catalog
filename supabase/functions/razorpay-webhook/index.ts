import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-razorpay-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature') || ''
    const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!

    const expected = await hmacSha256Hex(secret, rawBody)
    if (!timingSafeEqual(expected, signature)) {
      console.warn('Invalid webhook signature')
      return new Response('Invalid signature', { status: 400, headers: corsHeaders })
    }

    const event = JSON.parse(rawBody)
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const payment = event?.payload?.payment?.entity
    const rpOrderEntity = event?.payload?.order?.entity
    const rpOrderId = payment?.order_id || rpOrderEntity?.id
    if (!rpOrderId) return new Response('ok', { status: 200, headers: corsHeaders })

    const { data: order } = await admin
      .from('orders')
      .select('id, status, total_amount')
      .eq('razorpay_order_id', rpOrderId)
      .maybeSingle()

    if (order) {
      let newStatus: string | null = null
      if (event.event === 'payment.captured' || event.event === 'order.paid') newStatus = 'paid'
      else if (event.event === 'payment.failed') newStatus = 'failed'

      if (newStatus && order.status !== newStatus) {
        await admin
          .from('orders')
          .update({
            status: newStatus,
            razorpay_payment_id: payment?.id ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id)
      }

      await admin.from('payment_transactions').insert({
        order_id: order.id,
        transaction_id: payment?.id ?? null,
        gateway: 'razorpay',
        amount: (payment?.amount ?? 0) / 100,
        currency: payment?.currency ?? 'INR',
        status: newStatus ?? event.event,
        gateway_response: { event: event.event, payload: event.payload, source: 'webhook' },
      })
    }

    return new Response('ok', { status: 200, headers: corsHeaders })
  } catch (e) {
    console.error('webhook error', e)
    return new Response('error', { status: 500, headers: corsHeaders })
  }
})

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let res = 0
  for (let i = 0; i < a.length; i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return res === 0
}
