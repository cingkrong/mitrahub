'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MitraDashboardData } from '@/lib/types';
import {
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Package,
  Store,
  FileText,
} from 'lucide-react';

export default function MitraRepeatOrderPage() {
  const router = useRouter();
  const [data, setData] = useState<MitraDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOutletId, setSelectedOutletId] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({
    'SKU-TEA-001': 10,
    'SKU-CUP-18': 1,
  });
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  const refreshDashboard = async () => {
    try {
      const res = await fetch('/api/mitra/dashboard');
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        if (json.data.outlets.length > 0 && !selectedOutletId) {
          setSelectedOutletId(json.data.outlets[0].id);
        }
      }
    } catch {
      setOrderError('Gagal memuat katalog bahan baku.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const res = await fetch('/api/mitra/dashboard');
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
        if (active) setOrderError('Gagal memuat katalog bahan baku.');
      } finally {
        if (active) setLoading(false);
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [router]);

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  const handleAdjustQty = (sku: string, delta: number) => {
    setQuantities((prev) => {
      const next = Math.max(0, (prev[sku] || 0) + delta);
      return { ...prev, [sku]: next };
    });
  };

  const catalog = data?.catalog || [];
  const selectedItems = catalog
    .filter((item) => (quantities[item.sku] || 0) > 0)
    .map((item) => ({
      ...item,
      quantity: quantities[item.sku] || 0,
      subtotal: item.unitPrice * (quantities[item.sku] || 0),
    }));

  const grandTotal = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      setOrderError('Pilih minimal 1 item bahan baku untuk membuat pesanan.');
      return;
    }

    setSubmitting(true);
    setOrderError(null);
    setOrderSuccess(null);

    try {
      const res = await fetch('/api/mitra/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outletId: selectedOutletId,
          notes,
          items: selectedItems.map((i) => ({
            sku: i.sku,
            quantity: i.quantity,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setOrderError(json.error || 'Gagal memproses pesanan repeat order.');
        setSubmitting(false);
        return;
      }

      setOrderSuccess(
        `Pesanan Repeat Order ${json.data.id} senilai ${formatRupiah(
          json.data.totalAmount
        )} berhasil tercatat!`
      );
      setNotes('');
      await refreshDashboard();
    } catch {
      setOrderError('Terjadi gangguan koneksi saat mengirim pesanan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !data) {
    return (
      <DashboardLayout
        title="Repeat Order Bahan Baku B2B"
        subtitle="Memuat katalog bahan baku dan kemasan resmi Es Teh Melatea..."
      >
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#71379B] border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Repeat Order Bahan Baku B2B"
      subtitle={`Pemesanan Grosir Mitra: ${data.partner.ownerName} (${data.partner.id})`}
    >
      {orderSuccess && (
        <div
          role="status"
          className="mb-6 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{orderSuccess}</span>
        </div>
      )}

      {orderError && (
        <div
          role="alert"
          className="mb-6 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800"
        >
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{orderError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Left: Wholesale Catalog List */}
        <div className="lg:col-span-8 rounded-xl border border-[#E7DEF0] bg-white p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E7DEF0]">
            <div>
              <h2 className="text-base font-bold text-[#24182E]">
                Katalog Bahan Baku & Kemasan Resmi HQ
              </h2>
              <p className="text-xs text-[#6B5E78]">
                Harga khusus Mitra Resmi Es Teh Melatea (pengiriman dari Gudang Pusat Surakarta)
              </p>
            </div>
            <span className="rounded bg-[#F0E5F7] px-2.5 py-1 text-xs font-semibold text-[#71379B]">
              {catalog.length} SKU Tersedia
            </span>
          </div>

          <div className="divide-y divide-[#E7DEF0]">
            {catalog.map((product) => {
              const qty = quantities[product.sku] || 0;
              return (
                <div
                  key={product.sku}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-[#71379B] bg-[#F0E5F7] px-1.5 py-0.5 rounded">
                        {product.sku}
                      </span>
                      <span className="text-[10px] font-semibold text-[#6B5E78]">
                        {product.category === 'BAHAN_BAKU' ? 'Bahan Baku' : 'Kemasan Sablon'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#24182E]">{product.name}</h3>
                    <p className="text-xs text-[#6B5E78]">{product.description}</p>
                    <div className="text-xs font-mono font-bold text-[#71379B] tabular-nums pt-0.5">
                      {formatRupiah(product.unitPrice)}{' '}
                      <span className="font-sans font-normal text-[#6B5E78]">
                        / {product.unit}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAdjustQty(product.sku, -1)}
                      aria-label={`Kurangi jumlah ${product.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7DEF0] bg-[#FAF7FC] text-[#24182E] hover:bg-[#F0E5F7] active:scale-95 cursor-pointer"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      aria-label={`Jumlah ${product.name}`}
                      value={qty}
                      onChange={(e) =>
                        setQuantities((prev) => ({
                          ...prev,
                          [product.sku]: Math.max(0, parseInt(e.target.value || '0', 10)),
                        }))
                      }
                      className="w-14 rounded-lg border border-[#E7DEF0] bg-white py-1 text-center font-mono text-xs font-bold tabular-nums text-[#24182E]"
                    />
                    <button
                      type="button"
                      onClick={() => handleAdjustQty(product.sku, 1)}
                      aria-label={`Tambah jumlah ${product.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#71379B] text-white hover:bg-[#5D2B82] active:scale-95 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Order Summary & Checkout Form */}
        <div className="lg:col-span-4">
          <form
            onSubmit={handleSubmitOrder}
            className="rounded-xl border border-[#E7DEF0] bg-white p-5 space-y-4 sticky top-24"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-[#E7DEF0]">
              <ShoppingBag className="h-4.5 w-4.5 text-[#71379B]" />
              <h2 className="text-base font-bold text-[#24182E]">Ringkasan Repeat Order</h2>
            </div>

            <div>
              <label
                htmlFor="order-outlet"
                className="block text-xs font-semibold text-[#24182E] mb-1.5"
              >
                Gerai Tujuan Pengiriman
              </label>
              <div className="relative">
                <Store className="absolute left-3 top-2.5 h-4 w-4 text-[#71379B]" />
                <select
                  id="order-outlet"
                  value={selectedOutletId}
                  onChange={(e) => setSelectedOutletId(e.target.value)}
                  className="w-full rounded-lg border border-[#E7DEF0] bg-white pl-9 pr-3 py-2 text-xs font-semibold text-[#24182E] focus:border-[#71379B] outline-none"
                >
                  {data.outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Items Breakdown */}
            <div className="space-y-2 pt-2 border-t border-[#E7DEF0]">
              <div className="text-xs font-semibold text-[#6B5E78]">
                Item Dipilih ({selectedItems.length})
              </div>
              {selectedItems.length === 0 ? (
                <p className="text-xs text-[#6B5E78] italic py-3">
                  Belum ada item yang dipilih dari katalog.
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedItems.map((item) => (
                    <div
                      key={item.sku}
                      className="flex items-start justify-between gap-2 text-xs bg-[#FAF7FC] rounded-lg p-2.5 border border-[#E7DEF0]"
                    >
                      <div>
                        <div className="font-semibold text-[#24182E]">{item.name}</div>
                        <div className="text-[11px] text-[#6B5E78] font-mono tabular-nums">
                          {item.quantity} x {formatRupiah(item.unitPrice)}
                        </div>
                      </div>
                      <span className="font-mono font-bold tabular-nums text-[#24182E] shrink-0">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="order-notes"
                className="block text-xs font-semibold text-[#24182E] mb-1.5"
              >
                Catatan Pengiriman (Opsional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 h-4 w-4 text-[#6B5E78]" />
                <input
                  id="order-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Kirim pagi sebelum jam 10.00 WIB"
                  className="w-full rounded-lg border border-[#E7DEF0] bg-white pl-9 pr-3 py-2 text-xs text-[#24182E] placeholder-[#6B5E78]/60 focus:border-[#71379B] outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#E7DEF0] flex items-center justify-between">
              <span className="text-xs font-bold text-[#6B5E78]">Total Pembayaran</span>
              <span className="text-lg font-bold font-mono tabular-nums text-[#71379B]">
                {formatRupiah(grandTotal)}
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting || selectedItems.length === 0}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#71379B] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#5D2B82] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 cursor-pointer"
            >
              <Package className="h-4 w-4" />
              <span>{submitting ? 'Memproses PO...' : 'Kirim Pesanan Repeat Order'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Order History Table */}
      <div className="rounded-xl border border-[#E7DEF0] bg-white p-5">
        <h3 className="text-base font-bold text-[#24182E] mb-1">
          Riwayat Purchase Order (PO) Mitra
        </h3>
        <p className="text-xs text-[#6B5E78] mb-4">
          Seluruh transaksi pembelian bahan baku yang tercatat pada akun kemitraan Anda
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7FC] text-[#6B5E78] font-semibold border-b border-[#E7DEF0]">
              <tr>
                <th className="py-2.5 px-3">No. PO</th>
                <th className="py-2.5 px-3">Tanggal Order</th>
                <th className="py-2.5 px-3">Gerai</th>
                <th className="py-2.5 px-3">Tipe Order</th>
                <th className="py-2.5 px-3">Item Pesanan</th>
                <th className="py-2.5 px-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DEF0]">
              {data.purchases.map((po) => (
                <tr key={po.id} className="hover:bg-[#FAF7FC]">
                  <td className="py-3 px-3 font-mono font-bold text-[#71379B]">{po.id}</td>
                  <td className="py-3 px-3 text-[#24182E] tabular-nums">
                    {new Date(po.orderDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3 px-3 font-medium text-[#24182E]">
                    {po.outletName || '-'}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        po.isRepeatOrder
                          ? 'bg-[#F0E5F7] text-[#71379B]'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {po.isRepeatOrder ? 'Repeat Order' : 'Paket Awal'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {po.items.map((item) => (
                      <div key={item.id} className="text-[#24182E]">
                        <span className="font-mono font-semibold">{item.quantity}x</span>{' '}
                        {item.productName}
                      </div>
                    ))}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-[#24182E]">
                    {formatRupiah(po.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
