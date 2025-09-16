'use client';

import { useQueryState } from 'nuqs';
import { searchParamsConfig } from '@/lib/search-params';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from './ui/pagination';

interface ItemsFilterProps {
  totalPages: number;
}

export default function ItemsFilter({ totalPages }: ItemsFilterProps) {
  const [search, setSearch] = useQueryState('search', {
    ...searchParamsConfig.search,
    shallow: false
  });

  const [page, setPage] = useQueryState('page', {
    ...searchParamsConfig.page,
    shallow: false
  });

  const [pageSize, setPageSize] = useQueryState('pageSize', {
    ...searchParamsConfig.pageSize,
    shallow: false
  });

  const pageSizeOptions = [10, 20, 50, 100].map(size => ({
    label: `${size} per page`,
    value: size.toString()
  }));

  return (
    <div className="flex flex-col gap-4 mb-4">
      <div className="flex items-center gap-2">
        <Input
          className="w-[300px]"
          placeholder="Search by site name..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1); // Reset to first page on search
          }}
        />
        <Select
          value={pageSize?.toString()}
          onValueChange={value => setPageSize(parseInt(value))}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Page size" />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => {
                  const currentPage = Number(page) || 1;
                  setPage(Math.max(1, currentPage - 1));
                }}
                className={
                  (page || 1) === 1
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
              />
            </PaginationItem>

            {/* Generate page numbers */}
            {(() => {
              const currentPage = Number(page) || 1;
              const pages = [];
              const showEllipsis = totalPages > 7;

              if (!showEllipsis) {
                // Show all pages if 7 or fewer
                for (let i = 1; i <= totalPages; i++) {
                  pages.push(
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => setPage(i)}
                        isActive={currentPage === i}
                        className="cursor-pointer"
                      >
                        {i}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
              } else {
                // Complex pagination with ellipsis
                if (currentPage <= 4) {
                  // Show first 5 pages, ellipsis, last page
                  for (let i = 1; i <= 5; i++) {
                    pages.push(
                      <PaginationItem key={i}>
                        <PaginationLink
                          onClick={() => setPage(i)}
                          isActive={currentPage === i}
                          className="cursor-pointer"
                        >
                          {i}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  if (totalPages > 6) {
                    pages.push(
                      <PaginationItem key="ellipsis1">
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  if (totalPages > 5) {
                    pages.push(
                      <PaginationItem key={totalPages}>
                        <PaginationLink
                          onClick={() => setPage(totalPages)}
                          className="cursor-pointer"
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                } else if (currentPage >= totalPages - 3) {
                  // Show first page, ellipsis, last 5 pages
                  pages.push(
                    <PaginationItem key={1}>
                      <PaginationLink
                        onClick={() => setPage(1)}
                        className="cursor-pointer"
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                  );
                  if (totalPages > 6) {
                    pages.push(
                      <PaginationItem key="ellipsis1">
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  for (let i = totalPages - 4; i <= totalPages; i++) {
                    pages.push(
                      <PaginationItem key={i}>
                        <PaginationLink
                          onClick={() => setPage(i)}
                          isActive={currentPage === i}
                          className="cursor-pointer"
                        >
                          {i}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                } else {
                  // Show first page, ellipsis, current-1, current, current+1, ellipsis, last page
                  pages.push(
                    <PaginationItem key={1}>
                      <PaginationLink
                        onClick={() => setPage(1)}
                        className="cursor-pointer"
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                  );
                  pages.push(
                    <PaginationItem key="ellipsis1">
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                  for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(
                      <PaginationItem key={i}>
                        <PaginationLink
                          onClick={() => setPage(i)}
                          isActive={currentPage === i}
                          className="cursor-pointer"
                        >
                          {i}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  pages.push(
                    <PaginationItem key="ellipsis2">
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                  pages.push(
                    <PaginationItem key={totalPages}>
                      <PaginationLink
                        onClick={() => setPage(totalPages)}
                        className="cursor-pointer"
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
              }

              return pages;
            })()}

            <PaginationItem>
              <PaginationNext
                onClick={() => {
                  const currentPage = Number(page) || 1;
                  setPage(currentPage + 1);
                }}
                className={
                  (page || 1) === totalPages
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
