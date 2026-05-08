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

const BASE_URL = '/data-pipeline-phapdien';

export const DataPipelinePhapDienService = {
  getChuDe: () => apiHelper.get<ChuDe[]>(`${BASE_URL}/phapdien/chu-de`),
  getDeMuc: () => apiHelper.get<DeMuc[]>(`${BASE_URL}/phapdien/de-muc`),
  getSummary: () =>
    apiHelper.get<PhapDienSummary>(`${BASE_URL}/phapdien/summary`),
};
