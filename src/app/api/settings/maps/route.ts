import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/data-store';

export async function GET() {
  try {
    const settings = DataStore.getMapSettings();
    return NextResponse.json({
      success: true,
      data: settings,
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
    const updated = DataStore.updateMapSettings({
      mapProvider: body.mapProvider,
      mapStyleUrl: body.mapStyleUrl,
      defaultLat: body.defaultLat !== undefined ? parseFloat(body.defaultLat) : undefined,
      defaultLng: body.defaultLng !== undefined ? parseFloat(body.defaultLng) : undefined,
      defaultZoom: body.defaultZoom !== undefined ? parseInt(body.defaultZoom, 10) : undefined,
      defaultRadiusKm: body.defaultRadiusKm !== undefined ? parseFloat(body.defaultRadiusKm) : undefined,
      enableClustering: body.enableClustering !== undefined ? Boolean(body.enableClustering) : undefined,
      geocodingProvider: body.geocodingProvider,
      geocodingDailyBudget: body.geocodingDailyBudget ? parseInt(body.geocodingDailyBudget, 10) : undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Pengaturan peta berhasil diperbarui',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan pengaturan peta' },
      { status: 500 }
    );
  }
}
