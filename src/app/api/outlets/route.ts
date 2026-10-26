import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/data-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const status = searchParams.get('status');

    let outlets = DataStore.getOutlets();

    if (city && city !== 'ALL') {
      outlets = outlets.filter((o) => o.city.toLowerCase() === city.toLowerCase());
    }

    if (status && status !== 'ALL') {
      outlets = outlets.filter((o) => o.status === status);
    }

    return NextResponse.json({
      success: true,
      data: outlets,
      total: outlets.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
