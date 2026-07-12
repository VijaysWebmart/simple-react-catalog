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
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401)

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token)
    if (claimsErr || !claimsData?.claims) return json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401)
    const userId = claimsData.claims.sub

    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()
    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json({ error: 'Missing fields', code: 'BAD_REQUEST' }, 400)
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
    if (orderErr || !order) return json({ error: 'Order not found', code: 'ORDER_NOT_FOUND' }, 404)
    if (order.user_id !== userId) return json({ error: 'Forbidden', code: 'FORBIDDEN' }, 403)
    if (order.razorpay_order_id !== razorpay_order_id) return json({ error: 'Order mismatch', code: 'ORDER_MISMATCH' }, 400)

    // Idempotent: if already paid, return success without touching DB again
    if (order.status === 'paid') {
      return json({ success: true, alreadyPaid: true }, 200)
    }

    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')!

    const expected = await hmacSha256Hex(keySecret, `${razorpay_order_id}|${razorpay_payment_id}`)
    if (!timingSafeEqual(expected, razorpay_signature)) {
      await admin.from('orders').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', orderId)
      return json({ error: 'Invalid signature', code: 'BAD_SIGNATURE' }, 400)
    }

    // Cross-verify amount/currency/status by fetching the payment from Razorpay
    const basic = btoa(`${keyId}:${keySecret}`)
    const payRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
      headers: { 'Authorization': `Basic ${basic}` },
    })
    const payment = await payRes.json()
    if (!payRes.ok) {
      console.error('Fetch payment failed', payment)
      return json({ error: 'Could not verify payment with gateway', code: 'GATEWAY_FETCH_FAILED' }, 502)
    }

    const expectedAmount = Math.round(Number(order.total_amount) * 100)
    if (payment.order_id !== razorpay_order_id) {
      return json({ error: 'Payment/order mismatch', code: 'PAYMENT_ORDER_MISMATCH' }, 400)
    }
    if (payment.amount !== expectedAmount || payment.currency !== 'INR') {
      console.error('Amount/currency mismatch', { payment, expectedAmount })
      return json({ error: 'Amount or currency mismatch', code: 'AMOUNT_MISMATCH' }, 400)
    }
    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return json({ error: `Payment not captured (status=${payment.status})`, code: 'NOT_CAPTURED' }, 400)
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

    // Insert transaction only if not already recorded (idempotency without a DB constraint)
    const { data: existingTxn } = await admin
      .from('payment_transactions')
      .select('id')
      .eq('transaction_id', razorpay_payment_id)
      .eq('status', 'paid')
      .maybeSingle()

    if (!existingTxn) {
      await admin.from('payment_transactions').insert({
        order_id: orderId,
        transaction_id: razorpay_payment_id,
        gateway: 'razorpay',
        amount: order.total_amount,
        currency: 'INR',
        status: 'paid',
        gateway_response: { razorpay_order_id, razorpay_payment_id, source: 'client_verify' },
      })
    }

    return json({ success: true }, 200)
  } catch (e) {
    console.error('verify error', e)
    return json({ error: (e as Error).message || 'Internal error', code: 'INTERNAL' }, 500)
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
