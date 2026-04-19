'use client';

import React, { useEffect, useState } from 'react';
import { paymentService, Transaction, Plan } from '@/services/payment.service';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ReceiptText,
} from 'lucide-react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export default function HistoryList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [historyData, plansData] = await Promise.all([
        paymentService.getTransactionHistory(),
        paymentService.getPlans(),
      ]);
      setTransactions(historyData);
      setPlans(plansData);
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      toast.error('Không thể tải lịch sử giao dịch');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanName = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    return plan ? plan.name : 'Gói cước';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50 flex items-center gap-1.5 px-2.5 py-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Thành công
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50 flex items-center gap-1.5 px-2.5 py-1">
            <Clock className="w-3.5 h-3.5" />
            Đang chờ
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/50 flex items-center gap-1.5 px-2.5 py-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Hết hạn
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50 flex items-center gap-1.5 px-2.5 py-1">
            <XCircle className="w-3.5 h-3.5" />
            Thất bại
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
        <ReceiptText className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Chưa có giao dịch thực hiện
        </h3>
        <p className="text-slate-500 dark:text-slate-500 max-w-xs mx-auto mt-1">
          Lịch sử giao dịch của bạn sẽ được hiển thị tại đây sau khi bạn nâng
          cấp gói cước.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
          <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
            <TableHead className="w-[150px] font-bold text-slate-600 dark:text-slate-400">
              Ngày mua
            </TableHead>
            <TableHead className="font-bold text-slate-600 dark:text-slate-400">
              Gói cước
            </TableHead>
            <TableHead className="font-bold text-slate-600 dark:text-slate-400">
              Số tiền
            </TableHead>
            <TableHead className="font-bold text-slate-600 dark:text-slate-400">
              Phương thức
            </TableHead>
            <TableHead className="text-right font-bold text-slate-600 dark:text-slate-400">
              Trạng thái
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow
              key={tx.id}
              className="group hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors border-slate-200 dark:border-slate-800"
            >
              <TableCell className="font-medium text-slate-500 dark:text-slate-500 text-xs">
                {format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm', {
                  locale: vi,
                })}
              </TableCell>
              <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                {getPlanName(tx.plan_id)}
              </TableCell>
              <TableCell className="font-semibold text-slate-800 dark:text-slate-200">
                {formatCurrency(tx.amount || (tx as any).final_amount || 0)}
              </TableCell>
              <TableCell>
                <span className="uppercase text-[9px] font-black tracking-widest text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded bg-white dark:bg-slate-950">
                  {tx.provider || (tx as any).payment_method || 'N/A'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end">
                  {getStatusBadge(tx.status || (tx as any).payment_status)}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
