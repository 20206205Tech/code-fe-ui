import apiClient from '@/lib/api-client';

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
  provider: string; // e.g. 'vnpay', 'momo', etc.
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
  // Plans
  getPlans: async (skip: number = 0, limit: number = 10): Promise<Plan[]> => {
    const response = await apiClient.get('/payment/plans', {
      params: { skip, limit },
    });
    // Trích xuất data từ wrapper { success, message, data } nếu có,
    // hoặc trả về trực tiếp nếu response.data là mảng
    return Array.isArray(response.data)
      ? response.data
      : response.data.data || [];
  },

  getPlanDetail: async (planId: string): Promise<Plan> => {
    const response = await apiClient.get(`/payment/plans/${planId}`);
    return response.data.data || response.data;
  },

  createPlan: async (data: CreatePlanRequestDto): Promise<Plan> => {
    const response = await apiClient.post('/payment/plans', data);
    return response.data.data || response.data;
  },

  deletePlan: async (planId: string): Promise<void> => {
    await apiClient.delete(`/payment/plans/${planId}`);
  },

  // Subscriptions
  purchaseSubscription: async (
    data: PurchaseSubscriptionRequestDto
  ): Promise<{ payment_url: string }> => {
    const response = await apiClient.post(
      '/payment/subscriptions/purchase',
      data
    );
    return response.data.data || response.data;
  },

  getMySubscription: async (): Promise<Subscription | null> => {
    try {
      const response = await apiClient.get('/payment/subscriptions/me');
      return response.data.data || response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  },

  getTransactionHistory: async (
    skip: number = 0,
    limit: number = 10
  ): Promise<Transaction[]> => {
    const response = await apiClient.get('/payment/subscriptions/history', {
      params: { skip, limit },
    });
    return Array.isArray(response.data)
      ? response.data
      : response.data.data || [];
  },

  manualActivate: async (transactionId: string): Promise<void> => {
    await apiClient.post(
      `/payment/subscriptions/manual-activate/${transactionId}`
    );
  },
};
