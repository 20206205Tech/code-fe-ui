import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TablePaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemName?: string;
}

export function TablePagination({
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  itemName = 'mục',
}: TablePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-2 gap-4">
      <div className="text-sm text-muted-foreground order-2 sm:order-1">
        Hiển thị{' '}
        <span className="font-semibold">
          {(currentPage - 1) * pageSize + 1}
        </span>{' '}
        đến{' '}
        <span className="font-semibold">
          {Math.min(currentPage * pageSize, totalItems)}
        </span>{' '}
        trong tổng số <span className="font-semibold">{totalItems}</span>{' '}
        {itemName}
      </div>
      <div className="flex items-center space-x-2 order-1 sm:order-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="hidden sm:inline-flex"
        >
          Trang đầu
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Trước
        </Button>
        <div className="text-sm font-medium px-2">
          Trang {currentPage} / {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Sau <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="hidden sm:inline-flex"
        >
          Trang cuối
        </Button>
      </div>
    </div>
  );
}
