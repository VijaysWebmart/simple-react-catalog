
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderId, amount, merchantTransactionId, callbackUrl } = await req.json()

    const PHONEPE_CLIENT_ID = Deno.env.get('PHONEPE_CLIENT_ID')
    const PHONEPE_CLIENT_SECRET = Deno.env.get('PHONEPE_CLIENT_SECRET')

    if (!PHONEPE_CLIENT_ID || !PHONEPE_CLIENT_SECRET) {
      throw new Error('PhonePe credentials not configured')
    }

    // PhonePe UAT base URL
    const PHONEPE_BASE_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox'

    // Create payment payload
    const paymentPayload = {
      merchantId: PHONEPE_CLIENT_ID,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: "MUID123",
      amount: amount,
      redirectUrl: callbackUrl,
      redirectMode: "POST",
      callbackUrl: callbackUrl,
      mobileNumber: "9999999999",
      paymentInstrument: {
        type: "PAY_PAGE"
      }
    }

    // Encode payload
    const base64Payload = btoa(JSON.stringify(paymentPayload))
    
    // Create checksum
    const checksumString = base64Payload + '/pg/v1/pay' + PHONEPE_CLIENT_SECRET
    const encoder = new TextEncoder()
    const data = encoder.encode(checksumString)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('') + '###1'

    // Make request to PhonePe
    const response = await fetch(`${PHONEPE_BASE_URL}/pg/v1/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'accept': 'application/json'
      },
      body: JSON.stringify({
        request: base64Payload
      })
    })

    const result = await response.json()
    console.log('PhonePe response:', result)

    if (result.success && result.data?.instrumentResponse?.redirectInfo?.url) {
      return new Response(
        JSON.stringify({
          success: true,
          paymentUrl: result.data.instrumentResponse.redirectInfo.url,
          merchantTransactionId: merchantTransactionId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else {
      throw new Error(result.message || 'Payment initiation failed')
    }

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
