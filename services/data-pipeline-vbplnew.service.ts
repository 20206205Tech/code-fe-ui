import { apiHelper } from '@/lib/api-helper';
import { DATA_PIPELINE_VBPLNEW_SERVICE_NAME } from '@/config/api.constants';

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
  getWorkflows: () =>
    apiHelper.get<Workflow[]>(
      `/${DATA_PIPELINE_VBPLNEW_SERVICE_NAME}/workflows`
    ),
  getWorkflowSummary: () =>
    apiHelper.get<WorkflowSummary[]>(
      `/${DATA_PIPELINE_VBPLNEW_SERVICE_NAME}/workflows/summary`
    ),
  getDocumentTotal: () =>
    apiHelper.get<DocumentTotal>(
      `/${DATA_PIPELINE_VBPLNEW_SERVICE_NAME}/documents/total`
    ),
  getDocumentStatus: () =>
    apiHelper.get<DocumentStatus[]>(
      `/${DATA_PIPELINE_VBPLNEW_SERVICE_NAME}/documents/status`
    ),
  getRecentDocuments: (limit = 10) =>
    apiHelper.get<RecentDocument[]>(
      `/${DATA_PIPELINE_VBPLNEW_SERVICE_NAME}/documents/recent`,
      {
        params: { limit },
      }
    ),
  getIssueDates: () =>
    apiHelper.get<IssueDate[]>(
      `/${DATA_PIPELINE_VBPLNEW_SERVICE_NAME}/documents/issue-date`
    ),
  getDocTypes: () =>
    apiHelper.get<DocType[]>(
      `/${DATA_PIPELINE_VBPLNEW_SERVICE_NAME}/documents/doc-types`
    ),
  getEffStatuses: () =>
    apiHelper.get<EffStatus[]>(
      `/${DATA_PIPELINE_VBPLNEW_SERVICE_NAME}/documents/eff-statuses`
    ),
  getMajors: () =>
    apiHelper.get<Major[]>(
      `/${DATA_PIPELINE_VBPLNEW_SERVICE_NAME}/documents/majors`
    ),
};
