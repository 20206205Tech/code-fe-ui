import { apiHelper } from '@/lib/api-helper';
import { CODE_PERSONA_SERVICE_NAME } from '@/config/api.constants';

export interface Persona {
  id: string;
  name: string;
  gender?: string;
  voice_id: string;
  description?: string;
  avatar_url?: string;
  greeting_audio_url?: string;
  greeting_text?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePersonaRequestDto {
  name: string;
  gender?: string;
  voice_id: string;
  description?: string;
  avatar_url?: string;
  greeting_audio_url?: string;
  greeting_text?: string;
  is_active: boolean;
}

export interface UpdatePersonaRequestDto {
  name?: string;
  gender?: string;
  voice_id?: string;
  description?: string;
  avatar_url?: string;
  greeting_audio_url?: string;
  greeting_text?: string;
  is_active?: boolean;
}

export interface AdminAudioGenerateRequestDto {
  text: string;
  voice_id?: string;
  speed?: number;
  response_format?: string;
}

export interface PaginatedPersona {
  items: Persona[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export const personaService = {
  getPersonas: (
    page: number = 1,
    size: number = 10,
    voice_id?: string
  ): Promise<PaginatedPersona> => {
    return apiHelper.get<PaginatedPersona>(
      `/${CODE_PERSONA_SERVICE_NAME}/persona/public`,
      {
        params: { page, size, voice_id },
      }
    );
  },

  createPersona: (data: CreatePersonaRequestDto): Promise<Persona> => {
    return apiHelper.post<Persona>(
      `/${CODE_PERSONA_SERVICE_NAME}/persona`,
      data
    );
  },

  updatePersona: (
    id: string,
    data: UpdatePersonaRequestDto
  ): Promise<Persona> => {
    return apiHelper.put<Persona>(
      `/${CODE_PERSONA_SERVICE_NAME}/persona/${id}`,
      data
    );
  },

  deletePersona: (id: string): Promise<void> => {
    return apiHelper.delete<void>(
      `/${CODE_PERSONA_SERVICE_NAME}/persona/${id}`
    );
  },

  uploadAvatar: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiHelper.post<string>(
      `/${CODE_PERSONA_SERVICE_NAME}/persona/upload-avatar`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  uploadAudio: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiHelper.post<string>(
      `/${CODE_PERSONA_SERVICE_NAME}/persona/upload-audio`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  generateAdminAudioPreview: (
    data: AdminAudioGenerateRequestDto
  ): Promise<Blob> => {
    return apiHelper.post<Blob>(
      `/${CODE_PERSONA_SERVICE_NAME}/audio/v1/tts`,
      data,
      {
        responseType: 'blob',
      }
    );
  },
};
