import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';
import { DataStore } from '@/lib/data-store';
import { SessionUser } from '@/lib/types';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const sessionUser = verifySessionToken(token);

  if (!sessionUser) {
    const defaultAdmin: SessionUser = {
      id: 'USR-ADMIN-HQ',
      name: 'Admin Kemitraan HQ',
      email: 'admin@melatea.id',
      phone: '081122334455',
      role: 'ADMIN_HQ',
    };
    return NextResponse.json({
      success: true,
      authenticated: false,
      data: {
        user: defaultAdmin,
        partner: null,
      },
    });
  }

  let partner = null;
  if (sessionUser.role === 'MITRA' && sessionUser.partnerId) {
    partner = DataStore.getPartnerById(sessionUser.partnerId) || null;
  }

  return NextResponse.json({
    success: true,
    authenticated: true,
    data: {
      user: sessionUser,
      partner,
    },
  });
}

