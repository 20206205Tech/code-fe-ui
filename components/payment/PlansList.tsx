'use client';

import { Check, CreditCard, Zap } from 'lucide-react';
import { Plan, paymentService } from '@/services/payment.service';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { DEFAULT_FEATURES } from '@/constants/plan.constants';
import { useAuth } from '@/lib/auth-context';
import { format } from 'date-fns';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export default function PlansList() {
  const { subscription } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      await paymentService.getPlans(0, 10, (data) => {
        setPlans(data.filter((p) => p.isActive));
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      toast.error('Không thể tải danh sách gói cước');
      setIsLoading(false);
    }
  };

  const handlePurchase = async (plan: Plan) => {
    try {
      setIsPurchasing(plan.id);
      const response = await paymentService.purchaseSubscription({
        plan_id: plan.id,
        redirect_url: window.location.origin + '/payment/success',
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
      {subscription?.has_active_subscription &&
        subscription.period_start &&
        subscription.period_end && (
          <div className="mb-8 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-850 dark:text-emerald-400 text-sm font-medium flex items-center justify-between shadow-sm max-w-6xl mx-auto">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-500/20" />
              <span>
                Bạn đang sử dụng gói dịch vụ VIP. Thời hạn:{' '}
                <strong>
                  {format(new Date(subscription.period_start), 'dd/MM/yyyy')}
                </strong>{' '}
                đến{' '}
                <strong>
                  {format(new Date(subscription.period_end), 'dd/MM/yyyy')}
                </strong>
              </span>
            </div>
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold border-none px-3 py-1 text-xs">
              Đang hoạt động
            </Badge>
          </div>
        )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const features = plan.features?.length
            ? plan.features
            : DEFAULT_FEATURES;

          return (
            <Card
              key={plan.id}
              className="relative flex flex-col border transition-all duration-300 overflow-hidden border-slate-900 bg-slate-900 text-white shadow-2xl"
            >
              {/* Badge: hiển thị số tháng */}
              <div className="absolute top-4 right-4">
                <Badge className="bg-white text-slate-900 hover:bg-slate-100 border-0 font-bold px-3 py-1 uppercase text-[10px] tracking-tighter">
                  {plan.durationMonths} tháng
                </Badge>
              </div>

              <CardHeader className="pb-2 pt-8 px-8 flex flex-col items-center text-center">
                <CardTitle className="text-lg font-bold uppercase tracking-widest mb-1 text-slate-400">
                  {plan.name}
                </CardTitle>
                <div className="mt-4 flex flex-col items-center">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-black tracking-tighter">
                      {formatCurrency(plan.price).replace('₫', '').trim()}
                    </span>
                    <span className="text-xl font-bold ml-0.5">₫</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-grow px-8 pt-3 pb-6">
                <div className="h-px w-full bg-slate-200 mb-4 opacity-20" />
                <ul className="space-y-5">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-slate-400">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-sm font-medium text-slate-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="px-8 pb-8 pt-0">
                <Button
                  className="w-full text-xs font-bold h-12 uppercase tracking-[0.2em] transition-all duration-300 bg-white text-slate-900 hover:bg-slate-200"
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
