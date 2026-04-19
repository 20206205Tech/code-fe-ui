import apiClient from '@/lib/api-client';

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
  const url = `/data-pipeline-service/api${endpoint}`;

  try {
    const response = await apiClient.get(url, {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const jsonResponse: BaseResponse<T> = response.data;

    // Kiểm tra cờ success từ backend (tuỳ chọn nhưng rất nên làm)
    if (!jsonResponse.success) {
      throw new Error(jsonResponse.message || 'Có lỗi xảy ra từ server');
    }

    // Trả về đúng trường data mà component đang mong đợi
    return jsonResponse.data;
  } catch (error: any) {
    if (error.response) {
      const jsonResponse: BaseResponse<T> = error.response.data;
      throw new Error(
        jsonResponse.message || `API call failed: ${error.message}`
      );
    }
    throw new Error(`API call failed: ${error.message}`);
  }
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
