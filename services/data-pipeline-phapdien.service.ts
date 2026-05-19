import { DATA_PIPELINE_PHAPDIEN_SERVICE_NAME } from '@/config/api.constants';
import { USE_MOCK_API } from '@/config/mock.config';
import { apiHelper } from '@/lib/api-helper';

export interface ChuDe {
  value: string;
  text: string;
  stt: string;
}

export interface DeMuc {
  value: string;
  text: string;
  chu_de: string;
  stt: string;
}

export interface PhapDienSummary {
  total_chu_de: number;
  total_de_muc: number;
  total_tree_items: number;
}

export const DataPipelinePhapDienService = {
  getChuDe: (): Promise<ChuDe[]> => {
    if (USE_MOCK_API && process.env.NODE_ENV === 'development') {
      return Promise.resolve([
        { value: '1', text: 'Chủ đề 1', stt: '1' },
        { value: '2', text: 'Chủ đề 2', stt: '2' },
      ]);
    }
    return apiHelper.get<ChuDe[]>(
      `/${DATA_PIPELINE_PHAPDIEN_SERVICE_NAME}/phapdien/chu-de`
    );
  },
  getDeMuc: (): Promise<DeMuc[]> => {
    if (USE_MOCK_API && process.env.NODE_ENV === 'development') {
      return Promise.resolve([
        { value: '101', text: 'Đề mục 1.1', chu_de: '1', stt: '1' },
        { value: '102', text: 'Đề mục 1.2', chu_de: '1', stt: '2' },
      ]);
    }
    return apiHelper.get<DeMuc[]>(
      `/${DATA_PIPELINE_PHAPDIEN_SERVICE_NAME}/phapdien/de-muc`
    );
  },
  getSummary: (): Promise<PhapDienSummary> => {
    if (USE_MOCK_API && process.env.NODE_ENV === 'development') {
      return Promise.resolve({
        total_chu_de: 15,
        total_de_muc: 120,
        total_tree_items: 2500,
      });
    }
    return apiHelper.get<PhapDienSummary>(
      `/${DATA_PIPELINE_PHAPDIEN_SERVICE_NAME}/phapdien/summary`
    );
  },
};
