import { apiHelper } from '@/lib/api-helper';
import { CODE_DOCUMENT_SERVICE_NAME } from '@/config/api.constants';

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

export const documentService = {
  uploadDocument: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return apiHelper.post<{
      doc_id: string;
      filename: string;
      status: 'UPLOADED';
    }>(`/${CODE_DOCUMENT_SERVICE_NAME}/documents/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getDocumentStatus: (docId: string) => {
    return apiHelper.get<DocumentInfo>(
      `/${CODE_DOCUMENT_SERVICE_NAME}/documents/${docId}`
    );
  },
};
