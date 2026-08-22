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
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401)
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token)
    if (claimsErr || !claimsData?.claims) return json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401)
    const userId = claimsData.claims.sub

    const { orderId } = await req.json()
    if (!orderId) return json({ error: 'orderId required', code: 'BAD_REQUEST' }, 400)

    // Key-mode guard: catch pasted-wrong-mode keys early with a clear message
    const keyId = Deno.env.get('RAZORPAY_KEY_ID') || ''
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET') || ''
    if (!keyId || !keySecret) {
      console.error('Razorpay keys missing')
      return json({ error: 'Payment gateway not configured', code: 'KEYS_MISSING' }, 500)
    }
    const isTestKey = keyId.startsWith('rzp_test_')
    const isLiveKey = keyId.startsWith('rzp_live_')
    if (!isTestKey && !isLiveKey) {
      console.error('Razorpay key prefix invalid:', keyId.substring(0, 8))
      return json({
        error: 'Invalid Razorpay key format. Expected rzp_test_ or rzp_live_ prefix.',
        code: 'KEY_FORMAT_INVALID',
      }, 500)
    }
    console.log(`[create-order] mode=${isTestKey ? 'test' : 'live'} keyPrefix=${keyId.substring(0, 8)}`)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Load order and verify ownership
    const { data: order, error: orderErr } = await admin
      .from('orders')
      .select('id, user_id, status, razorpay_order_id')
      .eq('id', orderId)
      .single()
    if (orderErr || !order) return json({ error: 'Order not found', code: 'ORDER_NOT_FOUND' }, 404)
    if (order.user_id !== userId) return json({ error: 'Forbidden', code: 'FORBIDDEN' }, 403)
    if (order.status !== 'pending') return json({ error: 'Order not pending', code: 'ORDER_NOT_PENDING' }, 400)

    // Recompute amount server-side from order_items + products
    const { data: items, error: itemsErr } = await admin
      .from('order_items')
      .select('quantity, price, product:products(price)')
      .eq('order_id', orderId)
    if (itemsErr || !items?.length) return json({ error: 'No order items', code: 'NO_ITEMS' }, 400)

    let rawTotalRupees = 0
    for (const it of items as any[]) {
      const unit = Number(it.product?.price ?? it.price)
      if (!Number.isFinite(unit) || unit <= 0) return json({ error: 'Invalid price', code: 'BAD_PRICE' }, 400)
      rawTotalRupees += unit * Number(it.quantity)
    }
    const totalRupees = Math.round(rawTotalRupees * 100) / 100
    const amountPaise = Math.round(totalRupees * 100)
    if (amountPaise <= 0) return json({ error: 'Invalid amount', code: 'BAD_AMOUNT' }, 400)

    await admin.from('orders').update({ total_amount: totalRupees }).eq('id', orderId)

    const basic = btoa(`${keyId}:${keySecret}`)

    // If we already created a Razorpay order for this pending order, try to reuse it
    if (order.razorpay_order_id) {
      const existing = await fetch(`https://api.razorpay.com/v1/orders/${order.razorpay_order_id}`, {
        headers: { 'Authorization': `Basic ${basic}` },
      })
      if (existing.ok) {
        const rp = await existing.json()
        // Only reuse if amount matches and it's still open (status "created")
        if (rp.status === 'created' && rp.amount === amountPaise && rp.currency === 'INR') {
          console.log('[create-order] reusing existing razorpay order', rp.id)
          return json({
            razorpayOrderId: rp.id,
            amount: rp.amount,
            currency: rp.currency,
            keyId,
            reused: true,
          }, 200)
        }
      }
    }

    const rpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basic}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: orderId,
        notes: { order_id: orderId, user_id: userId },
      }),
    })
    const rpJson = await rpRes.json()
    if (!rpRes.ok) {
      console.error('Razorpay create order failed', rpJson)
      return json({
        error: rpJson?.error?.description || 'Failed to create Razorpay order',
        code: rpJson?.error?.code || 'RAZORPAY_ERROR',
      }, 502)
    }

    await admin
      .from('orders')
      .update({ razorpay_order_id: rpJson.id })
      .eq('id', orderId)

    return json({
      razorpayOrderId: rpJson.id,
      amount: rpJson.amount,
      currency: rpJson.currency,
      keyId,
    }, 200)
  } catch (e) {
    console.error('create-order error', e)
    return json({ error: (e as Error).message || 'Internal error', code: 'INTERNAL' }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
