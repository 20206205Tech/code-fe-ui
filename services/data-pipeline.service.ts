import { BaseApiUrl } from '@/config/env.config';

export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

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

async function fetchWithAuth<T>(endpoint: string, token: string): Promise<T> {
  const url = `${BaseApiUrl()}/data-pipeline-service/api${endpoint}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  // Parse response theo kiểu BaseResponse<T>
  const jsonResponse: BaseResponse<T> = await response.json();

  // Kiểm tra cờ success từ backend (tuỳ chọn nhưng rất nên làm)
  if (!jsonResponse.success) {
    throw new Error(jsonResponse.message || 'Có lỗi xảy ra từ server');
  }

  // Trả về đúng trường data mà component đang mong đợi
  return jsonResponse.data;
}

export const DataPipelineService = {
  getWorkflows: (token: string) =>
    fetchWithAuth<Workflow[]>('/workflows', token),

  getWorkflowSummary: (token: string) =>
    fetchWithAuth<WorkflowSummary[]>('/workflows/summary', token),

  getDocumentTotal: (token: string) =>
    fetchWithAuth<DocumentTotal>('/documents/total', token),

  getDocumentStatus: (token: string) =>
    fetchWithAuth<DocumentStatus[]>('/documents/status', token),

  getRecentDocuments: (token: string, limit = 10) =>
    fetchWithAuth<RecentDocument[]>(`/documents/recent?limit=${limit}`, token),

  getIssueDates: (token: string) =>
    fetchWithAuth<IssueDate[]>('/documents/issue-date', token),
};
