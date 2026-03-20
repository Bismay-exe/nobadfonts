import { App } from '@capacitor/app';

const GITHUB_API =
  'https://api.github.com/repos/Bismay-exe/nobadfonts/releases/latest';

export const checkForUpdate = async () => {
  try {
    // 1. Get current app version
    const appInfo = await App.getInfo();
    const currentBuild = Number(appInfo.build);
    console.log('[UpdateCheck] Current Build:', currentBuild);

    // 2. Fetch latest GitHub release
    const res = await fetch(GITHUB_API);
    if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
    
    const data = await res.json();
    console.log('[UpdateCheck] Latest Release Data:', data);

    // Parse version from tag (e.g., "beta-12" -> 12)
    const tagMatch = data.tag_name.match(/beta-(\d+)/);
    const latestBuild = tagMatch ? Number(tagMatch[1]) : 0;
    console.log('[UpdateCheck] Latest Build parsed:', latestBuild);

    // Find the APK asset
    const apkAsset = data.assets?.find((asset: any) => 
      asset.name.endsWith('.apk') || asset.browser_download_url.endsWith('.apk')
    );
    const apkUrl = apkAsset?.browser_download_url;
    console.log('[UpdateCheck] APK URL found:', apkUrl);

    // 3. Compare
    if (latestBuild > currentBuild && apkUrl) {
      return {
        hasUpdate: true,
        latestBuild,
        currentBuild,
        apkUrl,
        releaseNotes: data.body || 'New enhancements and bug fixes.'
      };
    }

    return { hasUpdate: false };

  } catch (err) {
    console.error('[UpdateCheck] Check failed:', err);
    return { hasUpdate: false, error: err };
  }
};
