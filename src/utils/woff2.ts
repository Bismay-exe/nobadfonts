export const runWoff2Compress = async (buffer: Uint8Array): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
        const compress = () => {
            try {
                const Module = (window as any).Module;
                if (!Module || !Module.compress) {
                    reject(new Error("Module.compress not found after load"));
                    return;
                }
                const result = Module.compress(buffer);
                if (!result) reject(new Error("Compression failed (returned null/false)"));
                else resolve(result);
            } catch (e) {
                reject(e);
            }
        };

        const Module = (window as any).Module;
        // Check if module is already loaded and ready
        if (Module && Module.compress) {
            compress();
            return;
        }

        // Check if script is already present but module not ready
        if (document.querySelector('script[src="/wawoff2.js"]')) {
            const checkModule = () => {
                const M = (window as any).Module;
                if (M && M.compress) {
                    compress();
                } else {
                    setTimeout(checkModule, 100);
                }
            };
            checkModule();
            return;
        }

        // Load script
        const script = document.createElement('script');
        script.src = '/wawoff2.js';
        script.async = true;

        script.onload = () => {
            // Wait for runtime initialized
            const checkModule = () => {
                const M = (window as any).Module;
                // Emscripten generic check
                if (M && (M.calledRun || M.runtimeInitialized || M.compress)) {
                    compress();
                } else if (M) {
                    // Some emscripten builds need onRuntimeInitialized assignment
                    if (!M.onRuntimeInitialized && !M.calledRun) {
                        M.onRuntimeInitialized = () => {
                            compress();
                        };
                        // Safety check
                        setTimeout(checkModule, 500);
                    } else {
                        setTimeout(checkModule, 100);
                    }
                } else {
                    setTimeout(checkModule, 100);
                }
            };
            checkModule();
        };

        script.onerror = () => reject(new Error("Failed to load wawoff2.js"));
        document.body.appendChild(script);
    });
};
