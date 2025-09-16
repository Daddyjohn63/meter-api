// /data/dummy.ts
// Purpose: an ultra-small dataset and helper functions that simulate
// - sites/meters
// - alerts
// - time-series generation (electricity HH @ 30m, gas daily in kWh)
// - tariff rules (time-of-use)
// - carbon intensity curves

import type {
  Meter,
  Site,
  Alert,
  Reading,
  Tariff,
  CarbonProfile
} from './model';

// ----- Sites (2 simple sites) -----
export const sites: Site[] = [
  { id: 's_001', name: 'Head Office', postcode: 'W1A 1AA', region: 'UK-South' },
  {
    id: 's_002',
    name: 'Warehouse North',
    postcode: 'M1 2AB',
    region: 'UK-North'
  }
];

// ----- Meters (2x electricity HH, 1x gas) -----
export const meters: Meter[] = [
  {
    id: 'm_e_001',
    siteId: 's_001',
    utility: 'electricity',
    serial: 'ELEC-0001',
    hh: true,
    mpan: '2000012345678',
    status: 'online'
  },
  {
    id: 'm_e_002',
    siteId: 's_002',
    utility: 'electricity',
    serial: 'ELEC-0002',
    hh: true,
    mpan: '2000087654321',
    status: 'online'
  },
  {
    id: 'm_g_001',
    siteId: 's_001',
    utility: 'gas',
    serial: 'GAS-1001',
    hh: false,
    mprn: '1234567890',
    status: 'offline'
  }
];

// ----- Alerts (pretend these were raised by a data-quality job) -----
export const alerts: Alert[] = [
  {
    id: 'a_001',
    meterId: 'm_e_002',
    siteId: 's_002',
    type: 'missing_data',
    severity: 'medium',
    openedAt: new Date(Date.UTC(2025, 8, 12, 7, 0)).toISOString(),
    message: 'No HH reads since 07:00 UTC.'
  },
  {
    id: 'a_002',
    meterId: 'm_g_001',
    siteId: 's_001',
    type: 'comms_failure',
    severity: 'high',
    openedAt: new Date(Date.UTC(2025, 8, 10, 0, 0)).toISOString(),
    message: 'Logger offline > 48h.'
  }
];

// ----- Helper: generate a range of Date objects -----
function range(startUTC: Date, endUTC: Date, stepMinutes: number): Date[] {
  const out: Date[] = [];
  for (let t = +startUTC; t <= +endUTC; t += stepMinutes * 60_000)
    out.push(new Date(t));
  return out;
}

// ----- Synthetic readings: electricity (30m) & gas (daily) -----
// We return each period’s kWh with a bit of pattern so charts don’t look flat.
// Electricity: small diurnal cycle (sin wave) + base-load.
// Gas: daily total in kWh with a weekly bump on certain days.
export function generateReadings(
  meterId: string,
  utility: 'electricity' | 'gas',
  fromISO: string,
  toISO: string
): Reading[] {
  const from = new Date(fromISO);
  const to = new Date(toISO);
  const isElectric = utility === 'electricity';
  const step = isElectric ? 30 : 1440; // minutes

  const points = range(from, to, step);

  return points.map((d, i) => ({
    meterId,
    ts: d.toISOString(), // keep UTC
    value: isElectric
      ? 2.2 +
        Math.sin(i / 5) * 0.6 +
        (d.getUTCHours() >= 7 && d.getUTCHours() < 19 ? 0.8 : 0) // daytime bump
      : 100 + (d.getUTCDay() === 1 ? 15 : 0), // weekly pattern for demo
    unit: 'kWh'
  }));
}

// ----- Tariffs: simple time-of-use (electricity) + flat (gas) -----
// Notes:
// - Real tariffs are complicated: here we define a few windows.
// - First matching window wins.
// - Standing charge is applied per day (we’ll pro-rate per interval later).

export const tariffs: Tariff[] = [
  {
    id: 'tou_elec_v1',
    name: 'TOU Electricity V1',
    utility: 'electricity',
    standingChargeGBPPerDay: 0.4, // £/day
    windows: [
      {
        fromHHmm: '07:00',
        toHHmm: '19:00',
        days: 'weekdays',
        unitRateGBPPerKWh: 0.28,
        label: 'Peak (WD)'
      },
      {
        fromHHmm: '19:00',
        toHHmm: '22:00',
        days: 'all',
        unitRateGBPPerKWh: 0.24,
        label: 'Shoulder'
      },
      {
        fromHHmm: '22:00',
        toHHmm: '07:00',
        days: 'all',
        unitRateGBPPerKWh: 0.18,
        label: 'Off-peak'
      },
      // Weekends cheaper in day:
      {
        fromHHmm: '07:00',
        toHHmm: '19:00',
        days: 'weekends',
        unitRateGBPPerKWh: 0.22,
        label: 'Peak (WE)'
      }
    ]
  },
  {
    id: 'flat_gas_v1',
    name: 'Flat Gas V1',
    utility: 'gas',
    standingChargeGBPPerDay: 0.25,
    windows: [
      {
        fromHHmm: '00:00',
        toHHmm: '24:00',
        days: 'all',
        unitRateGBPPerKWh: 0.07,
        label: 'Flat'
      }
    ]
  }
];

// ----- Carbon profile: pretend UK grid intensity curve -----
// Assumptions (purely for demo):
// - Weekday daylight is dirtier (more demand).
// - Overnight is cleaner.
// - Weekends somewhat cleaner mid-day (more wind + less demand).

export const carbonProfiles: CarbonProfile[] = [
  {
    id: 'uk_grid_profile_v1',
    name: 'UK Grid Profile (Demo)',
    rules: [
      {
        fromHHmm: '00:00',
        toHHmm: '06:00',
        days: 'all',
        gCO2PerKWh: 180,
        label: 'Overnight'
      },
      {
        fromHHmm: '06:00',
        toHHmm: '09:00',
        days: 'weekdays',
        gCO2PerKWh: 320,
        label: 'WD AM Peak'
      },
      {
        fromHHmm: '09:00',
        toHHmm: '16:00',
        days: 'weekdays',
        gCO2PerKWh: 280,
        label: 'WD Day'
      },
      {
        fromHHmm: '16:00',
        toHHmm: '19:00',
        days: 'weekdays',
        gCO2PerKWh: 350,
        label: 'WD PM Peak'
      },
      {
        fromHHmm: '19:00',
        toHHmm: '23:00',
        days: 'weekdays',
        gCO2PerKWh: 240,
        label: 'WD Evening'
      },
      {
        fromHHmm: '06:00',
        toHHmm: '23:00',
        days: 'weekends',
        gCO2PerKWh: 220,
        label: 'WE Day'
      },
      {
        fromHHmm: '23:00',
        toHHmm: '24:00',
        days: 'all',
        gCO2PerKWh: 190,
        label: 'Late Night'
      }
    ]
  }
];

// ----- Utility functions for time window matching (local time logic) -----

// Convert a UTC Date to local time components in the client's tz.
// In a real service you’d use a TZ library. Here we’ll do a best-effort using Intl APIs.
export function getLocalYMDAndHM(dUTC: Date, tz: string) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(dUTC).map(p => [p.type, p.value])
  );
  const yyyy = parseInt(parts.year, 10);
  const mm = parseInt(parts.month, 10);
  const dd = parseInt(parts.day, 10);
  const HH = parseInt(parts.hour, 10);
  const MM = parseInt(parts.minute, 10);

  // weekday in that tz (0=Sun..6=Sat) via hack: rebuild Date with that tz offset lost — good enough for demo.
  // For a serious system, use a library like luxon/dayjs-timezone.
  const localStr = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00`;
  const local = new Date(localStr);
  const weekday = local.getDay();

  return { yyyy, mm, dd, HH, MM, weekday };
}

function hhmmToMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function dayMatches(
  ruleDays: 'weekdays' | 'weekends' | 'all' | undefined,
  weekday: number
) {
  if (!ruleDays || ruleDays === 'all') return true;
  const isWeekend = weekday === 0 || weekday === 6;
  return ruleDays === 'weekends' ? isWeekend : !isWeekend;
}

// Return unit rate £/kWh for a timestamp under a tariff.
export function unitRateFor(tsISO: string, tz: string, tariff: Tariff): number {
  const d = new Date(tsISO);
  const { HH, MM, weekday } = getLocalYMDAndHM(d, tz);
  const minutes = HH * 60 + MM;

  for (const w of tariff.windows) {
    const from = hhmmToMinutes(w.fromHHmm);
    const to = hhmmToMinutes(w.toHHmm);
    if (!dayMatches(w.days, weekday)) continue;

    // Handle windows that wrap past midnight, e.g. 22:00 -> 07:00
    const inWindow =
      from <= to
        ? minutes >= from && minutes < to
        : minutes >= from || minutes < to;

    if (inWindow) return w.unitRateGBPPerKWh;
  }
  // Fallback: if nothing matched (shouldn’t happen if windows cover 24h)
  return tariff.windows[tariff.windows.length - 1].unitRateGBPPerKWh;
}

// Return carbon intensity (gCO2/kWh) for a timestamp under a profile.
export function carbonFor(
  tsISO: string,
  tz: string,
  profile: CarbonProfile
): number {
  const d = new Date(tsISO);
  const { HH, MM, weekday } = getLocalYMDAndHM(d, tz);
  const minutes = HH * 60 + MM;

  for (const r of profile.rules) {
    const from = hhmmToMinutes(r.fromHHmm);
    const to = hhmmToMinutes(r.toHHmm);
    if (!dayMatches(r.days, weekday)) continue;

    const inWindow =
      from <= to
        ? minutes >= from && minutes < to
        : minutes >= from || minutes < to;

    if (inWindow) return r.gCO2PerKWh;
  }
  return profile.rules[profile.rules.length - 1].gCO2PerKWh;
}
