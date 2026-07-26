import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type Phase = 'idle' | 'covering' | 'holding' | 'revealing';

interface SilkTransitionApi {
  play: (onCovered: () => void | Promise<void>) => Promise<void>;
  active: boolean;
}

const SilkTransitionContext = createContext<SilkTransitionApi | null>(null);

const COVER_MS = 920;
const HOLD_MS = 160;
const REVEAL_MS = 1000;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function SilkTransitionProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const running = useRef(false);

  const play = useCallback(async (onCovered: () => void | Promise<void>) => {
    if (running.current) {
      await onCovered();
      return;
    }

    if (prefersReducedMotion()) {
      await onCovered();
      return;
    }

    running.current = true;
    setPhase('covering');

    await wait(COVER_MS);
    setPhase('holding');
    await onCovered();
    await wait(HOLD_MS);

    setPhase('revealing');
    await wait(REVEAL_MS);

    setPhase('idle');
    running.current = false;
  }, []);

  const value = useMemo(
    () => ({ play, active: phase !== 'idle' }),
    [play, phase],
  );

  return (
    <SilkTransitionContext.Provider value={value}>
      {children}
      {phase !== 'idle' ? (
        <div
          className={`silk-transition silk-transition--${phase}`}
          aria-hidden="true"
        >
          <div className="silk-curtain">
            <div className="silk-edge" />
            <div className="silk-body">
              <div className="silk-folds" />
              <div className="silk-sheen" />
            </div>
          </div>
        </div>
      ) : null}
    </SilkTransitionContext.Provider>
  );
}

export function useSilkTransition(): SilkTransitionApi {
  const ctx = useContext(SilkTransitionContext);
  if (!ctx) {
    throw new Error('useSilkTransition must be used within SilkTransitionProvider');
  }
  return ctx;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
