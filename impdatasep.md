Your architecture should distinguish:

             STUDENT DATA
                  │
        ┌─────────┴─────────┐
        ↓                   ↓
 Academic Data        Behaviour Data
        │                   │
        └─────────┬─────────┘
                  ↓
              Risk Engine
                  ↓
          Risk Assessment
                  ↓
          Counselling Case
                  ↓
        Counselling Session
                  ↓
             Action Plan
                  ↓
             Follow-up
                  ↓
        Improvement Record

This will prevent your database from becoming one giant 32-column table.