import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';
import { DataStore } from '@/lib/data-store';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const sessionUser = verifySessionToken(token);

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'Sesi login tidak ditemukan. Silakan masuk sebagai Mitra terlebih dahulu.' },
        { status: 401 }
      );
    }

    // Tenant isolation: MITRA can ONLY access their own partnerId
    let targetPartnerId: string | undefined;
    if (sessionUser.role === 'MITRA') {
      targetPartnerId = sessionUser.partnerId;
    } else if (sessionUser.role === 'ADMIN_HQ') {
      const { searchParams } = new URL(request.url);
      targetPartnerId = searchParams.get('partnerId') || 'PTR-001';
    }

    if (!targetPartnerId) {
      return NextResponse.json(
        { success: false, error: 'ID Mitra tidak valid pada sesi ini.' },
        { status: 403 }
      );
    }

    const dashboardData = DataStore.getMitraDashboardData(targetPartnerId);
    if (!dashboardData) {
      return NextResponse.json(
        { success: false, error: 'Data profil mitra tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat dashboard mitra';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

