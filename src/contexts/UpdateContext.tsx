import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { checkForUpdate } from '../utils/updateChecker';
import { installApk } from '../utils/apkInstaller';
import { Toast } from '@capacitor/toast';

interface UpdateInfo {
  latestBuild: string;
  currentBuild: string;
  releaseNotes: string;
  apkUrl: string;
}

interface UpdateContextType {
  hasUpdate: boolean;
  updateInfo: UpdateInfo | null;
  isModalOpen: boolean;
  isDownloading: boolean;
  progress: number;
  openModal: () => void;
  closeModal: () => void;
  startDownload: () => Promise<void>;
  checkUpdate: () => Promise<void>;
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

export const UpdateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const checkUpdate = useCallback(async () => {
    const result = await checkForUpdate();
    if (result.hasUpdate && result.apkUrl) {
      setHasUpdate(true);
      setUpdateInfo({
        latestBuild: String(result.latestBuild),
        currentBuild: String(result.currentBuild),
        releaseNotes: result.releaseNotes || 'New version available.',
        apkUrl: result.apkUrl
      });
      // Automatically open modal on first check if update found (optional, keeping current App.tsx behavior)
      setIsModalOpen(true);
    } else {
      setHasUpdate(false);
      setUpdateInfo(null);
    }
  }, []);

  const startDownload = useCallback(async () => {
    if (!updateInfo?.apkUrl || isDownloading) return;

    try {
      setIsDownloading(true);
      setProgress(0);
      await installApk(updateInfo.apkUrl, (p) => setProgress(p));
    } catch (err) {
      console.error('Update failed:', err);
      Toast.show({
        text: 'Failed to download update. Please try again.',
        duration: 'long'
      });
      setIsDownloading(false);
      setProgress(0);
    }
  }, [updateInfo, isDownloading]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    checkUpdate();
  }, [checkUpdate]);

  return (
    <UpdateContext.Provider
      value={{
        hasUpdate,
        updateInfo,
        isModalOpen,
        isDownloading,
        progress,
        openModal,
        closeModal,
        startDownload,
        checkUpdate
      }}
    >
      {children}
    </UpdateContext.Provider>
  );
};

export const useUpdate = () => {
  const context = useContext(UpdateContext);
  if (context === undefined) {
    throw new Error('useUpdate must be used within an UpdateProvider');
  }
  return context;
};
