import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';
import { DataStore } from '@/lib/data-store';
import {
  BookkeepingCategory,
  BookkeepingEntryType,
  PosPaymentMethod,
} from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const sessionUser = verifySessionToken(token);

    if (!sessionUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sesi login tidak ditemukan. Silakan masuk sebagai Mitra terlebih dahulu.',
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const outletIdParam = searchParams.get('outletId');
    const outletId =
      outletIdParam && outletIdParam !== 'ALL' ? outletIdParam : undefined;

    let targetPartnerId: string | undefined;
    if (sessionUser.role === 'MITRA') {
      targetPartnerId = sessionUser.partnerId;
    } else if (sessionUser.role === 'ADMIN_HQ') {
      targetPartnerId = searchParams.get('partnerId') || 'PTR-001';
    }

    if (!targetPartnerId) {
      return NextResponse.json(
        { success: false, error: 'ID Mitra tidak valid pada sesi ini.' },
        { status: 403 }
      );
    }

    const posData = DataStore.getMitraPosAndBookkeeping(targetPartnerId, outletId);
    if (!posData) {
      return NextResponse.json(
        { success: false, error: 'Data POS dan pembukuan mitra tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: posData,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Gagal memuat data POS & pembukuan mitra';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const sessionUser = verifySessionToken(token);

    if (!sessionUser || sessionUser.role !== 'MITRA' || !sessionUser.partnerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Akses ditolak. Hanya akun Mitra terautentikasi yang dapat mencatat transaksi POS dan pembukuan.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const action = body.action || 'CHECKOUT_POS';

    if (action === 'ADD_BOOKKEEPING') {
      const outletId = typeof body.outletId === 'string' ? body.outletId : '';
      const type: BookkeepingEntryType =
        body.type === 'INCOME' ? 'INCOME' : 'EXPENSE';
      const category: BookkeepingCategory = body.category || 'OPERASIONAL_GERAI';
      const description =
        typeof body.description === 'string' ? body.description : '';
      const amount = Number(body.amount || 0);
      const paymentMethod: PosPaymentMethod = body.paymentMethod || 'TUNAI';

      const result = DataStore.createBookkeepingEntry(sessionUser.partnerId, {
        outletId,
        type,
        category,
        description,
        amount,
        paymentMethod,
      });

      if (!result.success || !result.entry) {
        return NextResponse.json(
          { success: false, error: result.error || 'Gagal menyimpan catatan pembukuan.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: result.entry,
        },
        { status: 201 }
      );
    }

    if (action === 'OPEN_SHIFT') {
      const outletId = typeof body.outletId === 'string' ? body.outletId : '';
      const initialCash = Number(body.initialCash || 0);
      const cashierName =
        typeof body.cashierName === 'string' ? body.cashierName : undefined;
      const notes = typeof body.notes === 'string' ? body.notes : undefined;

      const result = DataStore.openStoreShift(sessionUser.partnerId, {
        outletId,
        initialCash,
        cashierName,
        notes,
      });

      if (!result.success || !result.shift) {
        return NextResponse.json(
          { success: false, error: result.error || 'Gagal membuka sesi toko.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: result.shift,
        },
        { status: 201 }
      );
    }

    if (action === 'CLOSE_SHIFT') {
      const outletId = typeof body.outletId === 'string' ? body.outletId : '';
      const actualCashInDrawer = Number(body.actualCashInDrawer || 0);
      const notes = typeof body.notes === 'string' ? body.notes : undefined;

      const result = DataStore.closeStoreShift(sessionUser.partnerId, {
        outletId,
        actualCashInDrawer,
        notes,
      });

      if (!result.success || !result.shift) {
        return NextResponse.json(
          { success: false, error: result.error || 'Gagal menutup sesi toko.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: result.shift,
        },
        { status: 200 }
      );
    }

    // Default: CHECKOUT_POS
    const outletId = typeof body.outletId === 'string' ? body.outletId : '';
    const customerName =
      typeof body.customerName === 'string' ? body.customerName : undefined;
    const paymentMethod: PosPaymentMethod = body.paymentMethod || 'TUNAI';
    const discountAmount = Number(body.discountAmount || 0);
    const amountPaid = Number(body.amountPaid || 0);
    const notes = typeof body.notes === 'string' ? body.notes : undefined;
    const items = Array.isArray(body.items) ? body.items : [];

    const result = DataStore.createPosTransaction(sessionUser.partnerId, {
      outletId,
      customerName,
      paymentMethod,
      discountAmount,
      amountPaid,
      notes,
      items,
    });

    if (!result.success || !result.transaction) {
      return NextResponse.json(
        { success: false, error: result.error || 'Gagal menyimpan transaksi kasir POS.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          transaction: result.transaction,
          bookkeepingEntry: result.bookkeepingEntry,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Gagal memproses transaksi POS & pembukuan';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

