import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import { ScrollRestoration } from './components/layout/ScrollRestoration';
import { AuthProvider } from './contexts/AuthContext';
import { UploadProvider } from './contexts/UploadContext';
import UploadProgressPopup from './components/UploadProgressPopup';
import { HelmetProvider } from 'react-helmet-async';

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
  return (
    <HelmetProvider>
      <AuthProvider>
        <UploadProvider>
          <Router>
            <ScrollRestoration />
            <UploadProgressPopup />
            <Routes>
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
          </Router>
        </UploadProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
