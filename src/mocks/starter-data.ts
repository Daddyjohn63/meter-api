import { z } from 'zod';
import type { Site, Meter, Reading, Alert } from './model';

// Zod schemas for validation
export const siteSchema = z.object({
  id: z.string().startsWith('s_'),
  name: z.string().min(1),
  postcode: z.string().regex(/^[A-Z0-9]{2,4}\s[A-Z0-9]{3}$/), // UK postcode format
  region: z.string().optional()
});

export const meterSchema = z.object({
  id: z.string().startsWith('m_'),
  siteId: z.string().startsWith('s_'),
  utility: z.enum(['electricity', 'gas', 'water', 'submeter']),
  serial: z.string(),
  hh: z.boolean(),
  mpan: z.string().length(13).optional(), // UK electricity identifier
  mprn: z.string().length(10).optional(), // UK gas identifier
  status: z.enum(['online', 'offline', 'commissioning'])
});

export const readingSchema = z.object({
  meterId: z.string().startsWith('m_'),
  ts: z.coerce.date(), // ISO string in UTC, coerced to Date
  value: z.number(),
  unit: z.literal('kWh')
});

export const alertSchema = z.object({
  id: z.string().startsWith('a_'),
  meterId: z.string().startsWith('m_'),
  siteId: z.string().startsWith('s_'),
  type: z.enum(['missing_data', 'comms_failure', 'consumption_spike']),
  severity: z.enum(['low', 'medium', 'high']),
  openedAt: z.coerce.date(),
  closedAt: z.coerce.date().optional(),
  message: z.string()
});

// 3 sites across different regions
export const starterSites: Site[] = [
  { id: 's_001', name: 'London HQ', postcode: 'EC2A 2DT', region: 'UK-South' },
  {
    id: 's_002',
    name: 'Manchester Store',
    postcode: 'M1 1AE',
    region: 'UK-North'
  },
  {
    id: 's_003',
    name: 'Edinburgh Office',
    postcode: 'EH1 1TH',
    region: 'UK-Scotland'
  }
];

// 5 meters (mix of electricity and gas)
export const starterMeters: Meter[] = [
  {
    id: 'm_e_001',
    siteId: 's_001',
    utility: 'electricity',
    serial: 'ELEC-HQ-01',
    hh: true,
    mpan: '2000056789012',
    status: 'online'
  },
  {
    id: 'm_g_001',
    siteId: 's_001',
    utility: 'gas',
    serial: 'GAS-HQ-01',
    hh: false,
    mprn: '9876543210',
    status: 'online'
  },
  {
    id: 'm_e_002',
    siteId: 's_002',
    utility: 'electricity',
    serial: 'ELEC-MAN-01',
    hh: true,
    mpan: '2000098765432',
    status: 'online'
  },
  {
    id: 'm_e_003',
    siteId: 's_003',
    utility: 'electricity',
    serial: 'ELEC-EDI-01',
    hh: true,
    mpan: '2000012345678',
    status: 'offline'
  },
  {
    id: 'm_g_002',
    siteId: 's_003',
    utility: 'gas',
    serial: 'GAS-EDI-01',
    hh: false,
    mprn: '1234567890',
    status: 'online'
  }
];

// 50 readings across different meters and times
// Note: Using 2025-09-16 as the base date (from environment)
export const starterReadings: Reading[] = [
  // London HQ - Electricity (30 min intervals for one business day)
  ...Array.from({ length: 24 }, (_, i) => ({
    meterId: 'm_e_001',
    ts: new Date(
      Date.UTC(2025, 8, 16, Math.floor(i / 2), (i % 2) * 30)
    ).toISOString(),
    value: 3.5 + (i >= 14 && i <= 36 ? 2 : 0) + Math.random(), // Higher during business hours
    unit: 'kWh' as const
  })),

  // London HQ - Gas (daily readings for a week)
  ...Array.from({ length: 7 }, (_, i) => ({
    meterId: 'm_g_001',
    ts: new Date(Date.UTC(2025, 8, 16 - i)).toISOString(),
    value: 95 + Math.random() * 10, // Daily gas usage with some variation
    unit: 'kWh' as const
  })),

  // Manchester Store - Electricity (busy shopping hours)
  ...Array.from({ length: 12 }, (_, i) => ({
    meterId: 'm_e_002',
    ts: new Date(Date.UTC(2025, 8, 16, 9 + i)).toISOString(), // 9 AM to 9 PM
    value: 5.0 + Math.sin((i * Math.PI) / 6) * 2, // Peak during lunch and evening
    unit: 'kWh' as const
  })),

  // Edinburgh Office - Electricity (showing offline status)
  ...Array.from({ length: 4 }, (_, i) => ({
    meterId: 'm_e_003',
    ts: new Date(Date.UTC(2025, 8, 16, 6 + i)).toISOString(),
    value: 0, // No readings due to offline status
    unit: 'kWh' as const
  })),

  // Edinburgh Office - Gas (daily readings)
  ...Array.from({ length: 3 }, (_, i) => ({
    meterId: 'm_g_002',
    ts: new Date(Date.UTC(2025, 8, 16 - i)).toISOString(),
    value: 75 + Math.random() * 5, // Consistent daily usage
    unit: 'kWh' as const
  }))
];

// Some example alerts
export const starterAlerts: Alert[] = [
  {
    id: 'a_001',
    meterId: 'm_e_003',
    siteId: 's_003',
    type: 'comms_failure',
    severity: 'high',
    openedAt: new Date(Date.UTC(2025, 8, 16, 6, 0)).toISOString(),
    message: 'Meter offline - no communication'
  },
  {
    id: 'a_002',
    meterId: 'm_e_002',
    siteId: 's_002',
    type: 'consumption_spike',
    severity: 'medium',
    openedAt: new Date(Date.UTC(2025, 8, 16, 12, 30)).toISOString(),
    message: 'Unusual consumption pattern detected'
  },
  {
    id: 'a_003',
    meterId: 'm_g_001',
    siteId: 's_001',
    type: 'missing_data',
    severity: 'low',
    openedAt: new Date(Date.UTC(2025, 8, 15, 0, 0)).toISOString(),
    closedAt: new Date(Date.UTC(2025, 8, 15, 6, 0)).toISOString(),
    message: 'Gap in readings - resolved'
  }
];
