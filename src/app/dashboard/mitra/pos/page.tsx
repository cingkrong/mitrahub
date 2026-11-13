'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  BookkeepingCategory,
  BookkeepingEntryType,
  MitraPosAndBookkeepingData,
  PosMenuCategory,
  PosPaymentMethod,
  PosTransaction,
  StoreShift,
} from '@/lib/types';
import {
  Calculator,
  BookOpen,
  Store,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Banknote,
  QrCode,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  TrendingUp,
  Wallet,
  Coffee,
  CreditCard,
  Printer,
  Clock,
  DoorOpen,
  DoorClosed,
  X,
  FileSpreadsheet,
} from 'lucide-react';

const CATEGORY_LABELS: Record<'ALL' | PosMenuCategory, string> = {
  ALL: 'Semua Menu',
  ORIGINAL_TEA: 'Original Tea',
  FRUIT_TEA: 'Fruit Tea',
  MILK_TEA: 'Milk Tea',
  TOPPING: 'Topping',
};

const BOOKKEEPING_CATEGORY_LABELS: Record<BookkeepingCategory, string> = {
  PENJUALAN_POS: 'Penjualan Kasir POS',
  BAHAN_BAKU_LOKAL: 'Bahan Baku Lokal (Es Batu / Gula)',
  OPERASIONAL_GERAI: 'Operasional Gerai (Listrik / Air / Kemasan)',
  GAJI_KARYAWAN: 'Gaji / Insentif Penjaga Gerai',
  LAINNYA: 'Lainnya',
};

export default function MitraPosAndBookkeepingPage() {
  const router = useRouter();
  const [data, setData] = useState<MitraPosAndBookkeepingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pos' | 'shift' | 'bookkeeping'>('pos');
  const [selectedOutletId, setSelectedOutletId] = useState<string>('');

  // POS Cart & Checkout State
  const [menuCategory, setMenuCategory] = useState<'ALL' | PosMenuCategory>('ALL');
  const [cart, setCart] = useState<Record<string, number>>({
    'MNU-ORI-22': 2,
    'MNU-MNG-22': 1,
  });
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod>('TUNAI');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [posNotes, setPosNotes] = useState('');
  const [submittingPos, setSubmittingPos] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<PosTransaction | null>(null);

  // Store Shift (Buka / Tutup Toko) Modal States
  const [openShiftModal, setOpenShiftModal] = useState(false);
  const [closeShiftModal, setCloseShiftModal] = useState(false);
  const [initialCashInput, setInitialCashInput] = useState('100000');
  const [cashierNameInput, setCashierNameInput] = useState('');
  const [openNotesInput, setOpenNotesInput] = useState('');
  const [actualCashDrawerInput, setActualCashDrawerInput] = useState('');
  const [closeNotesInput, setCloseNotesInput] = useState('');
  const [submittingShift, setSubmittingShift] = useState(false);
  const [shiftReportToPrint, setShiftReportToPrint] = useState<StoreShift | null>(null);

  // Print Receipt Modal
  const [receiptToPrint, setReceiptToPrint] = useState<PosTransaction | null>(null);

  // Bookkeeping Form State
  const [entryType, setEntryType] = useState<BookkeepingEntryType>('EXPENSE');
  const [entryCategory, setEntryCategory] =
    useState<BookkeepingCategory>('BAHAN_BAKU_LOKAL');
  const [entryDescription, setEntryDescription] = useState('');
  const [entryAmount, setEntryAmount] = useState<string>('');
  const [entryPaymentMethod, setEntryPaymentMethod] =
    useState<PosPaymentMethod>('TUNAI');
  const [submittingBookkeeping, setSubmittingBookkeeping] = useState(false);
  const [journalFilter, setJournalFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

  // Feedback Messages
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPosData = useCallback(
    async (outletFilter?: string) => {
      try {
        const query =
          outletFilter && outletFilter !== 'ALL'
            ? `?outletId=${encodeURIComponent(outletFilter)}`
            : '';
        const res = await fetch(`/api/mitra/pos${query}`);
        if (res.status === 401) {
          router.replace('/login');
          return;
        }
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
          if (!outletFilter && json.data.outlets.length > 0) {
            setSelectedOutletId(json.data.outlets[0].id);
          }
        }
      } catch {
        setErrorMessage('Gagal memuat data kasir POS dan pembukuan mitra.');
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const res = await fetch('/api/mitra/pos');
        if (!active) return;
        if (res.status === 401) {
          router.replace('/login');
          return;
        }
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
          if (json.data.outlets.length > 0) {
            setSelectedOutletId(json.data.outlets[0].id);
          }
        }
      } catch {
        if (active) setErrorMessage('Gagal memuat data kasir POS dan pembukuan.');
      } finally {
        if (active) setLoading(false);
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [router]);

  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleAdjustCart = (code: string, delta: number) => {
    setCart((prev) => {
      const nextQty = Math.max(0, (prev[code] || 0) + delta);
      if (nextQty === 0) {
        const copy = { ...prev };
        delete copy[code];
        return copy;
      }
      return { ...prev, [code]: nextQty };
    });
  };

  const handleClearCart = () => {
    setCart({});
    setDiscountAmount(0);
    setAmountPaidInput('');
    setCustomerName('');
    setPosNotes('');
  };

  const menuItems = data?.menuItems || [];
  const filteredMenu =
    menuCategory === 'ALL'
      ? menuItems
      : menuItems.filter((m) => m.category === menuCategory);

  const cartLines = menuItems
    .filter((m) => (cart[m.code] || 0) > 0)
    .map((m) => {
      const quantity = cart[m.code] || 0;
      return {
        ...m,
        quantity,
        subtotal: m.sellingPrice * quantity,
        subtotalCogs: m.estimatedCogs * quantity,
      };
    });

  const cartTotalCups = cartLines.reduce(
    (sum, item) => sum + (item.cupSize !== 'ADDON' ? item.quantity : 0),
    0
  );
  const cartSubtotal = cartLines.reduce((sum, item) => sum + item.subtotal, 0);
  const cartEstimatedCogs = cartLines.reduce((sum, item) => sum + item.subtotalCogs, 0);
  const validDiscount = Math.max(0, Math.min(cartSubtotal, discountAmount || 0));
  const cartGrandTotal = cartSubtotal - validDiscount;
  const cartEstimatedProfit = cartGrandTotal - cartEstimatedCogs;

  const numericPaid =
    paymentMethod === 'TUNAI'
      ? amountPaidInput
        ? Math.max(0, parseInt(amountPaidInput, 10) || 0)
        : cartGrandTotal
      : cartGrandTotal;
  const cashChange = Math.max(0, numericPaid - cartGrandTotal);

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  // Checkout POS
  const handleCheckoutPos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartLines.length === 0) {
      setErrorMessage('Pilih minimal 1 menu minuman pada keranjang kasir.');
      return;
    }
    if (paymentMethod === 'TUNAI' && numericPaid < cartGrandTotal) {
      setErrorMessage('Nominal uang tunai yang diterima kurang dari total tagihan.');
      return;
    }

    setSubmittingPos(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/mitra/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CHECKOUT_POS',
          outletId: selectedOutletId,
          customerName,
          paymentMethod,
          discountAmount: validDiscount,
          amountPaid: numericPaid,
          notes: posNotes,
          items: cartLines.map((l) => ({
            menuCode: l.code,
            quantity: l.quantity,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMessage(json.error || 'Gagal menyimpan transaksi kasir POS.');
        setSubmittingPos(false);
        return;
      }

      const trx: PosTransaction = json.data.transaction;
      setLastTransaction(trx);
      setReceiptToPrint(trx);
      setStatusMessage(
        `Transaksi ${trx.id} (${trx.totalCups} cup • ${formatRupiah(
          trx.totalAmount
        )}) berhasil disimpan dan otomatis tercatat ke buku kas!`
      );
      handleClearCart();
      await fetchPosData(selectedOutletId);
    } catch {
      setErrorMessage('Terjadi kesalahan koneksi saat menyimpan transaksi POS.');
    } finally {
      setSubmittingPos(false);
    }
  };

  // Buka Toko (Open Shift)
  const handleOpenStore = async (e: React.FormEvent) => {
    e.preventDefault();
    const cash = parseInt(initialCashInput, 10);
    if (!Number.isFinite(cash) || cash < 0) {
      setErrorMessage('Nominal modal kas awal laci tidak valid.');
      return;
    }

    setSubmittingShift(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/mitra/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'OPEN_SHIFT',
          outletId: selectedOutletId,
          initialCash: cash,
          cashierName: cashierNameInput,
          notes: openNotesInput,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMessage(json.error || 'Gagal membuka sesi toko.');
        setSubmittingShift(false);
        return;
      }

      setStatusMessage(
        `Toko berhasil DIBUKA! Kas modal awal laci tercatat ${formatRupiah(
          json.data.initialCash
        )}.`
      );
      setOpenShiftModal(false);
      setOpenNotesInput('');
      await fetchPosData(selectedOutletId);
    } catch {
      setErrorMessage('Gagal menghubungi server untuk membuka toko.');
    } finally {
      setSubmittingShift(false);
    }
  };

  // Tutup Toko (Close Shift & Reconcile)
  const handleCloseStore = async (e: React.FormEvent) => {
    e.preventDefault();
    const actualCash = parseInt(actualCashDrawerInput, 10);
    if (!Number.isFinite(actualCash) || actualCash < 0) {
      setErrorMessage('Hitung dan masukkan jumlah fisik uang tunai di laci kasir.');
      return;
    }

    setSubmittingShift(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/mitra/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CLOSE_SHIFT',
          outletId: selectedOutletId,
          actualCashInDrawer: actualCash,
          notes: closeNotesInput,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMessage(json.error || 'Gagal menutup sesi toko.');
        setSubmittingShift(false);
        return;
      }

      const closed: StoreShift = json.data;
      setShiftReportToPrint(closed);
      setStatusMessage(
        `Toko berhasil DITUTUP! Total penjualan shift: ${formatRupiah(
          closed.totalSalesCash + closed.totalSalesQris + closed.totalSalesTransfer
        )} (${closed.totalCupsSold} cup). Selisih kas fisik: ${
          (closed.cashDifference ?? 0) >= 0 ? '+' : ''
        }${formatRupiah(closed.cashDifference)}.`
      );
      setCloseShiftModal(false);
      setActualCashDrawerInput('');
      setCloseNotesInput('');
      await fetchPosData(selectedOutletId);
    } catch {
      setErrorMessage('Gagal menghubungi server untuk menutup toko.');
    } finally {
      setSubmittingShift(false);
    }
  };

  // Tambah Pembukuan
  const handleAddBookkeeping = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseInt(entryAmount, 10);
    if (!entryDescription.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setErrorMessage('Isi keterangan dan nominal pembukuan dengan benar.');
      return;
    }

    setSubmittingBookkeeping(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/mitra/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_BOOKKEEPING',
          outletId: selectedOutletId,
          type: entryType,
          category: entryCategory,
          description: entryDescription.trim(),
          amount: numericAmount,
          paymentMethod: entryPaymentMethod,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMessage(json.error || 'Gagal menyimpan catatan pembukuan.');
        setSubmittingBookkeeping(false);
        return;
      }

      setStatusMessage(
        `Catatan pembukuan ${json.data.id} (${
          entryType === 'INCOME' ? 'Kas Masuk' : 'Pengeluaran'
        } ${formatRupiah(json.data.amount)}) berhasil ditambahkan.`
      );
      setEntryDescription('');
      setEntryAmount('');
      await fetchPosData(selectedOutletId);
    } catch {
      setErrorMessage('Gagal menyimpan catatan pembukuan ke server.');
    } finally {
      setSubmittingBookkeeping(false);
    }
  };

  if (loading || !data) {
    return (
      <DashboardLayout
        title="Kasir POS & Pembukuan Mitra"
        subtitle="Memuat mesin kasir, sesi shift toko, dan buku kas gerai..."
      >
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#71379B] border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  const { summary, transactions, bookkeepingEntries, outlets, currentShift, shiftHistory } = data;
  const filteredJournal =
    journalFilter === 'ALL'
      ? bookkeepingEntries
      : bookkeepingEntries.filter((b) => b.type === journalFilter);

  const currentOutletName =
    outlets.find((o) => o.id === selectedOutletId)?.name || 'Gerai Melatea';

  return (
    <DashboardLayout
      title="Kasir POS & Pembukuan Gerai"
      subtitle={`Input Penjualan Harian, Buka-Tutup Shift & Pembukuan Mitra: ${data.partner.ownerName} (${data.partner.id})`}
    >
      {/* Page-Level Control Bar */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-[#E7DEF0] bg-white p-3.5 no-print">
        {/* Left: Mode Switcher Tabs */}
        <div
          role="tablist"
          aria-label="Mode Kasir POS, Shift Toko, dan Pembukuan"
          className="flex flex-wrap items-center gap-1.5 rounded-lg bg-[#FAF7FC] p-1 border border-[#E7DEF0]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'pos'}
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors duration-150 cursor-pointer ${
              activeTab === 'pos'
                ? 'bg-[#71379B] text-white shadow-xs'
                : 'text-[#6B5E78] hover:text-[#24182E]'
            }`}
          >
            <Calculator className="h-4 w-4" />
            <span>Kasir POS (Input Penjualan)</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'shift'}
            onClick={() => setActiveTab('shift')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors duration-150 cursor-pointer ${
              activeTab === 'shift'
                ? 'bg-[#71379B] text-white shadow-xs'
                : 'text-[#6B5E78] hover:text-[#24182E]'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Buka / Tutup Toko</span>
            <span
              className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                currentShift
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {currentShift ? 'BUKA' : 'TUTUP'}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'bookkeeping'}
            onClick={() => setActiveTab('bookkeeping')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors duration-150 cursor-pointer ${
              activeTab === 'bookkeeping'
                ? 'bg-[#29183B] text-white shadow-xs'
                : 'text-[#6B5E78] hover:text-[#24182E]'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Pembukuan & Arus Kas ({bookkeepingEntries.length})</span>
          </button>
        </div>

        {/* Right: Active Outlet Selector & Shift Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <label
              htmlFor="pos-outlet-select"
              className="text-xs font-semibold text-[#6B5E78] flex items-center gap-1.5 shrink-0"
            >
              <Store className="h-4 w-4 text-[#71379B]" />
              <span>Gerai:</span>
            </label>
            <select
              id="pos-outlet-select"
              value={selectedOutletId}
              onChange={(e) => {
                const nextOutlet = e.target.value;
                setSelectedOutletId(nextOutlet);
                fetchPosData(nextOutlet);
              }}
              className="rounded-lg border border-[#E7DEF0] bg-[#FAF7FC] px-3 py-2 text-xs font-semibold text-[#24182E] focus:border-[#71379B] outline-none"
            >
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.city})
                </option>
              ))}
            </select>
          </div>

          {currentShift ? (
            <button
              type="button"
              onClick={() => {
                setActualCashDrawerInput(String(currentShift.expectedCashInDrawer));
                setCloseShiftModal(true);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors duration-150 cursor-pointer"
            >
              <DoorClosed className="h-4 w-4 text-rose-600" />
              <span>Tutup Toko</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setOpenShiftModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors duration-150 cursor-pointer"
            >
              <DoorOpen className="h-4 w-4 text-emerald-600" />
              <span>Buka Toko</span>
            </button>
          )}
        </div>
      </div>

      {/* Current Shift Banner Notification (Visible on POS mode) */}
      {currentShift ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-950 no-print">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <span className="font-bold">
                Shift Aktif ({currentShift.id}) — Kasir: {currentShift.cashierName}
              </span>
              <span className="text-emerald-800 ml-2">
                Buka sejak{' '}
                {new Date(currentShift.openedAt).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                WIB • Modal Laci: {formatRupiah(currentShift.initialCash)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 font-mono font-bold tabular-nums">
            <span>
              Penjualan Shift: {formatRupiah(currentShift.totalSalesCash + currentShift.totalSalesQris + currentShift.totalSalesTransfer)}
            </span>
            <span className="text-[#6B5E78]">|</span>
            <span>Kas di Laci: {formatRupiah(currentShift.expectedCashInDrawer)}</span>
          </div>
        </div>
      ) : (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950 no-print">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-700 shrink-0" />
            <span>
              <strong>Toko Belum Dibuka!</strong> Lakukan Buka Toko terlebih dahulu untuk mencatat modal uang kas awal di laci kasir dan menghitung rekap hasil penjualan.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOpenShiftModal(true)}
            className="rounded-lg bg-amber-700 px-3 py-1.5 font-bold text-white hover:bg-amber-800 cursor-pointer"
          >
            Buka Toko Sekarang
          </button>
        </div>
      )}

      {/* Feedback Banner */}
      {statusMessage && (
        <div
          role="status"
          className="mb-5 flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 no-print"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-emerald-700 hover:underline text-[11px]"
          >
            Tutup
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="mb-5 flex items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800 no-print"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:underline text-[11px]"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Top 4 Financial & Sales KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 no-print">
        <div className="rounded-xl border border-[#E7DEF0] bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B5E78]">Omzet Penjualan POS</span>
            <div className="rounded-lg bg-[#F0E5F7] p-2 text-[#71379B]">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-xl font-bold font-mono tabular-nums text-[#24182E]">
            {formatRupiah(summary.totalRevenue)}
          </div>
          <p className="mt-1 text-[11px] text-[#6B5E78] tabular-nums">
            {summary.totalTransactions} struk • {summary.totalCupsSold} cup terjual
          </p>
        </div>

        <div className="rounded-xl border border-[#E7DEF0] bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B5E78]">Laba Kotor Minuman</span>
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-xl font-bold font-mono tabular-nums text-emerald-700">
            {formatRupiah(summary.totalGrossProfit)}
          </div>
          <p className="mt-1 text-[11px] text-[#6B5E78] tabular-nums">
            Estimasi HPP: {formatRupiah(summary.totalEstimatedCogs)}
          </p>
        </div>

        <div className="rounded-xl border border-[#E7DEF0] bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B5E78]">Biaya Operasional</span>
            <div className="rounded-lg bg-rose-100 p-2 text-rose-700">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-xl font-bold font-mono tabular-nums text-rose-700">
            {formatRupiah(summary.totalOperationalExpenses)}
          </div>
          <p className="mt-1 text-[11px] text-[#6B5E78]">
            Es batu, gula, listrik & operasional gerai
          </p>
        </div>

        <div className="rounded-xl border border-[#E7DEF0] bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B5E78]">Laba Bersih Operasional</span>
            <div className="rounded-lg bg-amber-100 p-2 text-amber-800">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div
            className={`mt-2 text-lg sm:text-xl font-bold font-mono tabular-nums ${
              summary.netOperatingProfit >= 0 ? 'text-[#24182E]' : 'text-rose-700'
            }`}
          >
            {formatRupiah(summary.netOperatingProfit)}
          </div>
          <p className="mt-1 text-[11px] text-[#6B5E78] tabular-nums">
            Tunai: {formatRupiah(summary.paymentBreakdown.TUNAI)} • QRIS:{' '}
            {formatRupiah(summary.paymentBreakdown.QRIS)}
          </p>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: KASIR POS (INPUT PENJUALAN CEPAT)                              */}
      {/* ===================================================================== */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
          {/* Left: Menu Selection Grid */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-xl border border-[#E7DEF0] bg-white p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#E7DEF0]">
                <div>
                  <h2 className="text-base font-bold text-[#24182E]">
                    Menu Minuman & Topping Kasir
                  </h2>
                  <p className="text-xs text-[#6B5E78]">
                    Klik kartu menu untuk menambahkan langsung ke struk pesanan
                  </p>
                </div>

                {/* Category Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {(Object.keys(CATEGORY_LABELS) as Array<'ALL' | PosMenuCategory>).map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setMenuCategory(cat)}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer ${
                          menuCategory === cat
                            ? 'bg-[#71379B] text-white'
                            : 'bg-[#FAF7FC] text-[#6B5E78] border border-[#E7DEF0] hover:text-[#24182E]'
                        }`}
                      >
                        {CATEGORY_LABELS[cat]}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Menu Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredMenu.map((item) => {
                  const inCartQty = cart[item.code] || 0;
                  return (
                    <div
                      key={item.code}
                      onClick={() => handleAdjustCart(item.code, 1)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleAdjustCart(item.code, 1);
                        }
                      }}
                      className={`rounded-xl border p-3.5 flex flex-col justify-between cursor-pointer select-none ${
                        inCartQty > 0
                          ? 'border-[#71379B] bg-[#F0E5F7]/35'
                          : 'border-[#E7DEF0] bg-[#FAF7FC] hover:border-[#71379B]/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="rounded bg-white border border-[#E7DEF0] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#71379B]">
                            {item.cupSize}
                          </span>
                          {inCartQty > 0 && (
                            <span className="rounded-full bg-[#71379B] px-2 py-0.5 font-mono text-[10px] font-bold text-white tabular-nums">
                              {inCartQty}x dipilih
                            </span>
                          )}
                        </div>
                        <h3 className="mt-2 text-xs font-bold text-[#24182E] leading-snug">
                          {item.name}
                        </h3>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#E7DEF0] flex items-center justify-between">
                        <div>
                          <div className="font-mono text-sm font-bold tabular-nums text-[#71379B]">
                            {formatRupiah(item.sellingPrice)}
                          </div>
                          <div className="text-[10px] text-[#6B5E78] font-mono tabular-nums">
                            HPP: {formatRupiah(item.estimatedCogs)}
                          </div>
                        </div>
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#71379B] text-white">
                          <Plus className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent POS Transactions Table */}
            <div className="rounded-xl border border-[#E7DEF0] bg-white p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#24182E]">
                    Riwayat Struk Kasir Terbaru ({transactions.length})
                  </h3>
                  <p className="text-xs text-[#6B5E78]">
                    Dapat dicetak ulang kapan saja ke printer thermal / cetak struk
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('bookkeeping')}
                  className="text-xs font-semibold text-[#71379B] hover:underline cursor-pointer"
                >
                  Lihat Buku Kas
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7FC] text-[#6B5E78] font-semibold border-b border-[#E7DEF0]">
                    <tr>
                      <th className="py-2.5 px-3">No. Struk</th>
                      <th className="py-2.5 px-3">Waktu</th>
                      <th className="py-2.5 px-3">Item Terjual</th>
                      <th className="py-2.5 px-3">Metode</th>
                      <th className="py-2.5 px-3 text-right">Omzet</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DEF0]">
                    {transactions.slice(0, 6).map((trx) => (
                      <tr key={trx.id} className="hover:bg-[#FAF7FC]">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#71379B]">
                          {trx.id}
                        </td>
                        <td className="py-2.5 px-3 text-[#6B5E78] tabular-nums">
                          {new Date(trx.createdAt).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-[#24182E]">
                            {trx.totalCups} cup
                          </span>{' '}
                          <span className="text-[#6B5E78]">
                            ({trx.items.map((i) => `${i.quantity}x ${i.menuName}`).join(', ')})
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="rounded bg-[#F0E5F7] px-2 py-0.5 text-[10px] font-bold text-[#71379B]">
                            {trx.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-[#24182E]">
                          {formatRupiah(trx.totalAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setReceiptToPrint(trx)}
                            className="inline-flex items-center gap-1 rounded bg-[#FAF7FC] border border-[#E7DEF0] px-2 py-1 text-[11px] font-semibold text-[#71379B] hover:bg-[#F0E5F7] cursor-pointer"
                          >
                            <Printer className="h-3 w-3" />
                            <span>Cetak</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: Active POS Cashier Cart & Payment Calculator */}
          <div className="lg:col-span-5 space-y-4">
            <form
              onSubmit={handleCheckoutPos}
              className="rounded-xl border border-[#E7DEF0] bg-white p-5 space-y-4 sticky top-24"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E7DEF0]">
                <div className="flex items-center gap-2">
                  <Coffee className="h-4.5 w-4.5 text-[#71379B]" />
                  <div>
                    <h2 className="text-base font-bold text-[#24182E]">
                      Struk Kasir Aktif
                    </h2>
                    <p className="text-[11px] text-[#6B5E78]">
                      Total {cartTotalCups} cup dipilih
                    </p>
                  </div>
                </div>
                {cartLines.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCart}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Kosongkan</span>
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {cartLines.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#E7DEF0] p-6 text-center text-xs text-[#6B5E78]">
                    Keranjang kasir masih kosong. Klik menu di sebelah kiri untuk mulai mencatat pesanan.
                  </div>
                ) : (
                  cartLines.map((line) => (
                    <div
                      key={line.code}
                      className="flex items-center justify-between gap-2 rounded-lg border border-[#E7DEF0] bg-[#FAF7FC] p-2.5 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[#24182E] truncate">
                          {line.name}
                        </div>
                        <div className="font-mono text-[11px] text-[#6B5E78] tabular-nums">
                          {formatRupiah(line.sellingPrice)} / {line.cupSize}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAdjustCart(line.code, -1)}
                          aria-label={`Kurangi ${line.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E7DEF0] bg-white text-[#24182E] hover:bg-[#F0E5F7] cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center font-mono font-bold tabular-nums text-[#24182E]">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAdjustCart(line.code, 1)}
                          aria-label={`Tambah ${line.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-[#71379B] text-white hover:bg-[#5D2B82] cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="w-20 text-right font-mono font-bold tabular-nums text-[#24182E] shrink-0">
                        {formatRupiah(line.subtotal)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Customer & Discount Inputs */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E7DEF0]">
                <div>
                  <label
                    htmlFor="pos-customer"
                    className="block text-[11px] font-semibold text-[#24182E] mb-1"
                  >
                    Nama Pelanggan (Opsional)
                  </label>
                  <input
                    id="pos-customer"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Walk-in / Nama"
                    className="w-full rounded-lg border border-[#E7DEF0] bg-white px-2.5 py-1.5 text-xs text-[#24182E] focus:border-[#71379B] outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="pos-discount"
                    className="block text-[11px] font-semibold text-[#24182E] mb-1"
                  >
                    Potongan Diskon (Rp)
                  </label>
                  <input
                    id="pos-discount"
                    type="number"
                    min={0}
                    step={500}
                    value={discountAmount || ''}
                    onChange={(e) =>
                      setDiscountAmount(Math.max(0, parseInt(e.target.value || '0', 10)))
                    }
                    placeholder="0"
                    className="w-full rounded-lg border border-[#E7DEF0] bg-white px-2.5 py-1.5 font-mono text-xs tabular-nums text-[#24182E] focus:border-[#71379B] outline-none"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <span className="block text-[11px] font-semibold text-[#24182E] mb-1.5">
                  Metode Pembayaran
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'TUNAI', label: 'Tunai', icon: Banknote },
                      { id: 'QRIS', label: 'QRIS', icon: QrCode },
                      { id: 'TRANSFER', label: 'Transfer', icon: CreditCard },
                    ] as const
                  ).map((pm) => {
                    const Icon = pm.icon;
                    const active = paymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 px-2 text-xs font-semibold cursor-pointer ${
                          active
                            ? 'border-[#71379B] bg-[#F0E5F7] text-[#29183B]'
                            : 'border-[#E7DEF0] bg-[#FAF7FC] text-[#6B5E78] hover:text-[#24182E]'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 text-[#71379B]" />
                        <span>{pm.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash Tendered Calculator (Only for TUNAI) */}
              {paymentMethod === 'TUNAI' && (
                <div className="rounded-lg border border-[#E7DEF0] bg-[#FAF7FC] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="pos-paid-input"
                      className="text-[11px] font-semibold text-[#24182E]"
                    >
                      Uang Tunai Diterima (Rp)
                    </label>
                    <div className="flex items-center gap-1">
                      {[
                        { label: 'Uang Pas', val: cartGrandTotal },
                        { label: '20rb', val: 20000 },
                        { label: '50rb', val: 50000 },
                        { label: '100rb', val: 100000 },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setAmountPaidInput(String(preset.val))}
                          className="rounded border border-[#E7DEF0] bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#71379B] hover:bg-[#F0E5F7] cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    id="pos-paid-input"
                    type="number"
                    min={0}
                    step={1000}
                    value={amountPaidInput}
                    onChange={(e) => setAmountPaidInput(e.target.value)}
                    placeholder={String(cartGrandTotal)}
                    className="w-full rounded-lg border border-[#E7DEF0] bg-white px-3 py-1.5 font-mono text-xs font-bold tabular-nums text-[#24182E] focus:border-[#71379B] outline-none"
                  />
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[#6B5E78] font-medium">Kembalian Pelanggan:</span>
                    <span className="font-mono font-bold tabular-nums text-emerald-700">
                      {formatRupiah(cashChange)}
                    </span>
                  </div>
                </div>
              )}

              {/* Totals & Profit Breakdown */}
              <div className="space-y-1.5 pt-2 border-t border-[#E7DEF0] text-xs">
                <div className="flex items-center justify-between text-[#6B5E78]">
                  <span>Subtotal ({cartTotalCups} cup)</span>
                  <span className="font-mono tabular-nums">{formatRupiah(cartSubtotal)}</span>
                </div>
                {validDiscount > 0 && (
                  <div className="flex items-center justify-between text-rose-600">
                    <span>Diskon Promo</span>
                    <span className="font-mono tabular-nums">
                      -{formatRupiah(validDiscount)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[#6B5E78]">
                  <span>Estimasi Laba Kotor Struk</span>
                  <span className="font-mono font-semibold tabular-nums text-emerald-700">
                    +{formatRupiah(cartEstimatedProfit)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#E7DEF0]">
                  <span className="text-sm font-bold text-[#24182E]">Total Tagihan</span>
                  <span className="text-lg font-bold font-mono tabular-nums text-[#71379B]">
                    {formatRupiah(cartGrandTotal)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingPos || cartLines.length === 0}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#71379B] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#5D2B82] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 cursor-pointer"
              >
                <Receipt className="h-4 w-4" />
                <span>
                  {submittingPos
                    ? 'Menyimpan Struk...'
                    : 'Simpan Transaksi & Cetak Struk'}
                </span>
              </button>
            </form>

            {/* Last Saved Receipt Card */}
            {lastTransaction && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-emerald-950">
                  <span>Struk Terakhir: {lastTransaction.id}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-emerald-200/80 px-2 py-0.5 text-[10px] font-mono">
                      {lastTransaction.paymentMethod}
                    </span>
                    <button
                      type="button"
                      onClick={() => setReceiptToPrint(lastTransaction)}
                      className="flex items-center gap-1 rounded bg-[#71379B] px-2 py-0.5 text-[10px] font-bold text-white hover:bg-[#5D2B82] cursor-pointer"
                    >
                      <Printer className="h-3 w-3" />
                      <span>Cetak</span>
                    </button>
                  </div>
                </div>
                <div className="text-[11px] text-emerald-900 space-y-0.5">
                  {lastTransaction.items.map((item) => (
                    <div key={item.id} className="flex justify-between font-mono tabular-nums">
                      <span>
                        {item.quantity}x {item.menuName}
                      </span>
                      <span>{formatRupiah(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-emerald-200 flex items-center justify-between font-mono font-bold text-emerald-950 tabular-nums">
                  <span>Total Dibayar</span>
                  <span>{formatRupiah(lastTransaction.totalAmount)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: BUKA TOKO & TUTUP TOKO (REKONSILIASI KAS SHIFT)                 */}
      {/* ===================================================================== */}
      {activeTab === 'shift' && (
        <div className="space-y-6 no-print">
          {/* Active Shift Card or Open Action */}
          <div className="rounded-xl border border-[#E7DEF0] bg-white p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E7DEF0]">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      currentShift
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    STATUS TOKO: {currentShift ? 'SEDANG BUKA' : 'SEDANG TUTUP'}
                  </span>
                  <span className="text-xs text-[#6B5E78]">
                    Gerai: <strong className="text-[#24182E]">{currentOutletName}</strong>
                  </span>
                </div>
                <h2 className="mt-2 text-lg font-bold text-[#24182E]">
                  Manajemen Sesi Kasir & Rekonsiliasi Penjualan Harian
                </h2>
                <p className="mt-0.5 text-xs text-[#6B5E78]">
                  Fitur Buka Toko mencatat modal kas laci awal; Tutup Toko menghitung total penjualan tunai, QRIS, dan mendeteksi selisih uang fisik di laci.
                </p>
              </div>

              <div>
                {currentShift ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActualCashDrawerInput(String(currentShift.expectedCashInDrawer));
                      setCloseShiftModal(true);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700 shadow-xs cursor-pointer"
                  >
                    <DoorClosed className="h-4 w-4" />
                    <span>Lakukan Tutup Toko & Rekonsiliasi Kas</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpenShiftModal(true)}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
                  >
                    <DoorOpen className="h-4 w-4" />
                    <span>Buka Toko & Input Modal Kas Laci</span>
                  </button>
                )}
              </div>
            </div>

            {/* Current Active Shift Details */}
            {currentShift ? (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-[#E7DEF0] bg-[#FAF7FC] p-4">
                    <span className="text-[11px] font-semibold text-[#6B5E78]">
                      Kas Modal Awal Laci
                    </span>
                    <div className="mt-1 font-mono text-lg font-bold text-[#24182E] tabular-nums">
                      {formatRupiah(currentShift.initialCash)}
                    </div>
                    <span className="text-[10px] text-[#6B5E78]">
                      Petugas: {currentShift.cashierName}
                    </span>
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                    <span className="text-[11px] font-semibold text-emerald-900">
                      Penjualan Tunai Shift
                    </span>
                    <div className="mt-1 font-mono text-lg font-bold text-emerald-700 tabular-nums">
                      +{formatRupiah(currentShift.totalSalesCash)}
                    </div>
                    <span className="text-[10px] text-emerald-800">
                      Masuk ke laci kasir
                    </span>
                  </div>

                  <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
                    <span className="text-[11px] font-semibold text-rose-900">
                      Pengeluaran Kas Laci
                    </span>
                    <div className="mt-1 font-mono text-lg font-bold text-rose-700 tabular-nums">
                      -{formatRupiah(currentShift.totalExpensesCash)}
                    </div>
                    <span className="text-[10px] text-rose-800">
                      Belanja es batu / gula
                    </span>
                  </div>

                  <div className="rounded-xl border border-[#71379B]/30 bg-[#F0E5F7]/40 p-4">
                    <span className="text-[11px] font-semibold text-[#29183B]">
                      Ekspektasi Kas di Laci
                    </span>
                    <div className="mt-1 font-mono text-lg font-bold text-[#71379B] tabular-nums">
                      {formatRupiah(currentShift.expectedCashInDrawer)}
                    </div>
                    <span className="text-[10px] text-[#6B5E78]">
                      (Awal + Jual Tunai - Keluar)
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#E7DEF0] bg-white p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-[#6B5E78]">Penjualan Non-Tunai QRIS:</span>{' '}
                      <strong className="font-mono tabular-nums text-[#24182E]">
                        {formatRupiah(currentShift.totalSalesQris)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#6B5E78]">Transfer:</span>{' '}
                      <strong className="font-mono tabular-nums text-[#24182E]">
                        {formatRupiah(currentShift.totalSalesTransfer)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#6B5E78]">Total Minuman Terjual:</span>{' '}
                      <strong className="font-mono tabular-nums text-[#71379B]">
                        {currentShift.totalCupsSold} cup
                      </strong>{' '}
                      ({currentShift.totalTransactionCount} transaksi)
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShiftReportToPrint(currentShift)}
                    className="flex items-center gap-1.5 rounded-lg border border-[#E7DEF0] bg-[#FAF7FC] px-3 py-1.5 font-bold text-[#71379B] hover:bg-[#F0E5F7] cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Cetak Lembar Rekap Shift</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-[#E7DEF0] p-8 text-center text-xs text-[#6B5E78]">
                Saat ini gerai dalam status TUTUP. Klik tombol <strong>Buka Toko</strong> untuk memulai shift penjualan kasir hari ini.
              </div>
            )}
          </div>

          {/* Shift History Table */}
          <div className="rounded-xl border border-[#E7DEF0] bg-white p-5">
            <h3 className="text-base font-bold text-[#24182E] mb-1">
              Riwayat Sesi Buka - Tutup Toko ({shiftHistory.length})
            </h3>
            <p className="text-xs text-[#6B5E78] mb-4">
              Rekap historis pergantian shift kasir, total omzet per shift, dan verifikasi selisih kas fisik
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7FC] text-[#6B5E78] font-semibold border-b border-[#E7DEF0]">
                  <tr>
                    <th className="py-2.5 px-3">ID Shift</th>
                    <th className="py-2.5 px-3">Waktu Buka / Tutup</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Modal Awal</th>
                    <th className="py-2.5 px-3 text-right">Penjualan Tunai</th>
                    <th className="py-2.5 px-3 text-right">QRIS & Transfer</th>
                    <th className="py-2.5 px-3 text-right">Kas Riil / Selisih</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7DEF0]">
                  {shiftHistory.map((s) => (
                    <tr key={s.id} className="hover:bg-[#FAF7FC]">
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-[#71379B]">{s.id}</div>
                        <div className="text-[11px] text-[#6B5E78]">{s.cashierName}</div>
                      </td>
                      <td className="py-3 px-3 tabular-nums">
                        <div>
                          Buka: {new Date(s.openedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} ({new Date(s.openedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})
                        </div>
                        <div className="text-[11px] text-[#6B5E78]">
                          {s.closedAt
                            ? `Tutup: ${new Date(s.closedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
                            : 'Masih Buka'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            s.status === 'OPEN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-[#6B5E78]'
                          }`}
                        >
                          {s.status === 'OPEN' ? 'BUKA' : 'SELESAI'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-[#24182E]">
                        {formatRupiah(s.initialCash)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-emerald-700">
                        +{formatRupiah(s.totalSalesCash)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-[#24182E]">
                        {formatRupiah(s.totalSalesQris + s.totalSalesTransfer)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        {s.actualCashInDrawer !== undefined ? (
                          <div>
                            <span className="font-bold text-[#24182E]">
                              {formatRupiah(s.actualCashInDrawer)}
                            </span>
                            <div
                              className={`text-[10px] font-bold ${
                                (s.cashDifference ?? 0) === 0
                                  ? 'text-emerald-700'
                                  : (s.cashDifference ?? 0) > 0
                                  ? 'text-blue-700'
                                  : 'text-rose-700'
                              }`}
                            >
                              Selisih:{' '}
                              {(s.cashDifference ?? 0) >= 0 ? '+' : ''}
                              {formatRupiah(s.cashDifference)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#6B5E78] italic">Belum tutup</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setShiftReportToPrint(s)}
                          className="inline-flex items-center gap-1 rounded bg-[#FAF7FC] border border-[#E7DEF0] px-2 py-1 text-[11px] font-semibold text-[#71379B] hover:bg-[#F0E5F7] cursor-pointer"
                        >
                          <Printer className="h-3 w-3" />
                          <span>Cetak</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: PEMBUKUAN & ARUS KAS MITRA                                     */}
      {/* ===================================================================== */}
      {activeTab === 'bookkeeping' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
          {/* Left: Form Catat Kas Operasional & Ringkasan Laba Rugi */}
          <div className="lg:col-span-5 space-y-6">
            <form
              onSubmit={handleAddBookkeeping}
              className="rounded-xl border border-[#E7DEF0] bg-white p-5 space-y-4"
            >
              <div className="pb-3 border-b border-[#E7DEF0]">
                <h2 className="text-base font-bold text-[#24182E]">
                  Catat Pengeluaran / Kas Operasional
                </h2>
                <p className="text-xs text-[#6B5E78]">
                  Input biaya operasional harian gerai (es batu, gula pasir, listrik, gaji) agar laba bersih terhitung akurat.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEntryType('EXPENSE');
                    setEntryCategory('BAHAN_BAKU_LOKAL');
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 px-3 text-xs font-semibold cursor-pointer ${
                    entryType === 'EXPENSE'
                      ? 'border-rose-300 bg-rose-50 text-rose-800'
                      : 'border-[#E7DEF0] bg-[#FAF7FC] text-[#6B5E78]'
                  }`}
                >
                  <ArrowDownRight className="h-4 w-4 text-rose-600" />
                  <span>Kas Keluar (Biaya)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEntryType('INCOME');
                    setEntryCategory('LAINNYA');
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 px-3 text-xs font-semibold cursor-pointer ${
                    entryType === 'INCOME'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-[#E7DEF0] bg-[#FAF7FC] text-[#6B5E78]'
                  }`}
                >
                  <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                  <span>Kas Masuk Tambahan</span>
                </button>
              </div>

              <div>
                <label
                  htmlFor="bkp-category"
                  className="block text-xs font-semibold text-[#24182E] mb-1"
                >
                  Kategori Pembukuan
                </label>
                <select
                  id="bkp-category"
                  value={entryCategory}
                  onChange={(e) => setEntryCategory(e.target.value as BookkeepingCategory)}
                  className="w-full rounded-lg border border-[#E7DEF0] bg-white px-3 py-2 text-xs font-semibold text-[#24182E] focus:border-[#71379B] outline-none"
                >
                  <option value="BAHAN_BAKU_LOKAL">
                    Bahan Baku Lokal (Es Batu Kristal / Gula Pasir / Air)
                  </option>
                  <option value="OPERASIONAL_GERAI">
                    Operasional Gerai (Listrik / Kebersihan / Sewa)
                  </option>
                  <option value="GAJI_KARYAWAN">Gaji / Bonus Penjaga Gerai</option>
                  <option value="LAINNYA">Lainnya</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="bkp-desc"
                  className="block text-xs font-semibold text-[#24182E] mb-1"
                >
                  Keterangan Transaksi Kas
                </label>
                <input
                  id="bkp-desc"
                  type="text"
                  required
                  value={entryDescription}
                  onChange={(e) => setEntryDescription(e.target.value)}
                  placeholder="Contoh: Beli Es Batu Kristal 3 Bal + Gula 4 kg"
                  className="w-full rounded-lg border border-[#E7DEF0] bg-white px-3 py-2 text-xs text-[#24182E] placeholder-[#6B5E78]/60 focus:border-[#71379B] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="bkp-amount"
                    className="block text-xs font-semibold text-[#24182E] mb-1"
                  >
                    Nominal (Rp)
                  </label>
                  <input
                    id="bkp-amount"
                    type="number"
                    required
                    min={500}
                    step={500}
                    value={entryAmount}
                    onChange={(e) => setEntryAmount(e.target.value)}
                    placeholder="Contoh: 75000"
                    className="w-full rounded-lg border border-[#E7DEF0] bg-white px-3 py-2 font-mono text-xs tabular-nums text-[#24182E] focus:border-[#71379B] outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="bkp-method"
                    className="block text-xs font-semibold text-[#24182E] mb-1"
                  >
                    Sumber Dana
                  </label>
                  <select
                    id="bkp-method"
                    value={entryPaymentMethod}
                    onChange={(e) =>
                      setEntryPaymentMethod(e.target.value as PosPaymentMethod)
                    }
                    className="w-full rounded-lg border border-[#E7DEF0] bg-white px-3 py-2 text-xs font-semibold text-[#24182E] focus:border-[#71379B] outline-none"
                  >
                    <option value="TUNAI">Kas Tunai Laci</option>
                    <option value="QRIS">Saldo QRIS</option>
                    <option value="TRANSFER">Rekening Transfer</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingBookkeeping}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#29183B] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#3d2457] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 cursor-pointer"
              >
                <BookOpen className="h-4 w-4 text-[#E3B764]" />
                <span>
                  {submittingBookkeeping
                    ? 'Menyimpan Catatan...'
                    : 'Simpan ke Jurnal Pembukuan'}
                </span>
              </button>
            </form>

            {/* Profit & Loss Statement Card */}
            <div className="rounded-xl border border-[#E7DEF0] bg-white p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#24182E] pb-2 border-b border-[#E7DEF0]">
                Ringkasan Laba Rugi Operasional Gerai
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6B5E78]">1. Omzet Penjualan Kasir POS</span>
                  <span className="font-mono font-semibold tabular-nums text-[#24182E]">
                    {formatRupiah(summary.totalRevenue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B5E78]">2. Estimasi HPP Bahan Baku Cup</span>
                  <span className="font-mono tabular-nums text-rose-700">
                    -{formatRupiah(summary.totalEstimatedCogs)}
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-[#E7DEF0] font-semibold">
                  <span className="text-[#24182E]">Laba Kotor Penjualan (1 - 2)</span>
                  <span className="font-mono tabular-nums text-emerald-700">
                    {formatRupiah(summary.totalGrossProfit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B5E78]">3. Pengeluaran Operasional Gerai</span>
                  <span className="font-mono tabular-nums text-rose-700">
                    -{formatRupiah(summary.totalOperationalExpenses)}
                  </span>
                </div>
                {summary.totalManualIncome > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#6B5E78]">4. Pemasukan Kas Lainnya</span>
                    <span className="font-mono tabular-nums text-emerald-700">
                      +{formatRupiah(summary.totalManualIncome)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2.5 border-t border-[#E7DEF0] text-sm font-bold">
                  <span className="text-[#24182E]">Laba Bersih Operasional</span>
                  <span
                    className={`font-mono tabular-nums ${
                      summary.netOperatingProfit >= 0
                        ? 'text-[#71379B]'
                        : 'text-rose-700'
                    }`}
                  >
                    {formatRupiah(summary.netOperatingProfit)}
                  </span>
                </div>
                <div className="mt-3 rounded-lg bg-[#FAF7FC] border border-[#E7DEF0] p-2.5 flex items-center justify-between text-[11px] text-[#6B5E78]">
                  <span>Total Riwayat Belanja Stok B2B ke HQ:</span>
                  <span className="font-mono font-bold tabular-nums text-[#24182E]">
                    {formatRupiah(summary.totalB2BWholesaleSpend)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: General Ledger / Cashflow Journal Table */}
          <div className="lg:col-span-7 rounded-xl border border-[#E7DEF0] bg-white p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#E7DEF0]">
              <div>
                <h2 className="text-base font-bold text-[#24182E]">
                  Jurnal Pembukuan (Buku Kas Masuk & Keluar)
                </h2>
                <p className="text-xs text-[#6B5E78]">
                  Rekam jejak seluruh penjualan POS otomatis dan pengeluaran operasional gerai
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {(
                  [
                    { id: 'ALL', label: 'Semua' },
                    { id: 'INCOME', label: 'Kas Masuk' },
                    { id: 'EXPENSE', label: 'Kas Keluar' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setJournalFilter(tab.id)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer ${
                      journalFilter === tab.id
                        ? 'bg-[#71379B] text-white'
                        : 'bg-[#FAF7FC] text-[#6B5E78] border border-[#E7DEF0]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7FC] text-[#6B5E78] font-semibold border-b border-[#E7DEF0]">
                  <tr>
                    <th className="py-2.5 px-3">ID & Waktu</th>
                    <th className="py-2.5 px-3">Tipe & Kategori</th>
                    <th className="py-2.5 px-3">Keterangan</th>
                    <th className="py-2.5 px-3">Metode</th>
                    <th className="py-2.5 px-3 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7DEF0]">
                  {filteredJournal.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#6B5E78]">
                        Belum ada catatan pada jurnal pembukuan.
                      </td>
                    </tr>
                  ) : (
                    filteredJournal.map((entry) => (
                      <tr key={entry.id} className="hover:bg-[#FAF7FC]">
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-[#71379B]">
                            {entry.id}
                          </div>
                          <div className="text-[11px] text-[#6B5E78] tabular-nums">
                            {new Date(entry.entryDate).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                              entry.type === 'INCOME'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {entry.type === 'INCOME' ? 'KAS MASUK' : 'KAS KELUAR'}
                          </span>
                          <div className="text-[11px] text-[#6B5E78] mt-0.5">
                            {BOOKKEEPING_CATEGORY_LABELS[entry.category]}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-medium text-[#24182E]">
                          {entry.description}
                        </td>
                        <td className="py-3 px-3">
                          <span className="rounded bg-[#F0E5F7] px-2 py-0.5 text-[10px] font-bold text-[#71379B]">
                            {entry.paymentMethod}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-mono font-bold tabular-nums ${
                            entry.type === 'INCOME'
                              ? 'text-emerald-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {entry.type === 'INCOME' ? '+' : '-'}
                          {formatRupiah(entry.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: BUKA TOKO (OPEN SHIFT)                                       */}
      {/* ===================================================================== */}
      {openShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 no-print">
          <div className="w-full max-w-md rounded-2xl border border-[#E7DEF0] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7DEF0]">
              <div className="flex items-center gap-2">
                <DoorOpen className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-[#24182E]">Buka Toko / Shift Kasir</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpenShiftModal(false)}
                className="rounded-lg p-1 text-[#6B5E78] hover:bg-[#FAF7FC]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleOpenStore} className="space-y-4">
              <div>
                <span className="text-xs text-[#6B5E78]">Gerai yang dibuka:</span>
                <p className="text-sm font-bold text-[#24182E]">{currentOutletName}</p>
              </div>

              <div>
                <label htmlFor="open-cash" className="block text-xs font-semibold text-[#24182E] mb-1">
                  Uang Modal Awal Laci (Kembalian) (Rp)
                </label>
                <input
                  id="open-cash"
                  type="number"
                  min={0}
                  step={10000}
                  required
                  value={initialCashInput}
                  onChange={(e) => setInitialCashInput(e.target.value)}
                  placeholder="Contoh: 100000"
                  className="w-full rounded-lg border border-[#E7DEF0] bg-[#FAF7FC] px-3 py-2 font-mono text-sm font-bold tabular-nums text-[#24182E] focus:border-[#71379B] outline-none"
                />
                <p className="text-[11px] text-[#6B5E78] mt-1">
                  Masukkan jumlah uang pecahan kecil untuk kembalian di awal jam buka.
                </p>
              </div>

              <div>
                <label htmlFor="open-cashier" className="block text-xs font-semibold text-[#24182E] mb-1">
                  Nama Petugas Kasir
                </label>
                <input
                  id="open-cashier"
                  type="text"
                  value={cashierNameInput}
                  onChange={(e) => setCashierNameInput(e.target.value)}
                  placeholder={data.partner.ownerName}
                  className="w-full rounded-lg border border-[#E7DEF0] bg-white px-3 py-2 text-xs text-[#24182E] focus:border-[#71379B] outline-none"
                />
              </div>

              <div>
                <label htmlFor="open-notes" className="block text-xs font-semibold text-[#24182E] mb-1">
                  Catatan Shift Buka (Opsional)
                </label>
                <input
                  id="open-notes"
                  type="text"
                  value={openNotesInput}
                  onChange={(e) => setOpenNotesInput(e.target.value)}
                  placeholder="Contoh: Shift pagi jam 08.00 - 15.00"
                  className="w-full rounded-lg border border-[#E7DEF0] bg-white px-3 py-2 text-xs text-[#24182E] focus:border-[#71379B] outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpenShiftModal(false)}
                  className="rounded-lg border border-[#E7DEF0] px-4 py-2 text-xs font-semibold text-[#6B5E78] hover:bg-[#FAF7FC]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingShift}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                >
                  {submittingShift ? 'Membuka Toko...' : 'Konfirmasi Buka Toko'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: TUTUP TOKO (CLOSE SHIFT & REKONSILIASI)                      */}
      {/* ===================================================================== */}
      {closeShiftModal && currentShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 no-print">
          <div className="w-full max-w-lg rounded-2xl border border-[#E7DEF0] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7DEF0]">
              <div className="flex items-center gap-2">
                <DoorClosed className="h-5 w-5 text-rose-600" />
                <h3 className="text-base font-bold text-[#24182E]">
                  Tutup Toko & Rekonsiliasi Hasil Penjualan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCloseShiftModal(false)}
                className="rounded-lg p-1 text-[#6B5E78] hover:bg-[#FAF7FC]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCloseStore} className="space-y-4">
              {/* Shift Sales Summary Box */}
              <div className="rounded-xl border border-[#E7DEF0] bg-[#FAF7FC] p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6B5E78]">Modal Awal Laci:</span>
                  <span className="font-mono font-bold tabular-nums text-[#24182E]">
                    {formatRupiah(currentShift.initialCash)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B5E78]">Total Penjualan Tunai:</span>
                  <span className="font-mono font-bold tabular-nums text-emerald-700">
                    +{formatRupiah(currentShift.totalSalesCash)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B5E78]">Pengeluaran Kas Laci:</span>
                  <span className="font-mono font-bold tabular-nums text-rose-700">
                    -{formatRupiah(currentShift.totalExpensesCash)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#E7DEF0] font-bold">
                  <span className="text-[#24182E]">Ekspektasi Uang Fisik di Laci:</span>
                  <span className="font-mono tabular-nums text-[#71379B] text-sm">
                    {formatRupiah(currentShift.expectedCashInDrawer)}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#E7DEF0] flex justify-between text-[11px] text-[#6B5E78]">
                  <span>Penjualan QRIS: {formatRupiah(currentShift.totalSalesQris)}</span>
                  <span>Minuman: {currentShift.totalCupsSold} cup ({currentShift.totalTransactionCount} struk)</span>
                </div>
              </div>

              <div>
                <label htmlFor="close-cash" className="block text-xs font-semibold text-[#24182E] mb-1">
                  Hitungan Fisik Uang Tunai di Laci Kasir (Rp)
                </label>
                <input
                  id="close-cash"
                  type="number"
                  min={0}
                  step={1000}
                  required
                  value={actualCashDrawerInput}
                  onChange={(e) => setActualCashDrawerInput(e.target.value)}
                  placeholder={String(currentShift.expectedCashInDrawer)}
                  className="w-full rounded-lg border border-[#E7DEF0] bg-white px-3 py-2 font-mono text-sm font-bold tabular-nums text-[#24182E] focus:border-[#71379B] outline-none"
                />
                {actualCashDrawerInput && (
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-[#6B5E78]">Selisih Kas Fisik vs Sistem:</span>
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        parseInt(actualCashDrawerInput, 10) - currentShift.expectedCashInDrawer === 0
                          ? 'text-emerald-700'
                          : parseInt(actualCashDrawerInput, 10) - currentShift.expectedCashInDrawer > 0
                          ? 'text-blue-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {parseInt(actualCashDrawerInput, 10) - currentShift.expectedCashInDrawer >= 0 ? '+' : ''}
                      {formatRupiah(parseInt(actualCashDrawerInput, 10) - currentShift.expectedCashInDrawer)}
                      {parseInt(actualCashDrawerInput, 10) - currentShift.expectedCashInDrawer === 0
                        ? ' (Uang Pas)'
                        : parseInt(actualCashDrawerInput, 10) - currentShift.expectedCashInDrawer > 0
                        ? ' (Lebih)'
                        : ' (Kurang)'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="close-notes" className="block text-xs font-semibold text-[#24182E] mb-1">
                  Catatan Tutup Toko
                </label>
                <input
                  id="close-notes"
                  type="text"
                  value={closeNotesInput}
                  onChange={(e) => setCloseNotesInput(e.target.value)}
                  placeholder="Contoh: Penjualan lancar, sisa es batu 1 bal"
                  className="w-full rounded-lg border border-[#E7DEF0] bg-white px-3 py-2 text-xs text-[#24182E] focus:border-[#71379B] outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCloseShiftModal(false)}
                  className="rounded-lg border border-[#E7DEF0] px-4 py-2 text-xs font-semibold text-[#6B5E78] hover:bg-[#FAF7FC]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingShift}
                  className="rounded-lg bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                >
                  {submittingShift ? 'Menutup Toko...' : 'Selesaikan Tutup Toko'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: CETAK STRUK KASIR (THERMAL RECEIPT PREVIEW)                  */}
      {/* ===================================================================== */}
      {receiptToPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4 no-print border border-[#E7DEF0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7DEF0]">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-[#71379B]" />
                <h3 className="text-base font-bold text-[#24182E]">Cetak Struk Kasir</h3>
              </div>
              <button
                type="button"
                onClick={() => setReceiptToPrint(null)}
                className="rounded-lg p-1 text-[#6B5E78] hover:bg-[#FAF7FC]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Thermal Print Receipt Template Preview */}
            <div className="rounded-xl border border-gray-300 bg-gray-50 p-4 font-mono text-xs text-gray-900 space-y-2 leading-tight">
              <div className="text-center pb-2 border-b border-dashed border-gray-400">
                <div className="font-bold text-sm tracking-wider">ES TEH MELATEA</div>
                <div className="text-[11px]">{receiptToPrint.outletName}</div>
                <div className="text-[10px] text-gray-600">Surakarta, Jawa Tengah</div>
              </div>

              <div className="text-[11px] space-y-0.5 pt-1">
                <div className="flex justify-between">
                  <span>No: {receiptToPrint.id}</span>
                  <span>{receiptToPrint.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{new Date(receiptToPrint.createdAt).toLocaleDateString('id-ID')}</span>
                  <span>{new Date(receiptToPrint.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="text-gray-600">Kasir: {receiptToPrint.cashierName}</div>
                {receiptToPrint.customerName && (
                  <div className="text-gray-600">Plg: {receiptToPrint.customerName}</div>
                )}
              </div>

              <div className="pt-2 pb-2 border-y border-dashed border-gray-400 space-y-1 text-[11px]">
                {receiptToPrint.items.map((i) => (
                  <div key={i.id} className="space-y-0.5">
                    <div className="font-semibold">{i.menuName}</div>
                    <div className="flex justify-between text-gray-700">
                      <span>{i.quantity} x {formatRupiah(i.unitPrice)}</span>
                      <span>{formatRupiah(i.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-[11px] space-y-1 pt-1 font-semibold">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatRupiah(receiptToPrint.subtotalAmount)}</span>
                </div>
                {receiptToPrint.discountAmount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Diskon:</span>
                    <span>-{formatRupiah(receiptToPrint.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-400">
                  <span>TOTAL:</span>
                  <span>{formatRupiah(receiptToPrint.totalAmount)}</span>
                </div>
                {receiptToPrint.paymentMethod === 'TUNAI' && (
                  <>
                    <div className="flex justify-between font-normal text-gray-600">
                      <span>Bayar:</span>
                      <span>{formatRupiah(receiptToPrint.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between font-normal text-gray-600">
                      <span>Kembali:</span>
                      <span>{formatRupiah(receiptToPrint.changeAmount)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center pt-3 text-[10px] text-gray-600 border-t border-dashed border-gray-400">
                Terima kasih atas kunjungan Anda!<br />
                Follow Instagram: @estehmelatea
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReceiptToPrint(null)}
                className="rounded-lg border border-[#E7DEF0] px-4 py-2 text-xs font-semibold text-[#6B5E78] hover:bg-[#FAF7FC]"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-lg bg-[#71379B] px-5 py-2 text-xs font-bold text-white hover:bg-[#5D2B82] cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Thermal / Kertas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: CETAK REKAP HASIL PENJUALAN SHIFT                            */}
      {/* ===================================================================== */}
      {shiftReportToPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 no-print border border-[#E7DEF0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7DEF0]">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-[#71379B]" />
                <h3 className="text-base font-bold text-[#24182E]">Lembar Rekap Hasil Penjualan Shift</h3>
              </div>
              <button
                type="button"
                onClick={() => setShiftReportToPrint(null)}
                className="rounded-lg p-1 text-[#6B5E78] hover:bg-[#FAF7FC]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Printable Shift Summary Box */}
            <div className="rounded-xl border border-gray-300 bg-gray-50 p-4 font-mono text-xs text-gray-900 space-y-2 leading-tight">
              <div className="text-center pb-2 border-b border-dashed border-gray-400">
                <div className="font-bold text-sm tracking-wider">REKAP HASIL PENJUALAN SHIFT</div>
                <div className="text-[11px] font-semibold">{shiftReportToPrint.outletName}</div>
                <div className="text-[10px] text-gray-600">ID: {shiftReportToPrint.id}</div>
              </div>

              <div className="text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span>Waktu Buka:</span>
                  <span>{new Date(shiftReportToPrint.openedAt).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu Tutup:</span>
                  <span>
                    {shiftReportToPrint.closedAt
                      ? new Date(shiftReportToPrint.closedAt).toLocaleString('id-ID')
                      : 'Belum Tutup'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Petugas Kasir:</span>
                  <span>{shiftReportToPrint.cashierName}</span>
                </div>
              </div>

              <div className="pt-2 pb-2 border-y border-dashed border-gray-400 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Total Cup Terjual:</span>
                  <span className="font-bold">{shiftReportToPrint.totalCupsSold} cup</span>
                </div>
                <div className="flex justify-between">
                  <span>Jumlah Struk Transaksi:</span>
                  <span>{shiftReportToPrint.totalTransactionCount} struk</span>
                </div>
                <div className="flex justify-between">
                  <span>Penjualan Tunai:</span>
                  <span className="font-bold">{formatRupiah(shiftReportToPrint.totalSalesCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Penjualan QRIS:</span>
                  <span className="font-bold">{formatRupiah(shiftReportToPrint.totalSalesQris)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Penjualan Transfer:</span>
                  <span className="font-bold">{formatRupiah(shiftReportToPrint.totalSalesTransfer)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-300 font-bold text-sm">
                  <span>TOTAL OMZET SHIFT:</span>
                  <span className="text-[#71379B]">
                    {formatRupiah(
                      shiftReportToPrint.totalSalesCash +
                        shiftReportToPrint.totalSalesQris +
                        shiftReportToPrint.totalSalesTransfer
                    )}
                  </span>
                </div>
              </div>

              <div className="text-[11px] space-y-1 pt-1 font-semibold">
                <div className="flex justify-between">
                  <span>Modal Awal Laci:</span>
                  <span>{formatRupiah(shiftReportToPrint.initialCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pengeluaran Kas Laci:</span>
                  <span className="text-rose-700">-{formatRupiah(shiftReportToPrint.totalExpensesCash)}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-gray-400">
                  <span>Ekspektasi Kas Laci:</span>
                  <span>{formatRupiah(shiftReportToPrint.expectedCashInDrawer)}</span>
                </div>
                {shiftReportToPrint.actualCashInDrawer !== undefined && (
                  <>
                    <div className="flex justify-between text-[#24182E]">
                      <span>Hitungan Uang Fisik Laci:</span>
                      <span>{formatRupiah(shiftReportToPrint.actualCashInDrawer)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-dashed border-gray-400 font-bold">
                      <span>SELISIH KAS:</span>
                      <span
                        className={
                          (shiftReportToPrint.cashDifference ?? 0) === 0
                            ? 'text-emerald-700'
                            : (shiftReportToPrint.cashDifference ?? 0) > 0
                            ? 'text-blue-700'
                            : 'text-rose-700'
                        }
                      >
                        {(shiftReportToPrint.cashDifference ?? 0) >= 0 ? '+' : ''}
                        {formatRupiah(shiftReportToPrint.cashDifference)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {shiftReportToPrint.notes && (
                <div className="pt-2 text-[10px] text-gray-600 border-t border-dashed border-gray-400">
                  Catatan: {shiftReportToPrint.notes}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShiftReportToPrint(null)}
                className="rounded-lg border border-[#E7DEF0] px-4 py-2 text-xs font-semibold text-[#6B5E78] hover:bg-[#FAF7FC]"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-lg bg-[#71379B] px-5 py-2 text-xs font-bold text-white hover:bg-[#5D2B82] cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Rekap Shift</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* HIDDEN PRINT-ONLY TARGETS (Rendered only on window.print())           */}
      {/* ===================================================================== */}
      {receiptToPrint && (
        <div className="hidden print:block receipt-printable">
          <div style={{ textAlign: 'center', paddingBottom: '6px', borderBottom: '1px dashed #000' }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>ES TEH MELATEA</div>
            <div>{receiptToPrint.outletName}</div>
            <div style={{ fontSize: '10px' }}>Surakarta, Jawa Tengah</div>
          </div>
          <div style={{ margin: '6px 0', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>No: {receiptToPrint.id}</span>
              <span>{receiptToPrint.paymentMethod}</span>
            </div>
            <div>Tgl: {new Date(receiptToPrint.createdAt).toLocaleString('id-ID')}</div>
            <div>Kasir: {receiptToPrint.cashierName}</div>
            {receiptToPrint.customerName && <div>Pelanggan: {receiptToPrint.customerName}</div>}
          </div>
          <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '6px 0' }}>
            {receiptToPrint.items.map((i) => (
              <div key={i.id} style={{ marginBottom: '4px' }}>
                <div style={{ fontWeight: 'bold' }}>{i.menuName}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{i.quantity} x {formatRupiah(i.unitPrice)}</span>
                  <span>{formatRupiah(i.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ margin: '6px 0', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span>{formatRupiah(receiptToPrint.subtotalAmount)}</span>
            </div>
            {receiptToPrint.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Diskon:</span>
                <span>-{formatRupiah(receiptToPrint.discountAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', borderTop: '1px solid #000', paddingTop: '4px', marginTop: '4px' }}>
              <span>TOTAL:</span>
              <span>{formatRupiah(receiptToPrint.totalAmount)}</span>
            </div>
            {receiptToPrint.paymentMethod === 'TUNAI' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Bayar:</span>
                  <span>{formatRupiah(receiptToPrint.amountPaid)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Kembali:</span>
                  <span>{formatRupiah(receiptToPrint.changeAmount)}</span>
                </div>
              </>
            )}
          </div>
          <div style={{ textAlign: 'center', paddingTop: '6px', borderTop: '1px dashed #000', fontSize: '10px' }}>
            Terima kasih atas kunjungan Anda!<br />
            @estehmelatea
          </div>
        </div>
      )}

      {shiftReportToPrint && (
        <div className="hidden print:block receipt-printable">
          <div style={{ textAlign: 'center', paddingBottom: '6px', borderBottom: '1px dashed #000' }}>
            <div style={{ fontWeight: 'bold', fontSize: '13px' }}>REKAP PENJUALAN SHIFT</div>
            <div>{shiftReportToPrint.outletName}</div>
            <div style={{ fontSize: '10px' }}>ID: {shiftReportToPrint.id}</div>
          </div>
          <div style={{ margin: '6px 0', fontSize: '11px' }}>
            <div>Buka: {new Date(shiftReportToPrint.openedAt).toLocaleString('id-ID')}</div>
            <div>Tutup: {shiftReportToPrint.closedAt ? new Date(shiftReportToPrint.closedAt).toLocaleString('id-ID') : 'Masih Buka'}</div>
            <div>Kasir: {shiftReportToPrint.cashierName}</div>
          </div>
          <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '6px 0', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Cup:</span>
              <span>{shiftReportToPrint.totalCupsSold} cup</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Jml Struk:</span>
              <span>{shiftReportToPrint.totalTransactionCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Jual Tunai:</span>
              <span>{formatRupiah(shiftReportToPrint.totalSalesCash)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Jual QRIS:</span>
              <span>{formatRupiah(shiftReportToPrint.totalSalesQris)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: '4px', marginTop: '4px' }}>
              <span>TOTAL OMZET:</span>
              <span>{formatRupiah(shiftReportToPrint.totalSalesCash + shiftReportToPrint.totalSalesQris + shiftReportToPrint.totalSalesTransfer)}</span>
            </div>
          </div>
          <div style={{ margin: '6px 0', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Modal Awal:</span>
              <span>{formatRupiah(shiftReportToPrint.initialCash)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Biaya Kas Laci:</span>
              <span>-{formatRupiah(shiftReportToPrint.totalExpensesCash)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>Ekspektasi Kas Laci:</span>
              <span>{formatRupiah(shiftReportToPrint.expectedCashInDrawer)}</span>
            </div>
            {shiftReportToPrint.actualCashInDrawer !== undefined && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Fisik Kas Laci:</span>
                  <span>{formatRupiah(shiftReportToPrint.actualCashInDrawer)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px dashed #000', paddingTop: '4px', marginTop: '4px' }}>
                  <span>SELISIH KAS:</span>
                  <span>{(shiftReportToPrint.cashDifference ?? 0) >= 0 ? '+' : ''}{formatRupiah(shiftReportToPrint.cashDifference)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
