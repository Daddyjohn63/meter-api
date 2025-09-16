import { NextResponse } from 'next/server';
import {
  starterReadings,
  starterMeters,
  starterSites
} from '@/mocks/starter-data';
import { z } from 'zod';

const enrichedReadingSchema = z.object({
  meterId: z.string(),
  ts: z.string(),
  value: z.number(),
  unit: z.literal('kWh'),
  meter: z
    .object({
      id: z.string(),
      utility: z.enum(['electricity', 'gas', 'water', 'submeter']),
      status: z.enum(['online', 'offline', 'commissioning'])
    })
    .nullable(),
  site: z
    .object({
      id: z.string(),
      name: z.string(),
      region: z.string().optional()
    })
    .nullable()
});

const paginationSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  totalItems: z.number(),
  totalPages: z.number()
});

const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(enrichedReadingSchema),
  pagination: paginationSchema.optional(),
  error: z.string().optional()
});

export type ApiResponse = z.infer<typeof apiResponseSchema>;
export type EnrichedReading = z.infer<typeof enrichedReadingSchema>;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get('search');
  const search = searchTerm?.toLowerCase() || '';
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10000');
  try {
    const enrichedReadings = starterReadings.map(reading => {
      const meter = starterMeters.find(m => m.id === reading.meterId);
      const site = meter ? starterSites.find(s => s.id === meter.siteId) : null;

      return {
        ...reading,
        meter: meter
          ? {
              id: meter.id,
              utility: meter.utility,
              status: meter.status
            }
          : null,
        site: site
          ? {
              id: site.id,
              name: site.name,
              region: site.region
            }
          : null
      };
    });

    // Filter by site name
    const filteredReadings = !searchTerm
      ? enrichedReadings
      : enrichedReadings.filter(reading =>
          reading.site?.name.toLowerCase().includes(search)
        );

    // Calculate pagination
    const totalItems = filteredReadings.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedReadings = filteredReadings.slice(
      startIndex,
      startIndex + pageSize
    );

    const response = {
      success: true,
      data: paginatedReadings,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages
      }
    };

    // Validate response before sending
    const validated = apiResponseSchema.parse(response);

    return NextResponse.json(validated);
  } catch (error) {
    console.error('Error fetching readings:', error);
    const errorResponse = {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch readings'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
