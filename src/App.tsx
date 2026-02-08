import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import FontsCatalog from './pages/FontsCatalog';
import FontDetails from './pages/FontDetails';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import Upload from './pages/Upload';
import Members from './pages/Members';
import MemberDetails from './pages/MemberDetails';
import AdminDashboard from './pages/AdminDashboard';
import FontPairing from './pages/FontPairing';
import Cli from './pages/Cli';
import { ScrollRestoration } from './components/layout/ScrollRestoration';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollRestoration />
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
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="cli" element={<Cli />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
