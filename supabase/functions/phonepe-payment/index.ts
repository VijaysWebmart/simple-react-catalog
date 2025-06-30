
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

    console.log('PhonePe credentials check:', {
      hasClientId: !!PHONEPE_CLIENT_ID,
      hasClientSecret: !!PHONEPE_CLIENT_SECRET,
      clientIdLength: PHONEPE_CLIENT_ID?.length,
      secretLength: PHONEPE_CLIENT_SECRET?.length,
      clientIdPrefix: PHONEPE_CLIENT_ID?.substring(0, 8) + '...',
      secretPrefix: PHONEPE_CLIENT_SECRET?.substring(0, 8) + '...'
    })

    if (!PHONEPE_CLIENT_ID || !PHONEPE_CLIENT_SECRET) {
      console.error('PhonePe credentials missing')
      return new Response(
        JSON.stringify({ 
          error: 'PhonePe credentials not configured. Please contact administrator.',
          code: 'CREDENTIALS_MISSING'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Use UAT (sandbox) environment for testing
    const PHONEPE_BASE_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox'

    // Create payment payload with proper structure
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

    console.log('Payment payload:', JSON.stringify(paymentPayload, null, 2))

    // Encode payload to base64
    const base64Payload = btoa(JSON.stringify(paymentPayload))
    console.log('Base64 payload created, length:', base64Payload.length)
    
    // Create checksum: base64Payload + endpoint + saltKey
    const endpoint = '/pg/v1/pay'
    const checksumString = base64Payload + endpoint + PHONEPE_CLIENT_SECRET
    console.log('Checksum string components:', {
      base64Length: base64Payload.length,
      endpoint: endpoint,
      secretLength: PHONEPE_CLIENT_SECRET.length,
      totalLength: checksumString.length
    })
    
    const encoder = new TextEncoder()
    const data = encoder.encode(checksumString)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('') + '###1'

    console.log('Generated checksum:', checksum)

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'X-VERIFY': checksum,
      'accept': 'application/json'
    }

    console.log('Request headers:', headers)

    // Make request to PhonePe
    const response = await fetch(`${PHONEPE_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        request: base64Payload
      })
    })

    const result = await response.json()
    console.log('PhonePe API response status:', response.status)
    console.log('PhonePe API response headers:', Object.fromEntries(response.headers.entries()))
    console.log('PhonePe API response body:', JSON.stringify(result, null, 2))

    if (result.success && result.data?.instrumentResponse?.redirectInfo?.url) {
      console.log('Payment initiated successfully')
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
      console.error('PhonePe payment initiation failed:', {
        success: result.success,
        code: result.code,
        message: result.message,
        data: result.data,
        responseStatus: response.status
      })
      
      let errorMessage = 'Payment initiation failed. '
      
      if (result.code === 'KEY_NOT_CONFIGURED') {
        errorMessage += 'Merchant key configuration issue. Please verify your PhonePe merchant credentials are properly configured in the PhonePe dashboard and match the sandbox/production environment.'
      } else if (result.code === 'INVALID_REQUEST') {
        errorMessage += 'Invalid request format. Please contact support.'
      } else if (result.message) {
        errorMessage += result.message
      } else {
        errorMessage += 'Please try again or contact support.'
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          code: result.code || 'PAYMENT_FAILED',
          details: result.data || {},
          debug: {
            merchantId: PHONEPE_CLIENT_ID,
            environment: 'sandbox',
            endpoint: `${PHONEPE_BASE_URL}${endpoint}`
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

  } catch (error) {
    console.error('Error in phonepe-payment function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error. Please try again.',
        details: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
