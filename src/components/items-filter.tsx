'use client';

import { parseAsInteger, useQueryState, parseAsString } from 'nuqs';

import { Input } from './ui/input';

export default function ItemsFilter() {
  // const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  // const [pageSize, setPageSize] = useQueryState(
  //   'pageSize',
  //   parseAsInteger.withDefault(10)
  // );
  // const [search, setSearch] = useQueryState(
  //   'search',
  //   parseAsString.withDefault('')
  // );

  const [search, setSearch] = useQueryState('search', {
    ...parseAsString.withDefault(''),
    shallow: false
  });

  return (
    <div className="flex items-center gap-2 w-[300px] mb-4">
      <Input
        placeholder="Search by site name..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
    </div>
  );
}
