import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN')!
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')!

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { phones, message } = await req.json()

    if (!Array.isArray(phones) || !message) {
      return new Response('Invalid request body', { status: 400 })
    }

    const results = []

    for (const phone of phones) {
      try {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: phone,
              type: 'text',
              text: { body: message }
            })
          }
        )

        const result = await response.json()
        results.push({ phone, success: response.ok, result })
      } catch (error) {
        let errorMsg = 'Unknown error';
        if (error instanceof Error) {
          errorMsg = error.message;
        } else if (typeof error === 'string') {
          errorMsg = error;
        }
        results.push({ phone, success: false, error: errorMsg });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    return new Response(JSON.stringify({ error: errorMsg }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
})