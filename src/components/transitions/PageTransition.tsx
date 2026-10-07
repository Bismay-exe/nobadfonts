import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { useLocation, type Location } from 'react-router-dom';
import '../../styles/transition.css';

export type TransitionState =
  | 'idle'
  | 'covering'
  | 'covered'
  | 'revealing';

interface PageTransitionContextValue {
  state: TransitionState;
  displayLocation: Location;
  reportPageReady: (id: string, isReady: boolean) => void;
  unregisterPageReady: (id: string) => void;
  notifyRouteMounted: (pathname: string) => void;
}

const PageTransitionContext =
  createContext<PageTransitionContextValue | null>(null);

/**
 * Optional hook for pages to report custom data readiness.
 */
export function usePageReady(isReady: boolean = true) {
  const context = useContext(PageTransitionContext);
  const idRef = useRef<string | null>(null);

  if (!idRef.current) {
    idRef.current =
      'ready_' + Math.random().toString(36).substring(2, 9);
  }

  useEffect(() => {
    if (!context) return;

    const id = idRef.current!;

    context.reportPageReady(id, isReady);

    return () => {
      context.unregisterPageReady(id);
    };
  }, [context, isReady]);
}

/**
 * Access global page transition state.
 */
export function usePageTransition() {
  const context = useContext(PageTransitionContext);

  if (!context) {
    throw new Error(
      'usePageTransition must be used within a PageTransition component'
    );
  }

  return context;
}

/**
 * Notifies PageTransition when the destination route has mounted.
 */
export function PageTransitionTracker() {
  const context = useContext(PageTransitionContext);
  const location = useLocation();

  useEffect(() => {
    if (context) {
      context.notifyRouteMounted(location.pathname);
    }
  }, [context, location.pathname]);

  return null;
}

interface PageTransitionProps {
  children:
    | React.ReactNode
    | ((props: { displayLocation: Location }) => React.ReactNode);

  /**
   * Time for the transition panel to enter from the bottom.
   */
  coverDuration?: number;

  /**
   * Time for the transition panel to leave toward the bottom.
   * The destination page scales up during this same period.
   */
  revealDuration?: number;

  /**
   * Prevent the transition from getting stuck forever.
   */
  safetyTimeout?: number;

  /**
   * Small delay before revealing once destination is ready.
   */
  settleDelay?: number;
}

export function PageTransition({
  children,

  // Deliberately slower than the original 450ms.
  coverDuration = 850,
  revealDuration = 850,

  safetyTimeout = 4000,
  settleDelay = 250,
}: PageTransitionProps) {
  const routerLocation = useLocation();

  const [displayLocation, setDisplayLocation] =
    useState<Location>(routerLocation);

  const [state, setState] =
    useState<TransitionState>('idle');

  const [panelPosition, setPanelPosition] =
    useState<'down' | 'center'>('down');

  const [isAnimating, setIsAnimating] =
    useState(false);

  const [isVisible, setIsVisible] =
    useState(false);

  /*
   * Controls the actual page scale.
   *
   * false:
   *   scale(1), opacity(1)
   *
   * true:
   *   scale(.92), opacity(.55)
   */
  const [isPageScaled, setIsPageScaled] =
    useState(false);

  // --------------------------------
  // Refs
  // --------------------------------

  const targetLocationRef =
    useRef<Location>(routerLocation);

  const displayLocationRef =
    useRef<Location>(routerLocation);

  const shellRef =
    useRef<HTMLDivElement>(null);

  displayLocationRef.current = displayLocation;

  const stateRef =
    useRef<TransitionState>('idle');

  stateRef.current = state;

  const notifiersMapRef =
    useRef<Map<string, boolean>>(new Map());

  const routeMountedRef =
    useRef(false);

  const isFirstMountRef =
    useRef(true);

  const revealingTriggeredRef =
    useRef(false);

  const coverTimerRef =
    useRef<number | null>(null);

  const revealTimerRef =
    useRef<number | null>(null);

  const settleTimerRef =
    useRef<number | null>(null);

  const safetyTimerRef =
    useRef<number | null>(null);

  const fallbackMountTimerRef =
    useRef<number | null>(null);

  // --------------------------------
  // Timer cleanup
  // --------------------------------

  const clearAllTimers = useCallback(() => {
    if (coverTimerRef.current !== null) {
      window.clearTimeout(coverTimerRef.current);
      coverTimerRef.current = null;
    }

    if (revealTimerRef.current !== null) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }

    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }

    if (safetyTimerRef.current !== null) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }

    if (fallbackMountTimerRef.current !== null) {
      window.clearTimeout(fallbackMountTimerRef.current);
      fallbackMountTimerRef.current = null;
    }
  }, []);

  // --------------------------------
  // Reveal
  // --------------------------------

  const triggerReveal = useCallback(() => {
    if (stateRef.current !== 'covered') {
      return;
    }

    if (safetyTimerRef.current !== null) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }

    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }

    /*
     * IMPORTANT:
     *
     * Panel:
     *   center -> down
     *
     * Destination:
     *   scale(.92) -> scale(1)
     *
     * These happen at the SAME TIME.
     *
     * This is the NoBadFonts combination of:
     * CodePen #26 moveToBottom + scaleUp.
     */
    setState('revealing');

    setIsAnimating(true);

    // Destination starts coming back.
    setIsPageScaled(false);

    // Transition panel leaves through the bottom.
    setPanelPosition('down');

    revealTimerRef.current = window.setTimeout(() => {
      setState('idle');

      setIsAnimating(false);
      setIsVisible(false);

      /*
       * Reset panel while hidden.
       * No animation is applied because visibility is removed.
       */
      setPanelPosition('down');

      revealingTriggeredRef.current = false;
    }, revealDuration);
  }, [revealDuration]);

  // --------------------------------
  // Destination readiness
  // --------------------------------

  const checkReadiness = useCallback(() => {
    if (stateRef.current !== 'covered') {
      return;
    }

    if (!routeMountedRef.current) {
      return;
    }

    if (revealingTriggeredRef.current) {
      return;
    }

    let allReady = true;

    for (const isReady of notifiersMapRef.current.values()) {
      if (!isReady) {
        allReady = false;
        break;
      }
    }

    if (allReady) {
      revealingTriggeredRef.current = true;

      settleTimerRef.current = window.setTimeout(() => {
        triggerReveal();
      }, settleDelay);
    }
  }, [settleDelay, triggerReveal]);

  // --------------------------------
  // Route mounted
  // --------------------------------

  const notifyRouteMounted = useCallback(
    (pathname: string) => {
      if (
        pathname ===
        targetLocationRef.current.pathname
      ) {
        routeMountedRef.current = true;
        checkReadiness();
      }
    },
    [checkReadiness]
  );

  // --------------------------------
  // Page readiness
  // --------------------------------

  const reportPageReady = useCallback(
    (id: string, isReady: boolean) => {
      notifiersMapRef.current.set(id, isReady);
      checkReadiness();
    },
    [checkReadiness]
  );

  const unregisterPageReady = useCallback(
    (id: string) => {
      notifiersMapRef.current.delete(id);
      checkReadiness();
    },
    [checkReadiness]
  );

  // --------------------------------
  // Start transition
  // --------------------------------

  const startCovering = useCallback(() => {
    clearAllTimers();

    revealingTriggeredRef.current = false;
    routeMountedRef.current = false;
    notifiersMapRef.current.clear();

    /*
     * Capture scroll position so transform-origin matches viewport center.
     */
    if (shellRef.current) {
      shellRef.current.style.setProperty('--scroll-y', `${window.scrollY}px`);
    }

    /*
     * STEP 1
     *
     * Current page:
     * scale(1) -> scale(.90)
     * opacity(1) -> opacity(.55)
     */
    setIsPageScaled(true);

    /*
     * STEP 2
     *
     * Panel starts below the viewport.
     */
    setIsAnimating(false);
    setPanelPosition('down');
    setIsVisible(true);
    setState('covering');

    /*
     * Force the browser to paint the initial
     * off-screen state before starting the slide.
     */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsAnimating(true);
        setPanelPosition('center');

        /*
         * Once the panel fully covers the old page,
         * switch the rendered route underneath it.
         */
        coverTimerRef.current =
          window.setTimeout(() => {
            setState('covered');

            if (shellRef.current) {
              shellRef.current.style.setProperty('--scroll-y', '0px');
            }

            setDisplayLocation(
              targetLocationRef.current
            );

            /*
             * Fallback in case PageTransitionTracker
             * isn't present.
             */
            fallbackMountTimerRef.current =
              window.setTimeout(() => {
                if (!routeMountedRef.current) {
                  routeMountedRef.current = true;
                  checkReadiness();
                }
              }, 120);

            /*
             * Safety timeout.
             */
            safetyTimerRef.current =
              window.setTimeout(() => {
                console.warn(
                  '[PageTransition] Safety timeout reached, revealing page.'
                );

                triggerReveal();
              }, safetyTimeout);
          }, coverDuration);
      });
    });
  }, [
    clearAllTimers,
    coverDuration,
    safetyTimeout,
    checkReadiness,
    triggerReveal,
  ]);

  // --------------------------------
  // Monitor route changes
  // --------------------------------

  useEffect(() => {
    /*
     * Don't animate initial application mount.
     */
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }

    /*
     * Same pathname:
     * query/hash changes shouldn't trigger
     * a full page transition.
     */
    const isSamePage =
      routerLocation.pathname ===
      displayLocationRef.current.pathname;

    if (isSamePage) {
      setDisplayLocation(routerLocation);
      return;
    }

    targetLocationRef.current = routerLocation;

    /*
     * Normal navigation.
     */
    if (stateRef.current === 'idle') {
      startCovering();
      return;
    }

    /*
     * User navigated again while panel is entering.
     * Keep covering and simply use the newest target.
     */
    if (stateRef.current === 'covering') {
      return;
    }

    /*
     * Panel is already covering the screen.
     * Swap destination immediately underneath it.
     */
    if (stateRef.current === 'covered') {
      setDisplayLocation(routerLocation);

      routeMountedRef.current = false;
      revealingTriggeredRef.current = false;

      notifiersMapRef.current.clear();

      checkReadiness();

      return;
    }

    /*
     * User navigated while the reveal animation
     * was already running.
     *
     * Re-cover immediately.
     */
    if (stateRef.current === 'revealing') {
      clearAllTimers();

      setState('covering');

      setIsPageScaled(true);

      setIsAnimating(true);

      setPanelPosition('center');

      coverTimerRef.current =
        window.setTimeout(() => {
          setState('covered');

          setDisplayLocation(
            targetLocationRef.current
          );

          routeMountedRef.current = false;
          revealingTriggeredRef.current = false;

          notifiersMapRef.current.clear();

          checkReadiness();
        }, coverDuration);
    }
  }, [
    routerLocation,
    startCovering,
    clearAllTimers,
    coverDuration,
    checkReadiness,
  ]);

  // --------------------------------
  // Cleanup
  // --------------------------------

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // --------------------------------
  // Context
  // --------------------------------

  const contextValue: PageTransitionContextValue = {
    state,
    displayLocation,
    reportPageReady,
    unregisterPageReady,
    notifyRouteMounted,
  };

  // --------------------------------
  // Render
  // --------------------------------

  return (
    <PageTransitionContext.Provider
      value={contextValue}
    >
      {/*
       * IMPORTANT:
       *
       * The shell stays full-size and has
       * --color-muted as its background.
       *
       * The actual page is what scales.
       *
       * Therefore the muted shell becomes visible
       * around the page during scale-down.
       */}
      <div
        ref={shellRef}
        className="page-transition-shell"
        data-transitioning={state !== 'idle' ? 'true' : 'false'}
      >
        <div
          className="page-transition-content"
          data-transitioning={state !== 'idle' ? 'true' : 'false'}
          data-scaled={isPageScaled ? 'true' : 'false'}
        >
          {typeof children === 'function'
            ? children({ displayLocation })
            : children}
        </div>
      </div>

      {/*
       * Global transition panel.
       */}
      <div
        className="page-transition-overlay"
        data-position={panelPosition}
        data-animating={
          isAnimating ? 'true' : 'false'
        }
        data-visible={
          isVisible ? 'true' : 'false'
        }
        role="status"
        aria-live="polite"
        aria-busy={state !== 'idle'}
      >
        <div className="select-none pointer-events-none">
          <svg
            className="page-transition-logo w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 overflow-visible"
            viewBox="0 0 680 678"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Loading NoBadFonts"
          >
            {/* Main NoBadFonts logo */}
            <path d="M27.7539 678C27.7539 678 4.99807 663 0.500015 598C-3.99804 533 22 418 72.5 353.5C123 289 226.5 226 226.5 226C226.5 226 319.5 0 452.5 0C585.5 0 680 213.239 680 415.5C680 617.761 639.5 678 639.5 678H403C403 678 366.5 625 345 537C323.5 449 384.5 291 384.5 218.5C384.5 146 226.5 226 226.5 226C226.5 226 191 320.5 191 452C191 583.5 250 678 250 678H27.7539Z" />

            {/* Rotating star */}
            <path
              className="page-transition-star"
              d="M30.508 20.5896C21.5794 14.4189 11.648 7.55723 0.503116 0.0105563C8.0698 11.1837 14.9155 21.091 21.0703 29.9942C49.3078 70.8509 63.4278 91.2869 63.4272 113.006C63.4278 134.69 49.3555 155.092 21.2122 195.813L21.0862 195.999C14.915 204.928 8.05273 214.86 0.506647 226.005C11.6816 218.44 21.5883 211.595 30.4915 205.439C71.3464 177.201 91.7824 163.081 113.501 163.081C135.187 163.079 155.588 177.152 196.309 205.297L196.497 205.42C205.425 211.592 215.356 218.456 205.935 196.016C177.698 155.16 163.576 134.726 163.576 113.006C163.576 91.3234 177.648 70.9203 205.792 30.199L205.918 30.0119C212.09 21.0839 218.952 11.1508 226.497 0.00820215C215.323 7.57253 205.417 14.4171 196.512 20.5731C155.657 48.8118 135.222 62.9323 113.502 62.9317C91.8183 62.9317 71.417 48.8582 30.6945 20.7161L30.508 20.5896Z"
            />
          </svg>
        </div>
      </div>
    </PageTransitionContext.Provider>
  );
}

export default PageTransition;