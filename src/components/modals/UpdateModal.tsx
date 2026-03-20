import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Sparkles, ArrowRight } from 'lucide-react';
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-999"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-1000 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm bg-gray-900/90 border border-white/10 rounded-3xl overflow-hidden shadow-2xl pointer-events-auto"
            >
              <div className="relative p-6">
                {/* Header/Banner */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-xl">
                      <Sparkles className="w-5 h-5 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Update Ready</h2>
                  </div>
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Version Info */}
                <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Current</p>
                    <p className="text-white font-medium">Build {currentVersion}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600" />
                  <div className="flex-1 text-right">
                    <p className="text-xs text-blue-400 uppercase tracking-wider font-semibold mb-1">Latest</p>
                    <p className="text-white font-bold">Build {latestVersion}</p>
                  </div>
                </div>

                {/* Release Notes */}
                <div className="mb-8">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">What's New</p>
                  <div className="max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {releaseNotes}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  {isDownloading ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-blue-400 font-semibold uppercase tracking-wider">
                        <span>Downloading Update</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 text-center italic">
                        Please don't close the app...
                      </p>
                    </div>
                  ) : (
                    <>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleUpdate}
                        className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/20"
                      >
                        <Download className="w-5 h-5" />
                        Update Now
                      </motion.button>
                      <button
                        onClick={onClose}
                        className="w-full py-3 text-gray-400 hover:text-white text-sm font-medium transition-colors"
                      >
                        Maybe Later
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Decorative Glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 blur-[80px] pointer-events-none" />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
