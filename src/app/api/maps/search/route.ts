import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('text');

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Query pencarian minimal 2 karakter' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json({
        success: false,
        fallbackMode: true,
        message: 'Layanan pencarian alamat otomatis memerlukan GEOAPIFY_API_KEY. Gunakan input koordinat manual atau klik langsung pada peta.',
        results: [],
      });
    }

    // Call Geoapify Search endpoint
    const url = new URL('https://api.geoapify.com/v1/geocode/search');
    url.searchParams.set('text', query);
    url.searchParams.set('apiKey', apiKey);
    url.searchParams.set('filter', 'countrycode:id'); // Bias to Indonesia
    url.searchParams.set('limit', '5');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        fallbackMode: true,
        message: 'Penyedia geocoding Geoapify sedang tidak dapat diakses atau kuota habis.',
        results: [],
      });
    }

    const data = await response.json();
    const results = (data.features || []).map((feature: any) => ({
      formatted: feature.properties.formatted,
      address_line1: feature.properties.address_line1,
      address_line2: feature.properties.address_line2,
      city: feature.properties.city || feature.properties.county || '',
      district: feature.properties.suburb || feature.properties.district || '',
      lat: feature.properties.lat,
      lon: feature.properties.lon,
    }));

    return NextResponse.json({
      success: true,
      fallbackMode: false,
      results,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      fallbackMode: true,
      message: 'Pencarian alamat sedang mengalami timeout. Silakan pilih titik langsung pada peta.',
      results: [],
    });
  }
}
