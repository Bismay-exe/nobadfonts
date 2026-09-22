import React, { useEffect, Suspense } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { ScrollRestoration } from './components/layout/ScrollRestoration';
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
import { BagProvider } from './contexts/BagContext';
import BagPanel from './components/bag/BagPanel';

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
const Home = React.lazy(() => import('./pages/Home'));
const TermsOfService = React.lazy(() => import('./pages/legal/TermsOfService'));
const PrivacyPolicy = React.lazy(() => import('./pages/legal/PrivacyPolicy'));
const DmcaPolicy = React.lazy(() => import('./pages/legal/DmcaPolicy'));
const CookiePolicy = React.lazy(() => import('./pages/legal/SiteCookies'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const Onboarding = React.lazy(() => import('./pages/Onboarding'));
const UserBoards = React.lazy(() => import('./pages/boards/UserBoards'));
const BoardDetail = React.lazy(() => import('./pages/boards/BoardDetail'));
const BoardShare = React.lazy(() => import('./pages/boards/BoardShare'));
import CookieConsent from './components/layout/CookieConsent';
import { useAuth } from './contexts/AuthContext';

/**
 * OnboardingGuard — intercepts navigation for users who haven't completed onboarding.
 * Exempt routes: /onboarding, /auth, /board-share/*
 */
function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { needsOnboarding, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const exempt = [
    '/onboarding',
    '/auth',
  ];
  const isExempt = exempt.some(p => location.pathname.startsWith(p)) ||
    location.pathname.startsWith('/board-share/');

  useEffect(() => {
    if (!loading && needsOnboarding && !isExempt) {
      navigate(`/onboarding?returnTo=${encodeURIComponent(location.pathname)}`, { replace: true });
    }
  }, [needsOnboarding, loading, isExempt, navigate, location.pathname]);

  return <>{children}</>;
}

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
      <BagPanel />
      <OnboardingGuard>
      <Suspense fallback={
        <div className="fixed inset-0 flex items-center justify-center bg-[rgb(var(--color-background))] z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[rgb(var(--color-foreground)/0.1)] border-t-[rgb(var(--color-foreground))]"></div>
        </div>
      }>
        <Routes location={location} key={location.pathname}>
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/board-share/:shareToken" element={<BoardShare />} />
          <Route path="/fonts/:id" element={<FontDetails />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="fonts" element={<FontsCatalog />} />
            <Route path="pairing" element={<FontPairing />} />
            <Route path="upload" element={<Upload />} />
            <Route path="profile" element={<Profile />} />
            <Route path="members" element={<Members />} />
            <Route path="members/:id" element={<MemberDetails />} />
            <Route path="designers/:designerName" element={<DesignerFonts />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="cli" element={<Cli />} />
            <Route path="legal/terms" element={<TermsOfService />} />
            <Route path="legal/privacy" element={<PrivacyPolicy />} />
            <Route path="legal/dmca" element={<DmcaPolicy />} />
            <Route path="legal/cookies" element={<CookiePolicy />} />
            {/* User boards routes — must be after all known paths */}
            <Route path=":username" element={<UserBoards />} />
            <Route path=":username/:boardSlug" element={<BoardDetail />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
      </OnboardingGuard>
      <UpdateModal />
      <CookieConsent />
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <UploadProvider>
          <UpdateProvider>
            <BagProvider>
              <AppContent />
            </BagProvider>
          </UpdateProvider>
        </UploadProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
