'use client';

import { useState, useCallback } from 'react';
import { HashUtils } from '../utils/hash';

interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

interface UseFileHashReturn {
  // Estado
  file: File | null;
  fileInfo: FileInfo | null;
  hash: string | null;
  isHashing: boolean;
  error: string | null;
  
  // Acciones
  processFile: (file: File) => Promise<string | null>;
  reset: () => void;
  clearError: () => void;
}

export function useFileHash(): UseFileHashReturn {
  const [file, setFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (selectedFile: File): Promise<string | null> => {
    setIsHashing(true);
    setError(null);
    setFile(selectedFile);
    
    // Guardar información del archivo
    setFileInfo({
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type || 'application/octet-stream',
      lastModified: selectedFile.lastModified,
    });

    try {
      // Calcular hash SHA-256
      const fileHash = await HashUtils.hashFile(selectedFile);
      setHash(fileHash);
      return fileHash;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to hash file';
      setError(message);
      setHash(null);
      return null;
    } finally {
      setIsHashing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setFile(null);
    setFileInfo(null);
    setHash(null);
    setError(null);
    setIsHashing(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    file,
    fileInfo,
    hash,
    isHashing,
    error,
    processFile,
    reset,
    clearError,
  };
}

export default useFileHash;
