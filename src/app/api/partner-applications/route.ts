import { NextRequest, NextResponse } from 'next/server';
import { DataStore, validateTerritoryLocation } from '@/lib/data-store';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const sessionUser = verifySessionToken(token);

    let applications = DataStore.getApplications();

    // If logged in as MITRA, filter applications to only their own
    if (sessionUser?.role === 'MITRA' && sessionUser.partnerId) {
      applications = applications.filter(
        (a) =>
          a.partnerId === sessionUser.partnerId ||
          a.applicantPhone.replace(/\D/g, '') === sessionUser.phone.replace(/\D/g, '')
      );
    }

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
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const sessionUser = verifySessionToken(token);

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

    const resolvedName =
      sessionUser?.role === 'MITRA' ? sessionUser.name : applicantName;
    const resolvedPhone =
      sessionUser?.role === 'MITRA' ? sessionUser.phone : applicantPhone;
    const resolvedPartnerId =
      sessionUser?.role === 'MITRA' ? sessionUser.partnerId : partnerId;

    if (!resolvedName || !resolvedPhone || !proposedOutletName || latitude === undefined || longitude === undefined) {
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
      partnerId: resolvedPartnerId,
      applicantName: resolvedName,
      applicantPhone: resolvedPhone,
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
