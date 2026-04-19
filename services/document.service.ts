import apiClient from '@/lib/api-client';

export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface DocumentInfo {
  id: string;
  filename: string;
  status: DocumentStatus;
  file_url?: string;
  has_file: boolean;
  has_content: boolean;
  has_summary: boolean;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    doc_id: string;
    filename: string;
    status: 'UPLOADED';
  };
}

export interface StatusResponse {
  success: boolean;
  message: string;
  data: DocumentInfo;
}

const DOCUMENT_API_BASE = '/document';

export const documentService = {
  uploadDocument: async (file: File): Promise<UploadResponse['data']> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<UploadResponse>(
      `${DOCUMENT_API_BASE}/documents/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.data;
  },

  getDocumentStatus: async (docId: string): Promise<DocumentInfo> => {
    const response = await apiClient.get<StatusResponse>(
      `${DOCUMENT_API_BASE}/documents/${docId}`
    );
    return response.data.data;
  },
};
