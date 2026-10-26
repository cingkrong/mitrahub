import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/data-store';
import { getGoogleMapsUrl } from '@/lib/geo-utils';

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

    const geoJson = {
      type: 'FeatureCollection',
      features: outlets.map((outlet) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [outlet.longitude, outlet.latitude],
        },
        properties: {
          id: outlet.id,
          partnerId: outlet.partnerId,
          partnerName: outlet.partnerName || 'Mitra Melatea',
          name: outlet.name,
          address: outlet.address,
          city: outlet.city,
          district: outlet.district,
          status: outlet.status,
          operationalDate: outlet.operationalDate,
          lastOrderDate: outlet.lastOrderDate || null,
          repeatOrderCount: outlet.repeatOrderCount || 0,
          googleMapsUrl: getGoogleMapsUrl(outlet.latitude, outlet.longitude),
        },
      })),
    };

    return NextResponse.json({
      success: true,
      data: geoJson,
      count: outlets.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
