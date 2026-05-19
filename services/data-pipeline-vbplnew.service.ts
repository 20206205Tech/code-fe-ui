import { DATA_PIPELINE_VBPLNEW_SERVICE_NAME } from '@/config/api.constants';
import { USE_MOCK_API } from '@/config/mock.config';
import { apiHelper } from '@/lib/api-helper';

export interface Workflow {
  id: number;
  code: string;
  description: string;
}

export interface WorkflowSummary {
  workflow_id: number;
  code: string;
  total_items: number;
}

export interface DocumentTotal {
  total_count: number;
  update_at: string;
}

export interface DocumentStatus {
  status: string | null;
  count: number;
  oldest_update: string;
  latest_update: string;
}

export interface RecentDocument {
  item_id: number;
  step_code: string;
  completed_at: string;
}

export interface IssueDate {
  year: number;
  count: number;
}

export interface DocType {
  id: string;
  code: string;
  name: string;
  total_count: number;
}

export interface EffStatus {
  id: string;
  code: string;
  name: string;
  total_count: number;
}

export interface Major {
  id: string;
  code: string;
  name: string;
  short_name: string | null;
  total_count: number;
}

export const DataPipelineVbplnewService = {
  getWorkflows: (): Promise<Workflow[]> => {
    if (USE_MOCK_API && process.env.NODE_ENV === 'development') {
      return Promise.resolve([
        { id: 1, code: 'WF001', description: 'Quy trình kiểm duyệt' },
        { id: 2, code: 'WF002', description: 'Quy trình xuất bản' },
      ]);
    }
    return apiHelper.get<Workflow[]>(
      `/${DATA_PIPELINE_VBPLNEW_SERVICE_NAME}/workflows`
    );
  },
  getWorkflowSummary: (): Promise<WorkflowSummary[]> => {
    if (USE_MOCK_API && process.env.NODE_ENV === 'development') {
      return Promise.resolve([
        { workflow_id: 1, code: 'WF001', total_items: 150 },
        { workflow_id: 2, code: 'WF002', total_items: 85 },
      ]);
    }
    return apiHelper.get<WorkflowSummary[]>(
      `/${DATA_PIPELINE_VBPLNEW_SERVICE_NAME}/workflows/summary`
    );
  },
  getDocumentTotal: (): Promise<DocumentTotal> => {
    if (USE_MOCK_API && process.env.NODE_ENV === 'development') {
      return Promise.resolve({
        total_count: 12500,
        update_at: new Date().toISOString(),
      });
    }
    return apiHelper.get<DocumentTotal>(
      `/${DATA_PIPELINE_VBPLNEW_SERVICE_NAME}/documents/total`
    );
  },
  getDocumentStatus: (): Promise<DocumentStatus[]> => {
    if (USE_MOCK_API && process.env.NODE_ENV === 'development') {
      return Promise.resolve([
        {
          status: 'Hoàn thành',
          count: 10000,
          oldest_update: '2023-01-01T00:00:00Z',
          latest_update: new Date().toISOString(),
        },
        {
          status: 'Đang xử lý',
          count: 2500,
          oldest_update: '2023-06-01T00:00:00Z',
          latest_update: new Date().toISOString(),
        },
      ]);
    }
    return apiHelper.get<DocumentStatus[]>(
      `/${DATA_PIPELINE_VBPLNEW_SERVICE_NAME}/documents/status`
    );
  },
  getRecentDocuments: (limit = 10): Promise<RecentDocument[]> => {
    if (USE_MOCK_API && process.env.NODE_ENV === 'development') {
      return Promise.resolve(
        Array.from({ length: limit }).map((_, i) => ({
          item_id: 1000 + i,
          step_code: 'STEP_01',
          completed_at: new Date().toISOString(),
        }))
      );
    }
    return apiHelper.get<RecentDocument[]>(
      `/${DATA_PIPELINE_VBPLNEW_SERVICE_NAME}/documents/recent`,
      {
        params: { limit },
      }
    );
  },
  getIssueDates: (): Promise<IssueDate[]> => {
    if (USE_MOCK_API && process.env.NODE_ENV === 'development') {
      return Promise.resolve([
        { year: 2023, count: 5000 },
        { year: 2022, count: 4500 },
        { year: 2021, count: 3000 },
      ]);
    }
    return apiHelper.get<IssueDate[]>(
      `/${DATA_PIPELINE_VBPLNEW_SERVICE_NAME}/documents/issue-date`
    );
  },
  getDocTypes: (): Promise<DocType[]> => {
    if (USE_MOCK_API && process.env.NODE_ENV === 'development') {
      return Promise.resolve([
        { id: '1', code: 'LUAT', name: 'Luật', total_count: 1000 },
        { id: '2', code: 'NGHIDINH', name: 'Nghị định', total_count: 5000 },
      ]);
    }
    return apiHelper.get<DocType[]>(
      `/${DATA_PIPELINE_VBPLNEW_SERVICE_NAME}/documents/doc-types`
    );
  },
  getEffStatuses: (): Promise<EffStatus[]> => {
    if (USE_MOCK_API && process.env.NODE_ENV === 'development') {
      return Promise.resolve([
        {
          id: '1',
          code: 'CON_HIEU_LUC',
          name: 'Còn hiệu lực',
          total_count: 8000,
        },
        {
          id: '2',
          code: 'HET_HIEU_LUC',
          name: 'Hết hiệu lực',
          total_count: 4500,
        },
      ]);
    }
    return apiHelper.get<EffStatus[]>(
      `/${DATA_PIPELINE_VBPLNEW_SERVICE_NAME}/documents/eff-statuses`
    );
  },
  getMajors: (): Promise<Major[]> => {
    if (USE_MOCK_API) {
      return Promise.resolve([
        {
          id: '1',
          code: 'KINH_TE',
          name: 'Kinh tế',
          short_name: 'KT',
          total_count: 3000,
        },
        {
          id: '2',
          code: 'PHAP_LUAT',
          name: 'Pháp luật',
          short_name: 'PL',
          total_count: 9500,
        },
      ]);
    }
    return apiHelper.get<Major[]>(
      `/${DATA_PIPELINE_VBPLNEW_SERVICE_NAME}/documents/majors`
    );
  },
};
