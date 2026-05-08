import { apiHelper } from '@/lib/api-helper';
import { DATA_PIPELINE_PHAPDIEN_SERVICE_NAME } from '@/config/api.constants';

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
  getChuDe: () =>
    apiHelper.get<ChuDe[]>(
      `/${DATA_PIPELINE_PHAPDIEN_SERVICE_NAME}/phapdien/chu-de`
    ),
  getDeMuc: () =>
    apiHelper.get<DeMuc[]>(
      `/${DATA_PIPELINE_PHAPDIEN_SERVICE_NAME}/phapdien/de-muc`
    ),
  getSummary: () =>
    apiHelper.get<PhapDienSummary>(
      `/${DATA_PIPELINE_PHAPDIEN_SERVICE_NAME}/phapdien/summary`
    ),
};
