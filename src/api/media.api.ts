import { api } from '@/lib/fetchClient';
import type { ApiResponse } from '@/types';

export const mediaApi = {
  upload: (file: File): Promise<ApiResponse<{ url: string; publicId: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/media/upload', formData);
  },

  getSignature: (
    folder = 'documents',
    resourceType = 'raw'
  ): Promise<ApiResponse<{ signature: string; timestamp: number; apiKey: string; cloudName: string }>> =>
    api.get(`/media/signature?folder=${folder}&resourceType=${resourceType}`),

  delete: (publicId: string): Promise<ApiResponse<null>> => api.delete('/media', { publicId }),
};
