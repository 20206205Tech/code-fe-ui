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

const BASE_URL = '/data-pipeline-vbplnew';

export const DataPipelineVbplnewService = {
  getWorkflows: () => apiHelper.get<Workflow[]>(`${BASE_URL}/workflows`),
  getWorkflowSummary: () =>
    apiHelper.get<WorkflowSummary[]>(`${BASE_URL}/workflows/summary`),
  getDocumentTotal: () =>
    apiHelper.get<DocumentTotal>(`${BASE_URL}/documents/total`),
  getDocumentStatus: () =>
    apiHelper.get<DocumentStatus[]>(`${BASE_URL}/documents/status`),
  getRecentDocuments: (limit = 10) =>
    apiHelper.get<RecentDocument[]>(`${BASE_URL}/documents/recent`, {
      params: { limit },
    }),
  getIssueDates: () =>
    apiHelper.get<IssueDate[]>(`${BASE_URL}/documents/issue-date`),
  getDocTypes: () =>
    apiHelper.get<DocType[]>(`${BASE_URL}/documents/doc-types`),
  getEffStatuses: () =>
    apiHelper.get<EffStatus[]>(`${BASE_URL}/documents/eff-statuses`),
  getMajors: () => apiHelper.get<Major[]>(`${BASE_URL}/documents/majors`),
};
