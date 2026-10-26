import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/data-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const partner = DataStore.getPartnerById(id);

    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Mitra tidak ditemukan' },
        { status: 404 }
      );
    }

    const purchases = DataStore.getPurchasesByPartnerId(id);

    return NextResponse.json({
      success: true,
      data: {
        ...partner,
        purchases,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
