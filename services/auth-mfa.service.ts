import { SUPABASE_AUTH_SERVICE_NAME } from '@/config/api.constants';
import apiClient from '@/lib/api-client';

// Đường dẫn đã được xác nhận qua brute-force và browser test
const MFA_BASE_PATH = `/${SUPABASE_AUTH_SERVICE_NAME}/auth/v1/factors`;

export const authMfaService = {
  enrollMFA: async (
    accessToken: string,
    friendlyName: string = 'My Device'
  ) => {
    try {
      const response = await apiClient.post(
        MFA_BASE_PATH,
        {
          factor_type: 'totp',
          issuer: `${process.env.NODE_ENV === 'development' ? 'dev-' : ''}20206205Tech`,
          friendly_name: friendlyName,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error(
        'MFA enrollment failed:',
        error.response?.data || error.message
      );
      throw error;
    }
  },

  challengeMFA: async (factorId: string, accessToken: string, retries = 3) => {
    const url = `${MFA_BASE_PATH}/${factorId}/challenge`;
    for (let i = 0; i < retries; i++) {
      try {
        const response = await apiClient.post(
          url,
          {},
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        return response.data;
      } catch (error: any) {
        const isNotFound = error.response?.status === 404;
        if (isNotFound && i < retries - 1) {
          console.warn(
            `MFA factor not found, retrying challenge... (${i + 1}/${retries})`
          );
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Đợi 1 giây trước khi thử lại
          continue;
        }
        console.error(
          'MFA challenge failed:',
          error.response?.data || error.message
        );
        throw error;
      }
    }
  },

  verifyMFA: async (
    factorId: string,
    challengeId: string,
    code: string,
    accessToken: string
  ) => {
    try {
      const url = `${MFA_BASE_PATH}/${factorId}/verify`;
      const response = await apiClient.post(
        url,
        {
          challenge_id: challengeId,
          code,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error(
        'MFA verification failed:',
        error.response?.data || error.message
      );
      throw error;
    }
  },

  listFactors: async (accessToken: string) => {
    const url = `/${SUPABASE_AUTH_SERVICE_NAME}/auth/v1/user`;

    try {
      const response = await apiClient.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const factors = response.data?.factors || [];

      return {
        all: factors,
        active: factors.filter((f: any) => f.status === 'verified'),
      };
    } catch (error: any) {
      console.error(
        'MFA listFactors failed:',
        error.response?.status || error.message
      );
      throw error;
    }
  },

  unenrollFactor: async (factorId: string, accessToken: string) => {
    try {
      await apiClient.delete(`${MFA_BASE_PATH}/${factorId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return true;
    } catch (error: any) {
      console.error(
        'Unenroll MFA factor failed:',
        error.response?.data || error.message
      );
      throw error;
    }
  },

  updateFactor: async (
    factorId: string,
    friendlyName: string,
    accessToken: string
  ) => {
    try {
      const response = await apiClient.put(
        `${MFA_BASE_PATH}/${factorId}`,
        { friendly_name: friendlyName },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error(
        'Update MFA factor failed:',
        error.response?.data || error.message
      );
      throw error;
    }
  },
};
