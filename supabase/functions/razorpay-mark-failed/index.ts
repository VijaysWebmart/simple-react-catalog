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

    const body = await req.json()
    const { orderId, reason, code, razorpay_payment_id, razorpay_order_id } = body || {}
    if (!orderId) return json({ error: 'orderId required' }, 400)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: order, error: orderErr } = await admin
      .from('orders')
      .select('id, user_id, status, total_amount')
      .eq('id', orderId)
      .single()
    if (orderErr || !order) return json({ error: 'Order not found' }, 404)
    if (order.user_id !== userId) return json({ error: 'Forbidden' }, 403)

    // Don't overwrite a paid order (webhook/verify race)
    if (order.status === 'paid') return json({ success: true, alreadyPaid: true }, 200)

    if (order.status !== 'failed') {
      await admin
        .from('orders')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', orderId)
    }

    // Record transaction (idempotent on transaction_id + failed)
    if (razorpay_payment_id) {
      const { data: existing } = await admin
        .from('payment_transactions')
        .select('id')
        .eq('transaction_id', razorpay_payment_id)
        .eq('status', 'failed')
        .maybeSingle()
      if (!existing) {
        await admin.from('payment_transactions').insert({
          order_id: orderId,
          transaction_id: razorpay_payment_id,
          gateway: 'razorpay',
          amount: order.total_amount,
          currency: 'INR',
          status: 'failed',
          gateway_response: {
            razorpay_order_id: razorpay_order_id ?? null,
            razorpay_payment_id,
            error_code: code ?? null,
            error_description: reason ?? null,
            source: 'client_mark_failed',
          },
        })
      }
    }

    return json({ success: true }, 200)
  } catch (e) {
    console.error('mark-failed error', e)
    return json({ error: (e as Error).message || 'Internal error' }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
