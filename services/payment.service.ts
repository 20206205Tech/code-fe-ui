import { CODE_PAYMENT_SERVICE_NAME } from '@/config/api.constants';
import { USE_MOCK_API } from '@/config/mock.config';
import { apiHelper } from '@/lib/api-helper';

export interface Plan {
  id: string;
  name: string;
  durationMonths: number;
  price: number;
  isActive: boolean;
  createdAt?: string;
}

export interface CreatePlanRequestDto {
  name: string;
  durationMonths: number;
  price: number;
  isActive: boolean;
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
  subscription: {
    id: string;
    user_id: string;
    plan_id: string;
    status: 'active' | 'expired' | 'cancelled';
    start_date: string;
    end_date: string;
    created_at: string;
  };
  has_active_subscription: boolean;
  days_remaining: number;
}

export const paymentService = {
  getPlans: (skip: number = 0, limit: number = 10): Promise<Plan[]> => {
    if (USE_MOCK_API && process.env.NODE_ENV === 'development') {
      return Promise.resolve([
        {
          id: 'vip-plan-id',
          name: 'VIP Developer Plan',
          durationMonths: 12,
          price: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    return apiHelper.get<Plan[]>(`/${CODE_PAYMENT_SERVICE_NAME}/plans`, {
      params: { skip, limit },
    });
  },

  getPlanDetail: (planId: string): Promise<Plan> => {
    if (USE_MOCK_API && process.env.NODE_ENV === 'development') {
      return Promise.resolve({
        id: planId,
        name: 'VIP Developer Plan',
        durationMonths: 12,
        price: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      });
    }
    return apiHelper.get<Plan>(`/${CODE_PAYMENT_SERVICE_NAME}/plans/${planId}`);
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

  getMySubscription: async (): Promise<Subscription | null> => {
    if (USE_MOCK_API && process.env.NODE_ENV === 'development') {
      return {
        subscription: {
          id: 'dev-sub-id',
          user_id: 'dev-user-id',
          plan_id: 'vip-plan-id',
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: '2099-12-31T23:59:59Z',
          created_at: new Date().toISOString(),
        },
        has_active_subscription: true,
        days_remaining: 9999,
      };
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

  getTransactionHistory: (
    skip: number = 0,
    limit: number = 10
  ): Promise<Transaction[]> => {
    if (USE_MOCK_API && process.env.NODE_ENV === 'development') {
      return Promise.resolve([]);
    }
    return apiHelper.get<Transaction[]>(
      `/${CODE_PAYMENT_SERVICE_NAME}/subscriptions/history`,
      {
        params: { skip, limit },
      }
    );
  },

  manualActivate: (transactionId: string): Promise<void> => {
    return apiHelper.post<void>(
      `/${CODE_PAYMENT_SERVICE_NAME}/subscriptions/manual-activate/${transactionId}`
    );
  },
};
