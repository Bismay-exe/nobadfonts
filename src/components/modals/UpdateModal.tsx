import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, ArrowRight } from 'lucide-react';
import { useUpdate } from '../../contexts/UpdateContext';

export const UpdateModal = () => {
  const { isModalOpen, updateInfo, closeModal, isDownloading, progress, startDownload } = useUpdate();

  if (!updateInfo) return null;

  const { latestBuild, currentBuild, releaseNotes } = updateInfo;

  const handleUpdate = useCallback(async () => {
    await startDownload();
  }, [startDownload]);

  return (
    <AnimatePresence>
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 bg-background/30 backdrop-blur-sm z-999"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-1000 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm bg-foreground border border-border rounded-3xl overflow-hidden shadow-2xl pointer-events-auto"
            >
              <div className="relative p-6">
                {/* Header/Banner */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-black rounded-xl">
                      <img src="/logo/logo-black.png" alt="NoBadFonts Logo" className='w-8 h-8 rounded-xl object-cover' />
                    </div>
                    <h2 className="text-xl font-bold text-background">Update Ready</h2>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-2"
                  >
                    <X className="w-5 h-5 text-background" />
                  </button>
                </div>

                {/* Version Info */}
                <div className="flex items-center gap-4 mb-6 p-4 bg-background/30 rounded-2xl border border-muted">
                  <div className="flex-1">
                    <p className="text-xs text-background uppercase tracking-wider font-semibold mb-1">Current</p>
                    <p className="text-background font-medium">Beta v0.{currentBuild}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-background" />
                  <div className="flex-1 text-right">
                    <p className="text-xs text-background uppercase tracking-wider font-semibold mb-1">Latest</p>
                    <p className="text-background font-bold">Beta v0.{latestBuild}</p>
                  </div>
                </div>

                {/* Release Notes */}
                <div className="mb-8">
                  <p className="text-xs text-background uppercase tracking-wider font-semibold mb-2">What's New</p>
                  <div className="max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                    <p className="text-muted/70 text-sm leading-relaxed whitespace-pre-wrap">
                      {releaseNotes}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  {isDownloading ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-background/80 font-semibold uppercase tracking-wider">
                        <span>Downloading Update</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-background/20 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-background shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                        />
                      </div>
                      <p className="text-[10px] text-muted text-center italic">
                        Please don't close the app...
                      </p>
                    </div>
                  ) : (
                    <>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleUpdate}
                        className="flex items-center justify-center gap-2 w-full py-4 bg-background/80 hover:[var(--color-background)] text-foreground font-bold rounded-2xl transition-all shadow-[0_0_30px_0] shadow-background/30 border-2 border-foreground/80"
                      >
                        <Download className="w-5 h-5" />
                        Update Now
                      </motion.button>
                      <button
                        onClick={closeModal}
                        className="w-full py-3 text-background/80 hover:[var(--color-background)] text-sm font-medium transition-colors duration-300 ease-in-out"
                      >
                        Maybe Later
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Decorative Glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-background/80 blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-background/80 blur-[80px] pointer-events-none" />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
