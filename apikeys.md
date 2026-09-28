You only need two external services for V1.

1. Supabase

Required:

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

Important: SUPABASE_SERVICE_ROLE_KEY must remain server-side and must never be exposed to the browser.

2. Gemini
GEMINI_API_KEY

Keep this server-side.

Vercel

No API key is required for your application itself.

GitHub

No application API key required unless you later add GitHub integration