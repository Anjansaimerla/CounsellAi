import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/storage/store';
import { verifyPassword } from '@/lib/auth/password';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    const user = store.getUserByUsername(username);
    if (!user || user.status === 'INACTIVE') {
      return NextResponse.json(
        { error: 'Invalid username or password, or account is disabled.' },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    const scope = user.role === 'COUNSELLOR' ? store.getCounselorScope(user.id) : null;

    store.recordAuditLog({
      user_id: user.id,
      username: user.username,
      user_role: user.role,
      action: 'LOGIN',
      entity_type: 'AUTH',
      metadata: { role: user.role, scope: scope ? `${scope.department_code}_Y${scope.year_number}_${scope.section_name}` : 'GLOBAL' },
    });

    const token = `session_${user.id}_${Date.now()}`;
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        status: user.status,
        email: user.email,
      },
      scope,
      token,
      expiresAt,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error during authentication.' },
      { status: 500 }
    );
  }
}
