import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { installApk } from '../../utils/apkInstaller';
import { Toast } from '@capacitor/toast';

interface UpdateModalProps {
  isOpen: boolean;
  latestVersion: string;
  currentVersion: string;
  releaseNotes: string;
  apkUrl: string;
  onClose: () => void;
}

export const UpdateModal = ({
  isOpen,
  latestVersion,
  currentVersion,
  releaseNotes,
  apkUrl,
  onClose
}: UpdateModalProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpdate = async () => {
    try {
      setIsDownloading(true);
      await installApk(apkUrl, (p) => setProgress(p));
    } catch (err) {
      console.error('Update failed:', err);
      Toast.show({
        text: 'Failed to download update. Please try again.',
        duration: 'long'
      });
      setIsDownloading(false);
      setProgress(0);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[rgb(var(--color-background)/0.3)] backdrop-blur-sm z-999"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-1000 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm bg-[rgb(var(--color-foreground))] border border-[rgb(var(--color-border))] rounded-3xl overflow-hidden shadow-2xl pointer-events-auto"
            >
              <div className="relative p-6">
                {/* Header/Banner */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-black rounded-xl">
                      <img src="/logo/logo.png" alt="" className='w-8 h-8 rounded-xl object-cover' />
                    </div>
                    <h2 className="text-xl font-bold text-[rgb(var(--color-background))]">Update Ready</h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2"
                  >
                    <X className="w-5 h-5 text-[rgb(var(--color-background))]" />
                  </button>
                </div>

                {/* Version Info */}
                <div className="flex items-center gap-4 mb-6 p-4 bg-[rgb(var(--color-background)/0.3)] rounded-2xl border border-[rgb(var(--color-muted))]">
                  <div className="flex-1">
                    <p className="text-xs text-[rgb(var(--color-background))] uppercase tracking-wider font-semibold mb-1">Current</p>
                    <p className="text-[rgb(var(--color-background))] font-medium">Build {currentVersion}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[rgb(var(--color-background))]" />
                  <div className="flex-1 text-right">
                    <p className="text-xs text-[rgb(var(--color-background))] uppercase tracking-wider font-semibold mb-1">Latest</p>
                    <p className="text-[rgb(var(--color-background))] font-bold">Build {latestVersion}</p>
                  </div>
                </div>

                {/* Release Notes */}
                <div className="mb-8">
                  <p className="text-xs text-[rgb(var(--color-background))] uppercase tracking-wider font-semibold mb-2">What's New</p>
                  <div className="max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                    <p className="text-[rgb(var(--color-muted)/0.7)] text-sm leading-relaxed whitespace-pre-wrap">
                      {releaseNotes}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  {isDownloading ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-[rgb(var(--color-background)/0.8)] font-semibold uppercase tracking-wider">
                        <span>Downloading Update</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-[rgb(var(--color-background)/0.2)] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-[rgb(var(--color-background))] shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                        />
                      </div>
                      <p className="text-[10px] text-[rgb(var(--color-muted))] text-center italic">
                        Please don't close the app...
                      </p>
                    </div>
                  ) : (
                    <>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleUpdate}
                        className="flex items-center justify-center gap-2 w-full py-4 bg-[rgb(var(--color-background)/0.8)] hover:[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] font-bold rounded-2xl transition-all shadow-[0_0_30px_0] shadow-[rgb(var(--color-background)/0.3)] border-2 border-[rgb(var(--color-foreground)/0.8)]"
                      >
                        <Download className="w-5 h-5" />
                        Update Now
                      </motion.button>
                      <button
                        onClick={onClose}
                        className="w-full py-3 text-[rgb(var(--color-background)/0.8)] hover:[rgb(var(--color-background))] text-sm font-medium transition-colors"
                      >
                        Maybe Later
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Decorative Glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-[rgb(var(--color-background)/0.8)] blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[rgb(var(--color-background)/0.8)] blur-[80px] pointer-events-none" />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
