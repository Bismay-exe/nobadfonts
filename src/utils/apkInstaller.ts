import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import { Capacitor } from '@capacitor/core';

export const installApk = async (
  url: string, 
  onProgress: (progress: number) => void
) => {
  try {
    if (Capacitor.getPlatform() !== 'android') {
      window.open(url, '_system');
      return;
    }

    const fileName = 'update.apk';
    
    // 1. Start download using fetch (for progress tracking)
    const response = await fetch(url);
    if (!response.ok) throw new Error('Download failed');
    
    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    let loaded = 0;

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Could not read response body');

    const chunks: Uint8Array[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      chunks.push(value);
      loaded += value.length;
      
      if (total > 0) {
        onProgress(Math.round((loaded / total) * 100));
      }
    }

    // Combine chunks into a single Blob
    const blob = new Blob(chunks as any, { type: 'application/vnd.android.package-archive' });
    
    // 2. Convert Blob to Base64 (Filesystem requires base64 or string)
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove data:application/...;base64,
      };
      reader.readAsDataURL(blob);
    });

    // 3. Save to local storage
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    // 4. Open the APK
    await FileOpener.openFile({
      path: savedFile.uri,
      mimeType: 'application/vnd.android.package-archive',
    });

  } catch (err) {
    console.error('Install failed:', err);
    throw err;
  }
};
