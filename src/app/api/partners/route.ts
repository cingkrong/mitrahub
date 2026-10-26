import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/data-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const status = searchParams.get('status');
    const tier = searchParams.get('tier');

    let partners = DataStore.getPartners();

    if (search) {
      partners = partners.filter(
        (p) =>
          p.ownerName.toLowerCase().includes(search) ||
          p.email.toLowerCase().includes(search) ||
          p.phone.includes(search) ||
          p.outlets.some((o) => o.name.toLowerCase().includes(search) || o.city.toLowerCase().includes(search))
      );
    }

    if (status && status !== 'ALL') {
      partners = partners.filter((p) => p.status === status);
    }

    if (tier && tier !== 'ALL') {
      partners = partners.filter((p) => p.tier === tier);
    }

    return NextResponse.json({
      success: true,
      data: partners,
      total: partners.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.ownerName || !body.phone) {
      return NextResponse.json(
        { success: false, error: 'Nama pemilik dan nomor WhatsApp wajib diisi' },
        { status: 400 }
      );
    }

    const partnerId = `PTR-${String(DataStore.getPartners().length + 1).padStart(3, '0')}`;
    const newPartner = DataStore.createPartner({
      id: partnerId,
      organizationId: 'ORG-MELATEA',
      ownerName: body.ownerName,
      email: body.email || `${body.ownerName.toLowerCase().replace(/\s+/g, '.')}@melatea-partner.id`,
      phone: body.phone,
      identityNumber: body.identityNumber,
      tier: 'REGULER',
      status: 'ACTIVE',
      joinedAt: new Date().toISOString(),
      outlets: [],
    });

    return NextResponse.json({ success: true, data: newPartner }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal membuat data mitra' },
      { status: 500 }
    );
  }
}
