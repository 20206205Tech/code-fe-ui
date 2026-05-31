import { SUPABASE_AUTH_SERVICE_NAME } from '@/config/api.constants';
import apiClient from '@/lib/api-client';

export interface MfaFactor {
  id: string;
  friendly_name: string;
  factor_type: 'totp';
  status: 'verified' | 'unverified';
  created_at: string;
  updated_at: string;
}

export interface MfaEnrollResponse {
  id: string;
  type: 'totp';
  totp: {
    qr_code: string;
    secret: string;
    uri: string;
  };
}

export interface MfaChallengeResponse {
  id: string;
  expires_at: number;
}

export interface MfaVerifyResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export interface MfaListResponse {
  all: MfaFactor[];
  active: MfaFactor[];
}

const MFA_BASE_PATH = `/${SUPABASE_AUTH_SERVICE_NAME}/auth/v1/factors`;

export const authMfaService = {
  enrollMFA: async (
    accessToken: string,
    friendlyName: string = 'My Device'
  ): Promise<MfaEnrollResponse> => {
    try {
      const response = await apiClient.post<MfaEnrollResponse>(
        MFA_BASE_PATH,
        {
          factor_type: 'totp',
          issuer: `${process.env.NODE_ENV === 'development' ? 'dev-' : ''}20206205Tech`,
          friendly_name: friendlyName,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
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

  challengeMFA: async (
    factorId: string,
    accessToken: string,
    retries = 3
  ): Promise<MfaChallengeResponse> => {
    const url = `${MFA_BASE_PATH}/${factorId}/challenge`;
    for (let i = 0; i < retries; i++) {
      try {
        const response = await apiClient.post<MfaChallengeResponse>(
          url,
          {},
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        return response.data;
      } catch (error: any) {
        const isNotFound = error.response?.status === 404;
        if (isNotFound && i < retries - 1) {
          console.warn(
            `MFA factor not found, retrying challenge... (${i + 1}/${retries})`
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        console.error(
          'MFA challenge failed:',
          error.response?.data || error.message
        );
        throw error;
      }
    }

    throw new Error('Không thể tạo challenge MFA sau nhiều lần thử');
  },

  verifyMFA: async (
    factorId: string,
    challengeId: string,
    code: string,
    accessToken: string
  ): Promise<MfaVerifyResponse> => {
    try {
      const response = await apiClient.post<MfaVerifyResponse>(
        `${MFA_BASE_PATH}/${factorId}/verify`,
        { challenge_id: challengeId, code },
        { headers: { Authorization: `Bearer ${accessToken}` } }
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

  listFactors: async (accessToken: string): Promise<MfaListResponse> => {
    try {
      const response = await apiClient.get(
        `/${SUPABASE_AUTH_SERVICE_NAME}/auth/v1/user`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
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

  unenrollFactor: async (
    factorId: string,
    accessToken: string
  ): Promise<boolean> => {
    try {
      await apiClient.delete(`${MFA_BASE_PATH}/${factorId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
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
  ): Promise<MfaEnrollResponse> => {
    try {
      const response = await apiClient.put<MfaEnrollResponse>(
        `${MFA_BASE_PATH}/${factorId}`,
        { friendly_name: friendlyName },
        { headers: { Authorization: `Bearer ${accessToken}` } }
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
