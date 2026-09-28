These are non-negotiable rules I'd give Antigravity.

Rule 1

Business logic must not live inside UI components.

Rule 2

Risk calculations must be deterministic TypeScript logic.

Don't ask Gemini:

"Who is at risk?"

Instead:

Application
   ↓
Risk Engine
   ↓
Risk score
   ↓
Gemini explains the result
Rule 3

AI must never fabricate student information.

If information isn't available:

"Not available in the provided data."
Rule 4

AI recommendations are suggestions, not decisions.

Counsellor remains responsible for the final intervention.

Rule 5

Never expose:

SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY

to the client.

Rule 6

All database queries must be authenticated.

Rule 7

Use Zod validation for:

CSV data
API inputs
counselling forms
AI outputs
Rule 8

Every imported dataset should have an identifiable upload/import record.

Rule 9

Do not overwrite historical counselling data.

Counselling records are historical records.

Rule 10

Academic data should be versioned/snapshot-based so improvement can be measured.

Rule 11

The system must distinguish:

RAW DATA
DERIVED DATA
AI-GENERATED CONTENT
COUNSELLOR-ENTERED CONTENT