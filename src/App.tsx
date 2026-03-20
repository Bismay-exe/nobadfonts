import React, { useEffect } from 'react';
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
import { supabase } from './lib/supabase';

import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar } from "@capacitor/status-bar";
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { UpdateModal } from './components/modals/UpdateModal';
import { UpdateProvider } from './contexts/UpdateContext';

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

function AppContent() {
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
        // Extract tokens from the URL hash
        // The URL looks like: nobadfonts://auth#access_token=...&refresh_token=...
        const url = new URL(data.url.replace('#', '?'));
        const accessToken = url.searchParams.get('access_token');
        const refreshToken = url.searchParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) {
            console.error('Error setting session:', error);
          } else {
            console.log('Session set successfully from deep link');
          }
        }
        
        // Close the in-app browser
        await Browser.close();
      }
    });

    return () => {
      handleUrlOpen.then(h => h.remove());
    };
  }, []);

  return (
    <>
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
      <UpdateModal />
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <UploadProvider>
            <UpdateProvider>
              <AppContent />
            </UpdateProvider>
          </UploadProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
