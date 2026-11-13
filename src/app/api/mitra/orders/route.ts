import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';
import { DataStore } from '@/lib/data-store';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const sessionUser = verifySessionToken(token);

    if (!sessionUser || sessionUser.role !== 'MITRA' || !sessionUser.partnerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Akses ditolak. Hanya akun Mitra terautentikasi yang dapat membuat pesanan repeat order.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const outletId = typeof body.outletId === 'string' ? body.outletId : '';
    const notes = typeof body.notes === 'string' ? body.notes : undefined;
    const items = Array.isArray(body.items) ? body.items : [];

    // Enforce server-side partnerId from session token (never trust client partnerId)
    const result = DataStore.createMitraRepeatOrder(sessionUser.partnerId, {
      outletId,
      notes,
      items,
    });

    if (!result.success || !result.order) {
      return NextResponse.json(
        { success: false, error: result.error || 'Gagal membuat pesanan repeat order.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.order,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memproses pesanan repeat order';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

