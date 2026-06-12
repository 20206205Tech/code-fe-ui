import { apiHelper } from '@/lib/api-helper';
import { CODE_PERSONA_SERVICE_NAME } from '@/config/api.constants';
import { executeSWR } from '@/lib/swr-helper';

export interface Persona {
  id: string;
  name: string;
  gender?: string;
  tts_engine?: string;
  voice_uuid: string;
  voice_code: string;
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
  voice_uuid: string;
  description?: string;
  avatar_url?: string;
  greeting_audio_url?: string;
  greeting_text?: string;
  is_active: boolean;
}

export interface UpdatePersonaRequestDto {
  name?: string;
  gender?: string;
  voice_uuid?: string;
  description?: string;
  avatar_url?: string;
  greeting_audio_url?: string;
  greeting_text?: string;
  is_active?: boolean;
}

export interface AdminAudioGenerateRequestDto {
  text: string;
  voice_uuid?: string;
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

export interface TTSEngine {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

export interface TTSVoice {
  voice_uuid: string;
  voice_code: string;
  engine_id: string;
  is_active: boolean;
}

export const personaService = {
  getPersonas: (
    page: number = 1,
    size: number = 10,
    voice_uuid?: string,
    onData?: (data: PaginatedPersona) => void
  ): Promise<PaginatedPersona> => {
    return executeSWR<PaginatedPersona>(
      `swr:personas:${page}:${size}:${voice_uuid || ''}`,
      () =>
        apiHelper.get<PaginatedPersona>(
          `/${CODE_PERSONA_SERVICE_NAME}/public/personas`,
          {
            params: { page, size, voice_uuid },
          }
        ),
      onData
    );
  },

  getPersonaById: (
    id: string,
    onData?: (data: Persona) => void
  ): Promise<Persona> => {
    return executeSWR<Persona>(
      `swr:persona:${id}`,
      () =>
        apiHelper.get<Persona>(
          `/${CODE_PERSONA_SERVICE_NAME}/public/personas/${id}`
        ),
      onData
    );
  },

  createPersona: (data: CreatePersonaRequestDto): Promise<Persona> => {
    return apiHelper.post<Persona>(
      `/${CODE_PERSONA_SERVICE_NAME}/personas`,
      data
    );
  },

  updatePersona: (
    id: string,
    data: UpdatePersonaRequestDto
  ): Promise<Persona> => {
    return apiHelper.put<Persona>(
      `/${CODE_PERSONA_SERVICE_NAME}/personas/${id}`,
      data
    );
  },

  deletePersona: (id: string): Promise<void> => {
    return apiHelper.delete<void>(
      `/${CODE_PERSONA_SERVICE_NAME}/personas/${id}`
    );
  },

  uploadAvatar: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiHelper.post<string>(
      `/${CODE_PERSONA_SERVICE_NAME}/personas/upload-avatar`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  uploadAudio: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiHelper.post<string>(
      `/${CODE_PERSONA_SERVICE_NAME}/personas/upload-audio`,
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

  getEngines: (onData?: (data: TTSEngine[]) => void): Promise<TTSEngine[]> => {
    return executeSWR<TTSEngine[]>(
      'swr:engines',
      () =>
        apiHelper.get<TTSEngine[]>(
          `/${CODE_PERSONA_SERVICE_NAME}/public/engines`
        ),
      onData
    );
  },

  getVoices: (
    engine_code?: string,
    onData?: (data: TTSVoice[]) => void
  ): Promise<TTSVoice[]> => {
    return executeSWR<TTSVoice[]>(
      `swr:voices:${engine_code || ''}`,
      () =>
        apiHelper.get<TTSVoice[]>(
          `/${CODE_PERSONA_SERVICE_NAME}/public/voices`,
          {
            params: { engine_code },
          }
        ),
      onData
    );
  },

  // ENGINES ADMIN CRUD
  getEnginesAdmin: (
    onData?: (data: TTSEngine[]) => void
  ): Promise<TTSEngine[]> => {
    return executeSWR<TTSEngine[]>(
      'swr:engines_admin',
      () => apiHelper.get<TTSEngine[]>(`/${CODE_PERSONA_SERVICE_NAME}/engines`),
      onData
    );
  },
  createEngine: (data: {
    code: string;
    name: string;
    is_active: boolean;
  }): Promise<TTSEngine> => {
    return apiHelper.post<TTSEngine>(
      `/${CODE_PERSONA_SERVICE_NAME}/engines`,
      data
    );
  },
  updateEngine: (
    id: string,
    data: Partial<{ code: string; name: string; is_active: boolean }>
  ): Promise<TTSEngine> => {
    return apiHelper.put<TTSEngine>(
      `/${CODE_PERSONA_SERVICE_NAME}/engines/${id}`,
      data
    );
  },
  deleteEngine: (id: string): Promise<void> => {
    return apiHelper.delete<void>(
      `/${CODE_PERSONA_SERVICE_NAME}/engines/${id}`
    );
  },

  // VOICES ADMIN CRUD
  getVoicesAdmin: (
    engine_code?: string,
    onData?: (data: TTSVoice[]) => void
  ): Promise<TTSVoice[]> => {
    return executeSWR<TTSVoice[]>(
      `swr:voices_admin:${engine_code || ''}`,
      () =>
        apiHelper.get<TTSVoice[]>(`/${CODE_PERSONA_SERVICE_NAME}/voices`, {
          params: { engine_code },
        }),
      onData
    );
  },
  createVoice: (data: {
    voice_code: string;
    engine_id: string;
    is_active: boolean;
  }): Promise<TTSVoice> => {
    return apiHelper.post<TTSVoice>(
      `/${CODE_PERSONA_SERVICE_NAME}/voices`,
      data
    );
  },
  updateVoice: (
    voice_uuid: string,
    data: Partial<{ voice_code: string; engine_id: string; is_active: boolean }>
  ): Promise<TTSVoice> => {
    return apiHelper.put<TTSVoice>(
      `/${CODE_PERSONA_SERVICE_NAME}/voices/${voice_uuid}`,
      data
    );
  },
  deleteVoice: (voice_uuid: string): Promise<void> => {
    return apiHelper.delete<void>(
      `/${CODE_PERSONA_SERVICE_NAME}/voices/${voice_uuid}`
    );
  },
  syncElevenLabs: (): Promise<{
    synced_count: number;
    synced_codes: string[];
  }> => {
    return apiHelper.post<{ synced_count: number; synced_codes: string[] }>(
      `/${CODE_PERSONA_SERVICE_NAME}/voices/sync-elevenlabs`
    );
  },
};
