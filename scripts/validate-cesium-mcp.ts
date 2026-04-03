import { test, expect } from '@playwright/test';

// Sample CZML for a short trajectory segment (KSC to Atlantic)
const testCzmlPayload = [
  {
    id: 'document',
    name: 'Artemis II Test Trajectory',
    version: '1.0',
    clock: {
      interval: '2025-09-01T00:00:00Z/2025-09-01T01:00:00Z',
      currentTime: '2025-09-01T00:00:00Z',
      multiplier: 60,
    },
  },
  {
    id: 'orion-test',
    name: 'Orion Test Path',
    position: {
      interpolationAlgorithm: 'HERMITE',
      interpolationDegree: 3,
      referenceFrame: 'FIXED',
      epoch: '2025-09-01T00:00:00Z',
      cartographicDegrees: [
        // time (seconds), lon, lat, alt (meters)
        0, -80.6, 28.6, 0,
        600, -78.0, 29.5, 50000,
        1200, -75.0, 30.5, 150000,
        1800, -72.0, 31.5, 300000,
        2400, -69.0, 32.5, 400000,
        3000, -66.0, 33.0, 500000,
        3600, -63.0, 33.5, 550000,
      ],
    },
    path: {
      material: {
        solidColor: {
          color: { rgba: [255, 255, 255, 200] },
        },
      },
      width: 2,
      leadTime: 0,
      trailTime: 3600,
    },
  },
];

test.describe('Cesium MCP Bridge Validation', () => {
  test('globe initializes with WebGL context', async ({ page }) => {
    await page.goto('/');
    // Wait for CesiumJS to initialize
    await page.waitForFunction(
      () => (window as any).__bridge !== undefined,
      { timeout: 15000 },
    );

    const hasWebGL = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return canvas !== null && canvas.getContext('webgl2') !== null;
    });
    expect(hasWebGL).toBe(true);
  });

  test('setView positions camera at KSC', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(
      () => (window as any).__bridge !== undefined,
      { timeout: 15000 },
    );

    const result = await page.evaluate(() =>
      (window as any).__bridge.execute({
        action: 'setView',
        params: { longitude: -80.6, latitude: 28.6, height: 500000 },
      }),
    );
    expect(result).toBeTruthy();
  });

  test('addPolyline renders trajectory segment', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(
      () => (window as any).__bridge !== undefined,
      { timeout: 15000 },
    );

    const result = await page.evaluate(() =>
      (window as any).__bridge.execute({
        action: 'addPolyline',
        params: {
          coordinates: [
            [-80.6, 28.6, 0],
            [-75.0, 30.0, 200000],
            [-70.0, 32.0, 400000],
          ],
          color: '#FFFFFF',
          width: 2,
        },
      }),
    );
    expect(result).toBeTruthy();
  });

  test('loadCzml loads mission trajectory', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(
      () => (window as any).__bridge !== undefined,
      { timeout: 15000 },
    );

    const result = await page.evaluate(
      (czml) =>
        (window as any).__bridge.execute({
          action: 'loadCzml',
          params: { data: czml },
        }),
      testCzmlPayload,
    );
    expect(result).toBeTruthy();
  });

  test('screenshot captures valid image', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(
      () => (window as any).__bridge !== undefined,
      { timeout: 15000 },
    );

    // Wait for globe tiles to load
    await page.waitForTimeout(3000);
    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot.byteLength).toBeGreaterThan(10000);
  });

  test('setGlobeLighting enables day/night terminator', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(
      () => (window as any).__bridge !== undefined,
      { timeout: 15000 },
    );

    const result = await page.evaluate(() =>
      (window as any).__bridge.execute({
        action: 'setGlobeLighting',
        params: { enableLighting: true },
      }),
    );
    expect(result).toBeTruthy();
  });

  test('getView returns camera state', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(
      () => (window as any).__bridge !== undefined,
      { timeout: 15000 },
    );

    // Set a known view first
    await page.evaluate(() =>
      (window as any).__bridge.execute({
        action: 'setView',
        params: { longitude: -80.6, latitude: 28.6, height: 500000 },
      }),
    );

    const view = await page.evaluate(() =>
      (window as any).__bridge.execute({ action: 'getView', params: {} }),
    );
    expect(view).toBeTruthy();
  });
});
