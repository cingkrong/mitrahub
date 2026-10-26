import { NextRequest, NextResponse } from 'next/server';
import { validateTerritoryLocation } from '@/lib/data-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { latitude, longitude, radiusKm = 3.0, excludeOutletId } = body;

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, error: 'Latitude dan longitude wajib diisi' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radius = parseFloat(radiusKm);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { success: false, error: 'Koordinat geografis tidak valid' },
        { status: 400 }
      );
    }

    const result = validateTerritoryLocation(lat, lng, radius, excludeOutletId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memvalidasi radius wilayah' },
      { status: 500 }
    );
  }
}
