import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/data-store';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { UserRole } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = typeof body.identifier === 'string' ? body.identifier : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const expectedRole: UserRole | undefined =
      body.role === 'ADMIN_HQ' || body.role === 'MITRA' ? body.role : undefined;

    const authResult = DataStore.authenticateUser(identifier, password, expectedRole);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error || 'Autentikasi gagal.',
        },
        { status: 401 }
      );
    }

    const token = createSessionToken(authResult.user);
    const redirectTo =
      authResult.user.role === 'MITRA' ? '/dashboard/mitra' : '/dashboard';

    const response = NextResponse.json({
      success: true,
      data: {
        user: authResult.user,
        redirectTo,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan pada server autentikasi';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

