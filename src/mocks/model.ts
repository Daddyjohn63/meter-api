// /data/model.ts
// Purpose: shared types + request validation between the API routes and the dummy data.
//
// We use Zod for validating query parameters. You said you like Zod, so let’s keep it idiomatic.

import { z } from 'zod';

// ----- Core domain types -----

// A "utility" is the commodity type the meter measures.
export type Utility = 'electricity' | 'gas' | 'water' | 'submeter';

// A "Site" is a place (building, depot, store). Real apps link this to addresses + portfolios.
export interface Site {
  id: string;
  name: string;
  postcode: string;
  region?: string; // e.g., "UK-South" — useful for grouping / filtering large portfolios.
}

// A "Meter" is a device logging consumption. In the UK, electricity often uses MPAN; gas uses MPRN.
export interface Meter {
  id: string;
  siteId: string; // which site it belongs to
  utility: Utility;
  serial: string; // the meter's serial number (physical device ID)
  hh: boolean; // "half-hourly" (true for most modern electricity meters)
  mpan?: string; // UK electricity identifier
  mprn?: string; // UK gas identifier
  status: 'online' | 'offline' | 'commissioning';
}

// A "Reading" is one time-stamped measurement (e.g., 30-minute kWh).
export interface Reading {
  meterId: string;
  ts: string; // ISO string in UTC — keeps things unambiguous across time zones
  value: number; // quantity of energy consumed in that period
  unit: 'kWh'; // we’ll keep it simple (gas in kWh too for demo)
}

// "Alert" simulates Data-Health style events, e.g. missing data.
export interface Alert {
  id: string;
  meterId: string;
  siteId: string;
  type: 'missing_data' | 'comms_failure' | 'consumption_spike';
  severity: 'low' | 'medium' | 'high';
  openedAt: string; // ISO
  closedAt?: string;
  message: string;
}

// ----- Tariff & Carbon domain -----

// A time-of-use window: if the timestamp falls in this window, apply this unit rate.
export interface TariffWindow {
  // 24h clock strings (local time — we’ll pass a tz in queries; the API itself stores UTC)
  fromHHmm: string; // e.g., "07:00"
  toHHmm: string; // e.g., "19:00"
  // Optionally restrict to weekdays/weekends
  days?: 'weekdays' | 'weekends' | 'all';
  unitRateGBPPerKWh: number; // £/kWh
  label?: string; // "Peak", "Off-peak"
}

// A tariff is a set of windows + a standing charge per day.
// NOTE: Real tariffs can get complex (tiers, bands, DUoS/BSUoS etc.). We keep it simple.
export interface Tariff {
  id: string;
  name: string;
  utility: 'electricity' | 'gas';
  standingChargeGBPPerDay: number;
  windows: TariffWindow[]; // order matters: first match wins
}

// Carbon intensity curve definition. We’ll simulate with simple rules.
export interface CarbonCurveRule {
  fromHHmm: string;
  toHHmm: string;
  days?: 'weekdays' | 'weekends' | 'all';
  gCO2PerKWh: number; // emitted grams CO2e per kWh in this window
  label?: string;
}

export interface CarbonProfile {
  id: string;
  name: string;
  rules: CarbonCurveRule[];
}

// ----- Query schemas for /api/readings and /api/costs -----

// Why these fields?
// - We want to filter the meter set by site/utility/meterId.
// - We want a time window (from/to) and an interval (bucketing): 30m, 1h, 1d.
// - We want to aggregate (sum/avg/min/max) and optionally groupBy (meter/site/utility).
// - tz lets the client say "please interpret HH:MM windows in my timezone" (e.g., Europe/London).

export const baseTimeSeriesQuery = z.object({
  meterId: z.string().optional(), // CSV of meter IDs: "m_1,m_2"
  siteId: z.string().optional(),
  utility: z.enum(['electricity', 'gas', 'water', 'submeter']).optional(),
  from: z.string().datetime().optional(), // ISO string
  to: z.string().datetime().optional(), // ISO string
  interval: z.enum(['30m', '1h', '1d']).default('30m'),
  aggregate: z.enum(['sum', 'avg', 'min', 'max']).default('sum'),
  groupBy: z.enum(['none', 'meter', 'site', 'utility']).default('none'),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(1000).default(500),
  tz: z.string().default('Europe/London')
});

export type BaseTimeSeriesQuery = z.infer<typeof baseTimeSeriesQuery>;

// /api/costs adds tariff + carbon parameters (choose which fake profile to use).
export const costsQuerySchema = baseTimeSeriesQuery.extend({
  tariffId: z.string().default('tou_elec_v1'),
  carbonProfileId: z.string().default('uk_grid_profile_v1')
});
export type CostsQuery = z.infer<typeof costsQuerySchema>;
