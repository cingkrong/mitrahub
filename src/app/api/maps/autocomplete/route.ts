import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');

    if (!text || text.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Query autocomplete minimal 3 karakter' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json({
        success: false,
        fallbackMode: true,
        message: 'Layanan autocomplete otomatis memerlukan GEOAPIFY_API_KEY. Gunakan input koordinat manual atau klik langsung pada peta.',
        suggestions: [],
      });
    }

    const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
    url.searchParams.set('text', text);
    url.searchParams.set('apiKey', apiKey);
    url.searchParams.set('filter', 'countrycode:id'); // Bias to Indonesia
    url.searchParams.set('bias', 'proximity:110.8243,-7.5755'); // Bias to Solo Raya / Central Java operational area
    url.searchParams.set('limit', '5');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        fallbackMode: true,
        message: 'Layanan autocomplete mencapai batas kuota atau sedang offline.',
        suggestions: [],
      });
    }

    const data = await response.json();
    const suggestions = (data.features || []).map((feature: any) => ({
      formatted: feature.properties.formatted,
      address_line1: feature.properties.address_line1,
      city: feature.properties.city || feature.properties.county || '',
      district: feature.properties.suburb || feature.properties.district || '',
      lat: feature.properties.lat,
      lon: feature.properties.lon,
    }));

    return NextResponse.json({
      success: true,
      fallbackMode: false,
      suggestions,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      fallbackMode: true,
      message: 'Autocomplete waktu tunggu habis. Silakan gunakan klik peta manual.',
      suggestions: [],
    });
  }
}
