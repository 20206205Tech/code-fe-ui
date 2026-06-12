import { apiHelper } from '@/lib/api-helper';
import { CODE_PERSONA_SERVICE_NAME } from '@/config/api.constants';

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
    voice_uuid?: string
  ): Promise<PaginatedPersona> => {
    return apiHelper.get<PaginatedPersona>(
      `/${CODE_PERSONA_SERVICE_NAME}/public/personas`,
      {
        params: { page, size, voice_uuid },
      }
    );
  },

  getPersonaById: (id: string): Promise<Persona> => {
    return apiHelper.get<Persona>(
      `/${CODE_PERSONA_SERVICE_NAME}/public/personas/${id}`
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

  getEngines: (): Promise<TTSEngine[]> => {
    return apiHelper.get<TTSEngine[]>(
      `/${CODE_PERSONA_SERVICE_NAME}/public/engines`
    );
  },

  getVoices: (engine_code?: string): Promise<TTSVoice[]> => {
    return apiHelper.get<TTSVoice[]>(
      `/${CODE_PERSONA_SERVICE_NAME}/public/voices`,
      {
        params: { engine_code },
      }
    );
  },

  // ENGINES ADMIN CRUD
  getEnginesAdmin: (): Promise<TTSEngine[]> => {
    return apiHelper.get<TTSEngine[]>(`/${CODE_PERSONA_SERVICE_NAME}/engines`);
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
  getVoicesAdmin: (engine_code?: string): Promise<TTSVoice[]> => {
    return apiHelper.get<TTSVoice[]>(`/${CODE_PERSONA_SERVICE_NAME}/voices`, {
      params: { engine_code },
    });
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
