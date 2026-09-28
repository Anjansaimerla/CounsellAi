Because this involves student information, treat it as sensitive institutional data.

Must:
Authenticate users.
Use Supabase Row Level Security.
Never expose service-role credentials.
Never expose Gemini API key.
Validate all uploads.
Limit CSV size.
Sanitize displayed text.
Avoid logging phone numbers.
Avoid sending unnecessary personal information to the LLM.
Keep counselling records access-controlled.
Use HTTPS through Vercel.
Keep secrets in environment variables.