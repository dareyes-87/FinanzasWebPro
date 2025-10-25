import { corsHeaders } from './_shared/cors.ts'

// URL de la API de Gemini (modelo gemini-1.5-flash)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key='

// Obtenemos la API key de los secretos
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

// Usamos Deno.serve (la nueva forma)
Deno.serve(async (req: Request) => {
  // Manejo de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Recibimos el historial de chat
    const { chatHistory } = await req.json()

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY no encontrada en los secretos.")
    }

    // 2. Preparamos el cuerpo para Gemini
    const reqBody = {
      contents: chatHistory,
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ],
    }

    // 3. Llamamos a la API de Gemini
    const res = await fetch(GEMINI_API_URL + GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody),
    })

    if (!res.ok) {
      throw new Error(`Error de Gemini: ${await res.text()}`)
    }

    const data = await res.json()
    
    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
      throw new Error("Gemini no devolvió una respuesta válida.")
    }
    
    const botResponse = data.candidates[0].content

    // 4. Devolvemos la respuesta
    return new Response(JSON.stringify({ response: botResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    const errorMessage = (err instanceof Error) ? err.message : "Error desconocido"
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})