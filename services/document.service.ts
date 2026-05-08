import { apiHelper } from '@/lib/api-helper';

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

const DOCUMENT_API_BASE = '/document';

export const documentService = {
  uploadDocument: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return apiHelper.post<{
      doc_id: string;
      filename: string;
      status: 'UPLOADED';
    }>(`${DOCUMENT_API_BASE}/documents/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getDocumentStatus: (docId: string) => {
    return apiHelper.get<DocumentInfo>(
      `${DOCUMENT_API_BASE}/documents/${docId}`
    );
  },
};
