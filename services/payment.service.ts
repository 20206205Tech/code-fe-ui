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
  provider: string;
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
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'expired' | 'cancelled';
  start_date: string;
  end_date: string;
}

export const paymentService = {
  getPlans: (skip: number = 0, limit: number = 10): Promise<Plan[]> => {
    return apiHelper.get<Plan[]>('/payment/plans', { params: { skip, limit } });
  },

  getPlanDetail: (planId: string): Promise<Plan> => {
    return apiHelper.get<Plan>(`/payment/plans/${planId}`);
  },

  createPlan: (data: CreatePlanRequestDto): Promise<Plan> => {
    return apiHelper.post<Plan>('/payment/plans', data);
  },

  deletePlan: (planId: string): Promise<void> => {
    return apiHelper.delete<void>(`/payment/plans/${planId}`);
  },

  purchaseSubscription: (
    data: PurchaseSubscriptionRequestDto
  ): Promise<{ payment_url: string }> => {
    return apiHelper.post<{ payment_url: string }>(
      '/payment/subscriptions/purchase',
      data
    );
  },

  getMySubscription: async (): Promise<Subscription | null> => {
    try {
      return await apiHelper.get<Subscription>('/payment/subscriptions/me');
    } catch (error: any) {
      if (error.message.includes('404')) return null;
      throw error;
    }
  },

  getTransactionHistory: (
    skip: number = 0,
    limit: number = 10
  ): Promise<Transaction[]> => {
    return apiHelper.get<Transaction[]>('/payment/subscriptions/history', {
      params: { skip, limit },
    });
  },

  manualActivate: (transactionId: string): Promise<void> => {
    return apiHelper.post<void>(
      `/payment/subscriptions/manual-activate/${transactionId}`
    );
  },
};
