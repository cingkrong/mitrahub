import { NextRequest, NextResponse } from 'next/server';
import { DataStore, validateTerritoryLocation } from '@/lib/data-store';

export async function GET() {
  try {
    const applications = DataStore.getApplications();
    return NextResponse.json({
      success: true,
      data: applications,
      total: applications.length,
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
    const {
      applicantName,
      applicantPhone,
      proposedOutletName,
      proposedAddress,
      latitude,
      longitude,
      minimumRadiusKm = 3.0,
      partnerId,
    } = body;

    if (!applicantName || !applicantPhone || !proposedOutletName || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, error: 'Data pengajuan belum lengkap. Nama, telepon, nama outlet, dan koordinat wajib diisi.' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radius = parseFloat(minimumRadiusKm);

    // Validate territory before saving application
    const territoryResult = validateTerritoryLocation(lat, lng, radius);

    const newApp = DataStore.createApplication({
      partnerId,
      applicantName,
      applicantPhone,
      proposedOutletName,
      proposedAddress: proposedAddress || 'Alamat dalam proses survey',
      latitude: lat,
      longitude: lng,
      minimumRadiusKm: radius,
      feasibilityStatus: territoryResult.feasibility,
      nearestOutletDistanceMeters: territoryResult.nearestDistanceMeters,
      conflictingOutletIds: territoryResult.conflictingOutlets.map((c) => c.outlet.id),
      workflowStatus: 'SUBMITTED',
      reviewerNotes: territoryResult.recommendation,
    });

    return NextResponse.json(
      {
        success: true,
        data: newApp,
        validation: territoryResult,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan pengajuan kemitraan' },
      { status: 500 }
    );
  }
}
