import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat');
    const lonStr = searchParams.get('lon');

    if (!latStr || !lonStr) {
      return NextResponse.json(
        { success: false, error: 'Latitude dan Longitude wajib disertakan' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json(
        { success: false, error: 'Format koordinat tidak valid' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json({
        success: true,
        fallbackMode: true,
        address: `Koordinat Terpilih: ${lat.toFixed(5)}, ${lon.toFixed(5)}`,
        city: 'Surakarta & Sekitarnya',
      });
    }

    const url = new URL('https://api.geoapify.com/v1/geocode/reverse');
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lon.toString());
    url.searchParams.set('apiKey', apiKey);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        fallbackMode: true,
        address: `Koordinat: ${lat.toFixed(5)}, ${lon.toFixed(5)}`,
        city: 'Surakarta & Sekitarnya',
      });
    }

    const data = await response.json();
    const feature = data.features?.[0];

    return NextResponse.json({
      success: true,
      fallbackMode: false,
      address: feature?.properties?.formatted || `Titik Koordinat: ${lat.toFixed(5)}, ${lon.toFixed(5)}`,
      city: feature?.properties?.city || feature?.properties?.county || 'Surakarta',
      district: feature?.properties?.suburb || feature?.properties?.district || '',
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      fallbackMode: true,
      address: 'Koordinat manual tersimpan',
      city: 'Surakarta',
    });
  }
}
