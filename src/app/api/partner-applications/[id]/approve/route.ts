import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/data-store';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { reviewerName = 'Admin HQ Melatea', notes } = body;

    const result = DataStore.approveApplication(id, reviewerName, notes);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pengajuan mitra berhasil disetujui dan outlet telah didaftarkan ke sistem pemetaan',
      data: result.application,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memproses persetujuan mitra' },
      { status: 500 }
    );
  }
}
