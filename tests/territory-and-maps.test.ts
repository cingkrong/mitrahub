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
