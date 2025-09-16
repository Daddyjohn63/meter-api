import { createLoader, parseAsInteger, parseAsString } from 'nuqs/server';

// Define all search params configuration in one place
export const searchParamsConfig = {
  search: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10)
};

// Create a loader that can be used in server components
export const loadSearchParams = createLoader(searchParamsConfig);

// TypeScript type for the search params
export type SearchParams = {
  search: string;
  page: number;
  pageSize: number;
};
