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
      return json({ error: 'Unauthorized' }, 401)
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token)
    if (claimsErr || !claimsData?.claims) return json({ error: 'Unauthorized' }, 401)
    const userId = claimsData.claims.sub

    const { orderId } = await req.json()
    if (!orderId) return json({ error: 'orderId required' }, 400)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Load order and verify ownership
    const { data: order, error: orderErr } = await admin
      .from('orders')
      .select('id, user_id, status')
      .eq('id', orderId)
      .single()
    if (orderErr || !order) return json({ error: 'Order not found' }, 404)
    if (order.user_id !== userId) return json({ error: 'Forbidden' }, 403)
    if (order.status !== 'pending') return json({ error: 'Order not pending' }, 400)

    // Recompute amount server-side from order_items + products
    const { data: items, error: itemsErr } = await admin
      .from('order_items')
      .select('quantity, price, product:products(price)')
      .eq('order_id', orderId)
    if (itemsErr || !items?.length) return json({ error: 'No order items' }, 400)

    let totalRupees = 0
    for (const it of items as any[]) {
      const unit = Number(it.product?.price ?? it.price)
      if (!Number.isFinite(unit) || unit <= 0) return json({ error: 'Invalid price' }, 400)
      totalRupees += unit * Number(it.quantity)
    }
    const amountPaise = Math.round(totalRupees * 100)
    if (amountPaise <= 0) return json({ error: 'Invalid amount' }, 400)

    // Update order's total to authoritative server value
    await admin.from('orders').update({ total_amount: totalRupees }).eq('id', orderId)

    const keyId = Deno.env.get('RAZORPAY_KEY_ID')!
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!
    const basic = btoa(`${keyId}:${keySecret}`)

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
      return json({ error: 'Failed to create Razorpay order' }, 502)
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
    return json({ error: 'Internal error' }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
