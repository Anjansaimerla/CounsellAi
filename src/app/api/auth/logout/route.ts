import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/storage/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId } = body;

    if (userId) {
      const user = store.getUserById(userId);
      if (user) {
        store.recordAuditLog({
          user_id: user.id,
          username: user.username,
          user_role: user.role,
          action: 'LOGOUT',
          entity_type: 'AUTH',
          metadata: { note: 'User logged out' },
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: true });
  }
}
