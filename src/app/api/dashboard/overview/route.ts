import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/data-store';

export async function GET() {
  try {
    const overview = DataStore.getOverviewDashboard();
    return NextResponse.json({
      success: true,
      data: overview,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
