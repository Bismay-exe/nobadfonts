import { App } from '@capacitor/app';

const GITHUB_API =
  'https://api.github.com/repos/Bismay-exe/nobadfonts/releases/latest';

export const checkForUpdate = async () => {
  try {
    // 1. Get current app version
    const appInfo = await App.getInfo();
    const currentBuild = Number(appInfo.build);

    // 2. Fetch latest GitHub release
    const res = await fetch(GITHUB_API);
    const data = await res.json();

    const latestBuild = Number(
      data.tag_name.replace('beta-', '')
    );

    const apkUrl = data.assets?.[0]?.browser_download_url;

    // 3. Compare
    if (latestBuild > currentBuild) {
      return {
        hasUpdate: true,
        latestBuild,
        apkUrl,
      };
    }

    return { hasUpdate: false };

  } catch (err) {
    console.error('Update check failed:', err);
    return { hasUpdate: false };
  }
};
