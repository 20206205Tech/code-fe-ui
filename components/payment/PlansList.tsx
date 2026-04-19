'use client';

import React, { useEffect, useState } from 'react';
import { Check, CreditCard, Sparkles, Zap } from 'lucide-react';
import { Plan, paymentService } from '@/services/payment.service';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export default function PlansList() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const data = await paymentService.getPlans();
      // Only show active plans for users
      setPlans(data.filter((p) => p.isActive));
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      toast.error('Không thể tải danh sách gói cước');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (plan: Plan) => {
    try {
      setIsPurchasing(plan.id);
      const response = await paymentService.purchaseSubscription({
        plan_id: plan.id,
        // provider: 'vnpay', // Defaulting to VNPay as requested
        provider: 'momo', // Defaulting to VNPay as requested
      });

      if (response.payment_url) {
        toast.success('Đang chuyển hướng đến trang thanh toán...');
        window.location.href = response.payment_url;
      } else {
        throw new Error('Không nhận được link thanh toán');
      }
    } catch (error: any) {
      console.error('Purchase failed:', error);
      toast.error(error.message || 'Thanh toán thất bại, vui lòng thử lại');
    } finally {
      setIsPurchasing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[400px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <CreditCard className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold">Hiện chưa có gói cước nào</h3>
        <p className="text-muted-foreground">Vui lòng quay lại sau</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-0">
      <div className="text-center mb-12">
        <h3 className="text-3xl font-bold tracking-tight sm:text-4xl mb-3 text-slate-900 dark:text-white">
          Nâng cấp tài khoản AI
        </h3>
        <p className="text-base text-slate-500 max-w-xl mx-auto">
          Mở khóa toàn bộ sức mạnh của trợ lý AI với tốc độ xử lý ưu tiên và các
          tính năng độc quyền.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const isStandard = plan.durationMonths === 1;
          const isPro = plan.durationMonths === 12;

          return (
            <Card
              key={plan.id}
              className={cn(
                'relative flex flex-col border transition-all duration-300 overflow-hidden',
                isPro
                  ? 'border-slate-900 bg-slate-900 text-white shadow-2xl scale-[1.02] z-10'
                  : 'border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm hover:shadow-md'
              )}
            >
              {isPro && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-white text-slate-900 hover:bg-slate-100 border-0 font-bold px-3 py-1 uppercase text-[10px] tracking-tighter">
                    Tốt nhất
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4 pt-8 px-8 flex flex-col items-center text-center">
                <CardTitle
                  className={cn(
                    'text-lg font-bold uppercase tracking-widest mb-1',
                    isPro ? 'text-slate-400' : 'text-slate-500'
                  )}
                >
                  {plan.name}
                </CardTitle>
                <div className="mt-4 flex flex-col items-center">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-black tracking-tighter">
                      {formatCurrency(plan.price).replace('₫', '').trim()}
                    </span>
                    <span className="text-xl font-bold ml-0.5">₫</span>
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium mt-1',
                      isPro ? 'text-slate-400' : 'text-slate-500'
                    )}
                  >
                    cho {plan.durationMonths} tháng
                  </span>
                </div>
              </CardHeader>

              <CardContent className="flex-grow px-8 pt-6 pb-8">
                <div className="h-px w-full bg-slate-200 dark:bg-slate-800 mb-8 opacity-20" />
                <ul className="space-y-5">
                  {[
                    'Xử lý nhanh & ưu tiên',
                    'Không giới hạn câu hỏi',
                    // "Hỗ trợ tất cả Models",
                    // "Lưu trữ lịch sử hội thoại"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex items-center justify-center w-5 h-5 rounded-full',
                          isPro
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-slate-100 text-slate-500'
                        )}
                      >
                        <Check className="w-3 h-3" />
                      </div>
                      <span
                        className={cn(
                          'text-sm font-medium',
                          isPro
                            ? 'text-slate-300'
                            : 'text-slate-600 dark:text-slate-400'
                        )}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="px-8 pb-8 pt-0">
                <Button
                  className={cn(
                    'w-full text-xs font-bold h-12 uppercase tracking-[0.2em] transition-all duration-300',
                    isPro
                      ? 'bg-white text-slate-900 hover:bg-slate-200'
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
                  )}
                  onClick={() => handlePurchase(plan)}
                  disabled={isPurchasing !== null}
                >
                  {isPurchasing === plan.id ? (
                    <Zap className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  {isPurchasing === plan.id ? 'Loading...' : 'Nâng cấp ngay'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
