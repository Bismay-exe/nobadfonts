import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import { ScrollRestoration } from './components/layout/ScrollRestoration';
import { AuthProvider } from './contexts/AuthContext';
import { UploadProvider } from './contexts/UploadContext';
import { ThemeProvider } from './contexts/ThemeContext';
import UploadProgressPopup from './components/UploadProgressPopup';
import { HelmetProvider } from 'react-helmet-async';
import BackHandler from './components/capacitor/BackHandler';

import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar } from "@capacitor/status-bar";
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Dialog } from '@capacitor/dialog';
import { checkForUpdate } from './utils/updateChecker';
import { useEffect } from 'react';

const FontsCatalog = React.lazy(() => import('./pages/FontsCatalog'));
const FontDetails = React.lazy(() => import('./pages/FontDetails'));
const Auth = React.lazy(() => import('./pages/Auth'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Upload = React.lazy(() => import('./pages/Upload'));
const Members = React.lazy(() => import('./pages/Members'));
const MemberDetails = React.lazy(() => import('./pages/MemberDetails'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const FontPairing = React.lazy(() => import('./pages/FontPairing'));
const Cli = React.lazy(() => import('./pages/Cli'));
const DesignerFonts = React.lazy(() => import('./pages/DesignerFonts'));

function App() {
  const location = useLocation();

  useEffect(() => {
    const init = async () => {
      await SplashScreen.hide();
      await StatusBar.hide();
    };

    init();

    // Listen for deep links
    const handleUrlOpen = CapApp.addListener('appUrlOpen', async (data: any) => {
      console.log('App opened with URL:', data.url);
      
      if (data.url.includes('nobadfonts://auth')) {
        // Close the in-app browser
        await Browser.close();
        
        // Use the URL to set the session
        // Supabase will automatically pick up the session if we're on the right page
        // or we can manually parse it if needed.
        // For now, let's just ensure the browser closes.
      }
    });

    return () => {
      handleUrlOpen.then(h => h.remove());
    };
  }, []);

  useEffect(() => {
    const runUpdateCheck = async () => {
      const result = await checkForUpdate();

      if (result.hasUpdate && result.apkUrl) {
        const { value } = await Dialog.confirm({
          title: 'Update Available',
          message: `New version (beta-${result.latestBuild}) available. Update now?`,
        });

        if (value) {
          window.open(result.apkUrl, '_system');
        }
      }
    };

    runUpdateCheck();
  }, []);

  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <UploadProvider>
            <ScrollRestoration />
            <UploadProgressPopup />
            <BackHandler />
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="fonts" element={<FontsCatalog />} />
                  <Route path="fonts/:id" element={<FontDetails />} />
                  <Route path="pairing" element={<FontPairing />} />
                  <Route path="auth" element={<Auth />} />
                  <Route path="upload" element={<Upload />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="members" element={<Members />} />
                  <Route path="members/:id" element={<MemberDetails />} />
                  <Route path="designers/:designerName" element={<DesignerFonts />} />
                  <Route path="admin" element={<AdminDashboard />} />
                  <Route path="cli" element={<Cli />} />
                </Route>
              </Routes>
          </UploadProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
