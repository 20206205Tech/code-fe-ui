import { useState } from 'react';

export function usePagination(initialPageSize = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const setPaginationData = (data: {
    page: number;
    total_pages: number;
    total: number;
  }) => {
    setCurrentPage(data.page);
    setTotalPages(data.total_pages);
    setTotalItems(data.total);
  };

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    setTotalPages,
    totalItems,
    setTotalItems,
    setPaginationData,
  };
}
