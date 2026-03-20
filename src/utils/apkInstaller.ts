import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import { FileTransfer } from '@capacitor/file-transfer';
import { Capacitor } from '@capacitor/core';

export const installApk = async (
  url: string, 
  onProgress: (progress: number) => void
) => {
  let progressListener: any = null;
  
  try {
    if (Capacitor.getPlatform() !== 'android') {
      window.open(url, '_system');
      return;
    }

    const fileName = 'update.apk';
    
    // 1. Get full path for the download
    const { uri } = await Filesystem.getUri({
      path: fileName,
      directory: Directory.Data
    });

    // 2. Setup progress listener on the plugin instance
    progressListener = await FileTransfer.addListener('progress', (data: any) => {
      // Filter by URL to ensure we track the correct download
      if (data.url === url && data.contentLength > 0) {
        const progress = Math.round((data.bytes / data.contentLength) * 100);
        onProgress(progress);
      }
    });

    // 3. Execute download
    const result = await FileTransfer.downloadFile({
      url: url,
      path: uri,
      progress: true
    });

    if (!result.path) {
      throw new Error('Download failed: No path returned');
    }

    console.log('[UpdateCheck] Download finished:', result.path);

    // 3. Open the APK
    await FileOpener.openFile({
      path: result.path,
      mimeType: 'application/vnd.android.package-archive',
    });

  } catch (err) {
    console.error('[UpdateCheck] Install failed:', err);
    throw err;
  } finally {
    if (progressListener) {
      try {
        await progressListener.remove();
      } catch (e) {
        console.warn('[UpdateCheck] Failed to remove progress listener:', e);
      }
    }
  }
};
