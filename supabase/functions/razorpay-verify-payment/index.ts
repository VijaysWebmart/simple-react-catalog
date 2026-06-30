import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token)
    if (claimsErr || !claimsData?.claims) return json({ error: 'Unauthorized' }, 401)
    const userId = claimsData.claims.sub

    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()
    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json({ error: 'Missing fields' }, 400)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: order, error: orderErr } = await admin
      .from('orders')
      .select('id, user_id, razorpay_order_id, status, total_amount')
      .eq('id', orderId)
      .single()
    if (orderErr || !order) return json({ error: 'Order not found' }, 404)
    if (order.user_id !== userId) return json({ error: 'Forbidden' }, 403)
    if (order.razorpay_order_id !== razorpay_order_id) return json({ error: 'Order mismatch' }, 400)

    const expected = await hmacSha256Hex(
      Deno.env.get('RAZORPAY_KEY_SECRET')!,
      `${razorpay_order_id}|${razorpay_payment_id}`
    )
    if (!timingSafeEqual(expected, razorpay_signature)) {
      await admin.from('orders').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', orderId)
      return json({ error: 'Invalid signature' }, 400)
    }

    await admin
      .from('orders')
      .update({
        status: 'paid',
        razorpay_payment_id,
        razorpay_signature,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    await admin.from('payment_transactions').insert({
      order_id: orderId,
      transaction_id: razorpay_payment_id,
      gateway: 'razorpay',
      amount: order.total_amount,
      currency: 'INR',
      status: 'paid',
      gateway_response: { razorpay_order_id, razorpay_payment_id, source: 'client_verify' },
    })

    return json({ success: true }, 200)
  } catch (e) {
    console.error('verify error', e)
    return json({ error: 'Internal error' }, 500)
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

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
