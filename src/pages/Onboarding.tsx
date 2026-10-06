import { useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/shared/SEO';

const DEFAULT_AVATARS = [
  'https://api.dicebear.com/8.x/thumbs/svg?seed=nbf1&backgroundColor=0ea5e9',
  'https://api.dicebear.com/8.x/thumbs/svg?seed=nbf2&backgroundColor=8b5cf6',
  'https://api.dicebear.com/8.x/thumbs/svg?seed=nbf3&backgroundColor=f59e0b',
  'https://api.dicebear.com/8.x/thumbs/svg?seed=nbf4&backgroundColor=10b981',
  'https://api.dicebear.com/8.x/thumbs/svg?seed=nbf5&backgroundColor=ef4444',
  'https://api.dicebear.com/8.x/thumbs/svg?seed=nbf6&backgroundColor=ec4899',
  'https://api.dicebear.com/8.x/thumbs/svg?seed=nbf7&backgroundColor=f97316',
  'https://api.dicebear.com/8.x/thumbs/svg?seed=nbf8&backgroundColor=06b6d4',
];

function slugifyUsername(val: string) {
  return val.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);
}

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/';

  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [step1Loading, setStep1Loading] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 2 fields
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedDefault, setSelectedDefault] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [step2Loading, setStep2Loading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Username availability check (debounced)
  const checkUsername = useCallback(async (value: string) => {
    const clean = slugifyUsername(value);
    if (clean !== value) setUsername(clean);
    if (clean.length < 3) { setUsernameStatus('invalid'); return; }
    setUsernameStatus('checking');
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', clean)
      .maybeSingle();
    setUsernameStatus(data ? 'taken' : 'available');
  }, []);

  const handleUsernameChange = useCallback((val: string) => {
    const clean = slugifyUsername(val);
    setUsername(clean);
    setUsernameStatus('idle');
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    if (clean.length >= 3) {
      usernameTimer.current = setTimeout(() => checkUsername(clean), 500);
    }
  }, [checkUsername]);

  const handleStep1 = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim() || !username.trim()) { setStep1Error('Name and username are required.'); return; }
    if (usernameStatus === 'taken') { setStep1Error('That username is already taken.'); return; }
    if (usernameStatus === 'invalid' || username.length < 3) { setStep1Error('Username must be at least 3 characters (letters, numbers, underscores only).'); return; }

    setStep1Loading(true);
    setStep1Error(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: name.trim(), username: username.trim() })
        .eq('id', user.id);
      if (error) throw error;
      setStep(2);
    } catch (err: any) {
      setStep1Error(err.message);
    } finally {
      setStep1Loading(false);
    }
  }, [user, name, username, usernameStatus]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      setAvatarUrl(publicUrl);
      setSelectedDefault(null);
    } catch (err: any) {
      console.error('Avatar upload error:', err);
    } finally {
      setUploading(false);
    }
  }, [user]);

  const handleStep2 = useCallback(async () => {
    if (!user) return;
    setStep2Loading(true);
    try {
      const finalAvatar = avatarUrl || selectedDefault;
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: finalAvatar,
          onboarding_completed: true,
        })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      navigate(returnTo, { replace: true });
    } catch (err: any) {
      console.error('Onboarding step 2 error:', err);
    } finally {
      setStep2Loading(false);
    }
  }, [user, avatarUrl, selectedDefault, refreshProfile, navigate, returnTo]);

  const handleSkipAvatar = useCallback(async () => {
    if (!user) return;
    setStep2Loading(true);
    try {
      await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id);
      await refreshProfile();
      navigate(returnTo, { replace: true });
    } catch (err) {
      console.error('Skip onboarding error:', err);
    } finally {
      setStep2Loading(false);
    }
  }, [user, refreshProfile, navigate, returnTo]);

  const currentAvatar = avatarUrl || selectedDefault;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <SEO title="Welcome to NoBadFonts" description="Set up your profile to get started." />

      {/* Logo */}
      <div className="mb-8 text-center">
        <span className="text-2xl font-black text-foreground tracking-tight">NoBadFonts</span>
        <p className="text-sm text-muted mt-1">Let's set up your profile</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all ${step >= s ? 'bg-accent text-background' : 'bg-foreground/10 text-muted'}`}>
              {step > s ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : s}
            </div>
            {s < 2 && <div className={`w-12 h-0.5 transition-all ${step > s ? 'bg-accent' : 'bg-foreground/10'}`} />}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-card-background border border-foreground/10 rounded-2xl shadow-xl p-8">

        {step === 1 && (
          <>
            <h1 className="text-xl font-black text-foreground mb-1">What should we call you?</h1>
            <p className="text-sm text-muted mb-6">Your name and username will appear on your public boards.</p>

            <form onSubmit={handleStep1} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Display Name</label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Alex Rivera"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-background border border-foreground/15 rounded-xl px-4 py-3 text-foreground placeholder-muted focus:outline-none focus:border-accent transition-colors text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm select-none">nobadfonts.in/</span>
                  <input
                    type="text"
                    placeholder="yourname"
                    value={username}
                    onChange={e => handleUsernameChange(e.target.value)}
                    className={`w-full bg-background border rounded-xl pl-30 pr-10 py-3 text-foreground placeholder-muted focus:outline-none transition-colors text-sm font-mono font-semibold ${usernameStatus === 'taken' ? 'border-red-400 focus:border-red-400' : usernameStatus === 'available' ? 'border-green-400 focus:border-green-400' : 'border-foreground/15 focus:border-accent'}`}
                  />
                  {/* Status indicator */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && <div className="w-4 h-4 rounded-full border-2 border-foreground/20 border-t-[var(--color-accent)] animate-spin" />}
                    {usernameStatus === 'available' && <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                    {usernameStatus === 'taken' && <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
                  </div>
                </div>
                {usernameStatus === 'taken' && <p className="text-xs text-red-400 mt-1">This username is taken. Try another.</p>}
                {usernameStatus === 'available' && <p className="text-xs text-green-400 mt-1">✓ Username is available!</p>}
                {usernameStatus === 'invalid' && <p className="text-xs text-muted mt-1">At least 3 characters. Letters, numbers, and underscores only.</p>}
              </div>

              {step1Error && (
                <div className="bg-red-500/10 border border-red-400/30 rounded-xl px-4 py-3 text-sm text-red-400">{step1Error}</div>
              )}

              <button
                type="submit"
                disabled={step1Loading || usernameStatus === 'taken' || usernameStatus === 'checking' || !name.trim() || !username.trim()}
                className="w-full py-3 rounded-xl bg-accent text-background font-black text-sm uppercase tracking-wide hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
              >
                {step1Loading ? 'Saving...' : 'Next →'}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-xl font-black text-foreground mb-1">Choose a profile picture</h1>
            <p className="text-sm text-muted mb-6">Pick one of our defaults or upload your own. You can change it later.</p>

            {/* Current selection preview */}
            {currentAvatar && (
              <div className="flex justify-center mb-5">
                <img src={currentAvatar} alt="Selected avatar" className="w-20 h-20 rounded-full border-4 border-accent object-cover shadow-lg" />
              </div>
            )}

            {/* Default avatars grid */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {DEFAULT_AVATARS.map(url => (
                <button
                  key={url}
                  onClick={() => { setSelectedDefault(url); setAvatarUrl(null); }}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${selectedDefault === url && !avatarUrl ? 'border-accent shadow-[0_0_0_2px_color-mix(in srgb, var(--color-accent) 30%, transparent)]' : 'border-transparent hover:border-foreground/30'}`}
                >
                  <img src={url} alt="Avatar option" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Upload custom */}
            <div className="mb-5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-foreground/20 text-sm text-muted hover:border-accent hover:text-accent transition-all font-medium flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <><div className="w-4 h-4 rounded-full border-2 border-foreground/15 border-t-[var(--color-accent)] animate-spin" /> Uploading...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg> Upload your photo</>
                )}
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSkipAvatar}
                disabled={step2Loading}
                className="flex-1 py-3 rounded-xl border border-foreground/15 text-sm font-semibold text-muted hover:bg-foreground/4 transition-all"
              >
                Skip for now
              </button>
              <button
                onClick={handleStep2}
                disabled={step2Loading || uploading}
                className="flex-1 py-3 rounded-xl bg-accent text-background font-black text-sm uppercase hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {step2Loading ? 'Finishing...' : 'Finish 🎉'}
              </button>
            </div>
          </>
        )}
      </div>

      <p className="mt-6 text-xs text-muted text-center">
        Step {step} of 2 · NoBadFonts
      </p>
    </div>
  );
}
