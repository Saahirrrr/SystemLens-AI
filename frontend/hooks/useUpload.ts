import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SESSION_STORAGE_KEY } from '@/lib/constants';

export interface UploadResponse {
  session_id: string;
  systems_extracted: number;
  message: string;
}

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<UploadResponse | null>(null);
  const router = useRouter();

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    setProgress(0);
    setError(null);
    setSuccessData(null);

    // Simulate progress while uploading
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://127.0.0.1:8000/api/v1/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const data: UploadResponse = await response.json();
      
      setProgress(100);
      clearInterval(progressInterval);
      setSuccessData(data);
      
      // Store session_id in localStorage
      localStorage.setItem(SESSION_STORAGE_KEY, data.session_id);

      // Automatically navigate toward inventory workflow after delay
      setTimeout(() => {
        router.push('/inventory');
      }, 3000);

    } catch (err: unknown) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  }, [router]);

  return {
    isUploading,
    progress,
    error,
    successData,
    uploadFile
  };
}
