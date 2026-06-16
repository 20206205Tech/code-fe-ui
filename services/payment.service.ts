import { CODE_PAYMENT_SERVICE_NAME } from '@/config/api.constants';
import { USE_MOCK_API } from '@/config/mock.config';
import { apiHelper } from '@/lib/api-helper';
import { executeSWR } from '@/lib/swr-helper';

export interface CreatePlanRequestDto {
  name: string;
  durationMonths: number;
  price: number;
  isActive: boolean;
  features?: string[];
}

// Plan = CreatePlanRequestDto + các field server tự sinh
export interface Plan extends CreatePlanRequestDto {
  id: string;
  createdAt?: string;
}

export interface PurchaseSubscriptionRequestDto {
  plan_id: string;
  redirect_url: string;
}

export interface Transaction {
  id: string;
  plan_id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'expired';
  provider: string;
  payment_url?: string;
  created_at: string;
}

export interface Subscription {
  has_active_subscription: boolean;
  period_start?: string;
  period_end?: string;
}

export const paymentService = {
  getPlans: (
    skip: number = 0,
    limit: number = 10,
    onData?: (data: Plan[]) => void
  ): Promise<Plan[]> => {
    return executeSWR<Plan[]>(
      `swr:plans:${skip}:${limit}`,
      () => {
        if (USE_MOCK_API && process.env.NODE_ENV === 'development') {
          return Promise.resolve([
            {
              id: 'plan-basic-id',
              name: 'VIP 1 Tháng',
              durationMonths: 1,
              price: 99000,
              isActive: true,
              features: [
                'Sử dụng suy luận',
                'Sử dụng voice',
                'Xử lý tài liệu riêng',
              ],
              createdAt: new Date().toISOString(),
            },
            {
              id: 'plan-pro-id',
              name: 'VIP 6 Tháng',
              durationMonths: 6,
              price: 499000,
              isActive: true,
              features: [
                'Sử dụng suy luận',
                'Sử dụng voice',
                'Xử lý tài liệu riêng',
              ],
              createdAt: new Date().toISOString(),
            },
            {
              id: 'plan-vip-id',
              name: 'VIP 12 Tháng',
              durationMonths: 12,
              price: 899000,
              isActive: true,
              features: [
                'Sử dụng suy luận',
                'Sử dụng voice',
                'Xử lý tài liệu riêng',
              ],
              createdAt: new Date().toISOString(),
            },
          ]);
        }
        return apiHelper.get<Plan[]>(`/${CODE_PAYMENT_SERVICE_NAME}/plans`, {
          params: { skip, limit },
        });
      },
      onData
    );
  },

  createPlan: (data: CreatePlanRequestDto): Promise<Plan> => {
    return apiHelper.post<Plan>(`/${CODE_PAYMENT_SERVICE_NAME}/plans`, data);
  },

  deletePlan: (planId: string): Promise<void> => {
    return apiHelper.delete<void>(
      `/${CODE_PAYMENT_SERVICE_NAME}/plans/${planId}`
    );
  },

  purchaseSubscription: (
    data: PurchaseSubscriptionRequestDto
  ): Promise<{ payment_url: string }> => {
    if (USE_MOCK_API && process.env.NODE_ENV === 'development') {
      return Promise.resolve({ payment_url: '#' });
    }
    return apiHelper.post<{ payment_url: string }>(
      `/${CODE_PAYMENT_SERVICE_NAME}/subscriptions/purchase`,
      data
    );
  },

  getMySubscription: (
    onData?: (data: Subscription | null) => void
  ): Promise<Subscription | null> => {
    return executeSWR<Subscription | null>(
      'swr:subscription',
      async () => {
        if (USE_MOCK_API && process.env.NODE_ENV === 'development') {
          return { has_active_subscription: true };
        }

        try {
          return await apiHelper.get<Subscription>(
            `/${CODE_PAYMENT_SERVICE_NAME}/subscriptions`
          );
        } catch (error: any) {
          if (error.message.includes('404')) return null;
          throw error;
        }
      },
      onData
    );
  },

  getTransactionHistory: (
    skip: number = 0,
    limit: number = 10,
    onData?: (data: { items: Transaction[]; total: number }) => void
  ): Promise<{ items: Transaction[]; total: number }> => {
    return executeSWR<{ items: Transaction[]; total: number }>(
      `swr:transaction_history:${skip}:${limit}`,
      async () => {
        if (USE_MOCK_API && process.env.NODE_ENV === 'development') {
          return Promise.resolve({ items: [], total: 0 });
        }
        const response = await apiHelper.get<
          { items: Transaction[]; total: number } | Transaction[]
        >(`/${CODE_PAYMENT_SERVICE_NAME}/subscriptions/history`, {
          params: { skip, limit },
        });
        if (Array.isArray(response)) {
          return { items: response, total: response.length };
        }
        return response;
      },
      onData
    );
  },

  manualActivate: (transactionId: string): Promise<void> => {
    return apiHelper.post<void>(
      `/${CODE_PAYMENT_SERVICE_NAME}/subscriptions/manual-activate/${transactionId}`
    );
  },
};
