import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateGeodesicDistanceMeters,
  generateGeodesicCircle,
  getGoogleMapsUrl,
  formatDistanceIndonesian,
} from '../src/lib/geo-utils';
import {
  validateTerritoryLocation,
  DataStore,
} from '../src/lib/data-store';
import {
  createSessionToken,
  verifySessionToken,
} from '../src/lib/auth';

describe('GIS & Geodesic Calculations Test Suite', () => {
  test('1. calculateGeodesicDistanceMeters returns 0 for identical coordinates', () => {
    const dist = calculateGeodesicDistanceMeters(-7.5532, 110.8061, -7.5532, 110.8061);
    assert.equal(dist, 0);
  });

  test('2. calculateGeodesicDistanceMeters accurately calculates distance between Solo Manahan and UMS Pabelan (~3.9 km)', () => {
    // Manahan: -7.5532, 110.8061
    // UMS: -7.5583, 110.7712
    const dist = calculateGeodesicDistanceMeters(-7.5532, 110.8061, -7.5583, 110.7712);
    // Expected distance is approximately 3880m - 3900m
    assert.ok(dist > 3800 && dist < 4000, `Expected ~3880m but got ${dist}m`);
  });

  test('3. generateGeodesicCircle produces valid GeoJSON Polygon with 64 coordinate steps', () => {
    const circle = generateGeodesicCircle(110.8243, -7.5755, 3.0);
    assert.equal(circle.type, 'Feature');
    assert.equal(circle.geometry.type, 'Polygon');
    // 64 steps creates 65 coordinates in closed polygon ring
    assert.equal(circle.geometry.coordinates[0].length, 65);
  });

  test('4. getGoogleMapsUrl generates correct URL format without requiring Google Maps API key', () => {
    const url = getGoogleMapsUrl(-7.5532, 110.8061);
    assert.ok(url.startsWith('https://www.google.com/maps/search/?api=1&query='));
    assert.ok(url.includes('-7.553200'));
    assert.ok(url.includes('110.806100'));
  });

  test('5. formatDistanceIndonesian handles both meters and kilometers correctly', () => {
    assert.equal(formatDistanceIndonesian(450), '450 m');
    assert.equal(formatDistanceIndonesian(2500), '2.50 km');
    assert.equal(formatDistanceIndonesian(3840), '3.84 km');
    assert.equal(formatDistanceIndonesian(null), '-');
  });
});

describe('Territory & Radius Management Test Suite', () => {
  test('6. Location within 2.5 km of an active outlet is flagged as TIDAK_LAYAK (Conflict)', () => {
    // Manahan is at -7.5532, 110.8061
    // Proposed location in Kerten: -7.5550, 110.7950 (~1.2 km from Manahan)
    const result = validateTerritoryLocation(-7.5550, 110.7950, 3.0);
    assert.equal(result.feasibility, 'TIDAK_LAYAK');
    assert.ok(result.conflictingOutlets.length > 0);
    assert.equal(result.conflictingOutlets[0].outlet.id, 'OUT-001'); // Manahan
    assert.ok(result.nearestDistanceMeters! < 2000);
  });

  test('7. Location outside 3.0 km radius from any active outlet is flagged as LAYAK', () => {
    // Alun-alun Sukoharjo: -7.6830, 110.8420 (> 9 km from nearest outlet Solo Baru)
    const result = validateTerritoryLocation(-7.6830, 110.8420, 3.0);
    assert.equal(result.feasibility, 'LAYAK');
    assert.equal(result.conflictingOutlets.length, 0);
    assert.ok(result.nearestDistanceMeters! > 3000);
  });

  test('8. Exactly at or near boundary perimeter is flagged as PERLU_REVIEW or TIDAK_LAYAK', () => {
    // Location at ~2.7 km from Manahan: -7.5289, 110.8061
    const result = validateTerritoryLocation(-7.5289, 110.8061, 3.0);
    assert.ok(
      result.feasibility === 'PERLU_REVIEW' || result.feasibility === 'TIDAK_LAYAK',
      `Expected review/conflict but got ${result.feasibility}`
    );
  });

  test('9. Radius change to 2.5 km resolves borderline cases', () => {
    // Kadipiro utara (-7.5289, 110.8061) is ~2.70 km from Manahan
    // Under 3.0 km radius: conflict.
    // Under 2.5 km radius: distance 2.70 km > 2.5 km => LAYAK!
    const result25 = validateTerritoryLocation(-7.5289, 110.8061, 2.5);
    assert.equal(result25.feasibility, 'LAYAK');
    assert.equal(result25.conflictingOutlets.length, 0);
  });

  test('10. Exclude own outlet prevents partner from conflicting with themselves when editing', () => {
    // Exactly at Manahan's coordinates (-7.5532, 110.8061)
    // When excluding OUT-001, it must not conflict with OUT-001
    const resultWithExclude = validateTerritoryLocation(-7.5532, 110.8061, 3.0, 'OUT-001');
    const hasSelfConflict = resultWithExclude.conflictingOutlets.some((c) => c.outlet.id === 'OUT-001');
    assert.equal(hasSelfConflict, false);
  });
});

describe('B2B Purchase & RFM Performance Analytics Test Suite', () => {
  test('11. Initial franchise kit order is NOT counted as repeat order', () => {
    const orders = DataStore.getPurchasesByPartnerId('PTR-006');
    const firstOrder = orders.find((o) => o.isFirstOrder);
    assert.ok(firstOrder);
    assert.equal(firstOrder.isRepeatOrder, false);
  });

  test('12. Repeat order metrics and lifetime spend calculate accurately', () => {
    const partner = DataStore.getPartnerById('PTR-002'); // Siti Rahmawati
    assert.ok(partner);
    assert.ok(partner.performance);
    assert.ok(partner.performance.totalSpend > 0);
    assert.ok(partner.performance.repeatOrderCount > 0);
    assert.equal(partner.tier, 'UNGGULAN');
  });

  test('13. Application approval atomically converts into new active outlet and partner', () => {
    // Create new application in Sukoharjo Kota (LAYAK, > 9 km away)
    const newApp = DataStore.createApplication({
      applicantName: 'Mitra Sukoharjo Baru',
      applicantPhone: '081234567899',
      proposedOutletName: 'Melatea Outlet Sukoharjo Alun-alun',
      proposedAddress: 'Jl. Jenderal Sudirman No. 1, Sukoharjo',
      latitude: -7.6830,
      longitude: 110.8420,
      minimumRadiusKm: 3.0,
      feasibilityStatus: 'LAYAK',
      conflictingOutletIds: [],
      workflowStatus: 'SUBMITTED',
    });

    const approvalResult = DataStore.approveApplication(newApp.id, 'QA Automated Test');
    assert.equal(approvalResult.success, true);
    assert.equal(approvalResult.application?.workflowStatus, 'APPROVED');

    // Verify new outlet exists in store and is marked ACTIVE
    const outlets = DataStore.getOutlets();
    const createdOutlet = outlets.find((o) => o.name === 'Melatea Outlet Sukoharjo Alun-alun');
    assert.ok(createdOutlet);
    assert.equal(createdOutlet.status, 'ACTIVE');
  });
});

describe('Mitra Authentication, Role & Tenant Isolation Test Suite', () => {
  test('14. Mitra can login using email, phone number, or Partner ID', () => {
    const byEmail = DataStore.authenticateUser('budi.santoso@gmail.com', 'mitra123', 'MITRA');
    assert.equal(byEmail.success, true);
    assert.equal(byEmail.user?.role, 'MITRA');
    assert.equal(byEmail.user?.partnerId, 'PTR-001');

    const byPhone = DataStore.authenticateUser('081226548901', 'mitra123', 'MITRA');
    assert.equal(byPhone.success, true);
    assert.equal(byPhone.user?.partnerId, 'PTR-001');

    const byId = DataStore.authenticateUser('PTR-002', 'mitra123', 'MITRA');
    assert.equal(byId.success, true);
    assert.equal(byId.user?.partnerId, 'PTR-002');
  });

  test('15. Admin HQ login and role mismatch validation', () => {
    const adminAuth = DataStore.authenticateUser('admin@melatea.id', 'admin123', 'ADMIN_HQ');
    assert.equal(adminAuth.success, true);
    assert.equal(adminAuth.user?.role, 'ADMIN_HQ');

    const mismatch = DataStore.authenticateUser('budi.santoso@gmail.com', 'mitra123', 'ADMIN_HQ');
    assert.equal(mismatch.success, false);
  });

  test('16. Session token HMAC-SHA256 signing and tamper verification', () => {
    const auth = DataStore.authenticateUser('PTR-001', 'mitra123', 'MITRA');
    assert.ok(auth.user);
    const token = createSessionToken(auth.user);
    const verified = verifySessionToken(token);
    assert.ok(verified);
    assert.equal(verified.partnerId, 'PTR-001');
    assert.equal(verified.role, 'MITRA');

    // Tampered signature must fail verification
    const tampered = `${token}tamper`;
    assert.equal(verifySessionToken(tampered), null);
  });

  test('17. Mitra dashboard data is strictly isolated to the logged-in partnerId', () => {
    const mitraData = DataStore.getMitraDashboardData('PTR-001');
    assert.ok(mitraData);
    assert.equal(mitraData.partner.id, 'PTR-001');
    assert.ok(mitraData.outlets.every((o) => o.partnerId === 'PTR-001'));
    assert.ok(mitraData.purchases.every((po) => po.partnerId === 'PTR-001'));
  });

  test('18. Mitra repeat order enforces outlet ownership and updates repeatOrderCount', () => {
    // Reject order if outlet belongs to another partner
    const crossTenantAttempt = DataStore.createMitraRepeatOrder('PTR-001', {
      outletId: 'OUT-002', // belongs to PTR-002
      items: [{ sku: 'SKU-TEA-001', quantity: 5 }],
    });
    assert.equal(crossTenantAttempt.success, false);

    // Valid repeat order for own outlet
    const beforeData = DataStore.getMitraDashboardData('PTR-001');
    const prevRepeatCount = beforeData?.partner.performance?.repeatOrderCount || 0;

    const validOrder = DataStore.createMitraRepeatOrder('PTR-001', {
      outletId: 'OUT-001',
      notes: 'Restock teh melati mingguan',
      items: [
        { sku: 'SKU-TEA-001', quantity: 10 },
        { sku: 'SKU-CUP-18', quantity: 1 },
      ],
    });
    assert.equal(validOrder.success, true);
    assert.equal(validOrder.order?.totalAmount, 10 * 65000 + 1 * 425000);

    const afterData = DataStore.getMitraDashboardData('PTR-001');
    assert.equal(afterData?.partner.performance?.repeatOrderCount, prevRepeatCount + 1);
  });

  test('19. Mitra POS checkout calculates gross profit and auto-records bookkeeping income', () => {
    // Reject POS checkout for another partner's outlet
    const invalidOutletPos = DataStore.createPosTransaction('PTR-001', {
      outletId: 'OUT-002', // belongs to PTR-002
      paymentMethod: 'TUNAI',
      items: [{ menuCode: 'MNU-ORI-22', quantity: 2 }],
    });
    assert.equal(invalidOutletPos.success, false);

    // Valid POS checkout for own outlet (OUT-001)
    const beforePos = DataStore.getMitraPosAndBookkeeping('PTR-001', 'OUT-001');
    assert.ok(beforePos);
    const prevRevenue = beforePos.summary.totalRevenue;

    const checkout = DataStore.createPosTransaction('PTR-001', {
      outletId: 'OUT-001',
      customerName: 'Pelanggan Test POS',
      paymentMethod: 'TUNAI',
      discountAmount: 1000,
      amountPaid: 20000,
      items: [
        { menuCode: 'MNU-ORI-22', quantity: 3 }, // 3 * 4000 = 12000 (COGS: 3 * 1750 = 5250)
        { menuCode: 'MNU-TOP-JLY', quantity: 1 }, // 1 * 2000 = 2000 (COGS: 1 * 800 = 800, ADDON so 0 cup)
      ],
    });

    assert.equal(checkout.success, true);
    assert.ok(checkout.transaction);
    assert.equal(checkout.transaction.totalCups, 3);
    assert.equal(checkout.transaction.subtotalAmount, 14000);
    assert.equal(checkout.transaction.totalAmount, 13000);
    assert.equal(checkout.transaction.estimatedCost, 6050);
    assert.equal(checkout.transaction.grossProfit, 6950);
    assert.equal(checkout.transaction.changeAmount, 7000);
    assert.ok(checkout.bookkeepingEntry);
    assert.equal(checkout.bookkeepingEntry.type, 'INCOME');
    assert.equal(checkout.bookkeepingEntry.amount, 13000);

    const afterPos = DataStore.getMitraPosAndBookkeeping('PTR-001', 'OUT-001');
    assert.equal(afterPos?.summary.totalRevenue, prevRevenue + 13000);
  });

  test('20. Mitra bookkeeping entry records operational expenses and updates netOperatingProfit', () => {
    const before = DataStore.getMitraPosAndBookkeeping('PTR-001', 'OUT-001');
    assert.ok(before);
    const prevExpenses = before.summary.totalOperationalExpenses;
    const prevNetProfit = before.summary.netOperatingProfit;

    const expenseResult = DataStore.createBookkeepingEntry('PTR-001', {
      outletId: 'OUT-001',
      type: 'EXPENSE',
      category: 'BAHAN_BAKU_LOKAL',
      description: 'Es Batu Kristal 2 Bal',
      amount: 30000,
      paymentMethod: 'TUNAI',
    });

    assert.equal(expenseResult.success, true);
    const after = DataStore.getMitraPosAndBookkeeping('PTR-001', 'OUT-001');
    assert.equal(after?.summary.totalOperationalExpenses, prevExpenses + 30000);
    assert.equal(after?.summary.netOperatingProfit, prevNetProfit - 30000);
  });

  test('21. Store shift Buka Toko and Tutup Toko accurately calculates sales reconciliation and cash difference', () => {
    // 1. Close active shift first if any
    DataStore.closeStoreShift('PTR-001', {
      outletId: 'OUT-001',
      actualCashInDrawer: 165000,
      notes: 'Closing previous test shift',
    });

    // 2. Open new shift with 200,000 initial cash
    const openRes = DataStore.openStoreShift('PTR-001', {
      outletId: 'OUT-001',
      initialCash: 200000,
      cashierName: 'Budi Kasir Pagi',
      notes: 'Buka toko pagi jam 08.00',
    });
    assert.equal(openRes.success, true);
    assert.ok(openRes.shift);
    assert.equal(openRes.shift.status, 'OPEN');
    assert.equal(openRes.shift.initialCash, 200000);
    assert.equal(openRes.shift.expectedCashInDrawer, 200000);

    // Opening another shift without closing must fail
    const duplicateOpen = DataStore.openStoreShift('PTR-001', {
      outletId: 'OUT-001',
      initialCash: 100000,
    });
    assert.equal(duplicateOpen.success, false);

    // 3. Make cash sale in this shift
    const cashSale = DataStore.createPosTransaction('PTR-001', {
      outletId: 'OUT-001',
      paymentMethod: 'TUNAI',
      amountPaid: 50000,
      items: [{ menuCode: 'MNU-ORI-22', quantity: 10 }], // 10 * 4000 = 40000
    });
    assert.equal(cashSale.success, true);

    // 4. Make QRIS sale in this shift
    const qrisSale = DataStore.createPosTransaction('PTR-001', {
      outletId: 'OUT-001',
      paymentMethod: 'QRIS',
      items: [{ menuCode: 'MNU-MNG-22', quantity: 2 }], // 2 * 7000 = 14000
    });
    assert.equal(qrisSale.success, true);

    // 5. Record cash operational expense in this shift
    const cashExpense = DataStore.createBookkeepingEntry('PTR-001', {
      outletId: 'OUT-001',
      type: 'EXPENSE',
      category: 'BAHAN_BAKU_LOKAL',
      description: 'Es batu shift siang',
      amount: 25000,
      paymentMethod: 'TUNAI',
    });
    assert.equal(cashExpense.success, true);

    // Expected cash in drawer: 200,000 + 40,000 - 25,000 = 215,000
    const state = DataStore.getMitraPosAndBookkeeping('PTR-001', 'OUT-001');
    assert.ok(state?.currentShift);
    assert.equal(state.currentShift.totalSalesCash, 40000);
    assert.equal(state.currentShift.totalSalesQris, 14000);
    assert.equal(state.currentShift.totalExpensesCash, 25000);
    assert.equal(state.currentShift.expectedCashInDrawer, 215000);

    // 6. Close store shift with actual cash 215,000 (0 difference)
    const closeRes = DataStore.closeStoreShift('PTR-001', {
      outletId: 'OUT-001',
      actualCashInDrawer: 215000,
      notes: 'Tutup toko uang pas',
    });
    assert.equal(closeRes.success, true);
    assert.ok(closeRes.shift);
    assert.equal(closeRes.shift.status, 'CLOSED');
    assert.equal(closeRes.shift.cashDifference, 0);

    // Current shift should now be null (store closed)
    const closedState = DataStore.getMitraPosAndBookkeeping('PTR-001', 'OUT-001');
    assert.equal(closedState?.currentShift, null);
  });
});
