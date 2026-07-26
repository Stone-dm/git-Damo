/**
 * 本地学习时序 / 积分 / 错题记录（Context 共享）
 * AsyncStorage 持久化，字段预留后端对接
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const KEY = 'party.learning.loop.v1';

export interface LocalLearningState {
  points: number;
  weekProgress: number;
  checkedInToday: boolean;
  channelDone: Record<string, boolean>;
  wrongCount: number;
  lastQuizScore: number | null;
  updatedAt: string;
}

const DEFAULT_STATE: LocalLearningState = {
  points: 2568,
  weekProgress: 0.68,
  checkedInToday: false,
  channelDone: {},
  wrongCount: 6,
  lastQuizScore: null,
  updatedAt: new Date().toISOString(),
};

interface LearningLocalApi {
  state: LocalLearningState;
  ready: boolean;
  markChannelDone: (channelId: string) => Promise<void>;
  finishQuiz: (score: number, wrong: number) => Promise<void>;
  checkIn: () => Promise<void>;
}

const Ctx = createContext<LearningLocalApi | null>(null);

export function LearningLocalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LocalLearningState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw && !cancelled) {
          setState({ ...DEFAULT_STATE, ...JSON.parse(raw) });
        }
      } catch {
        // keep default
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: LocalLearningState) => {
    setState(next);
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const markChannelDone = useCallback(
    async (channelId: string) => {
      setState((prev) => {
        const next: LocalLearningState = {
          ...prev,
          channelDone: { ...prev.channelDone, [channelId]: true },
          points: prev.points + 10,
          weekProgress: Math.min(1, prev.weekProgress + 0.05),
          updatedAt: new Date().toISOString(),
        };
        void AsyncStorage.setItem(KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const finishQuiz = useCallback(async (score: number, wrong: number) => {
    setState((prev) => {
      const next: LocalLearningState = {
        ...prev,
        lastQuizScore: score,
        wrongCount: wrong,
        points: prev.points + (score >= 80 ? 20 : 8),
        updatedAt: new Date().toISOString(),
      };
      void AsyncStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const checkIn = useCallback(async () => {
    setState((prev) => {
      if (prev.checkedInToday) return prev;
      const next: LocalLearningState = {
        ...prev,
        checkedInToday: true,
        points: prev.points + 5,
        updatedAt: new Date().toISOString(),
      };
      void AsyncStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ state, ready, markChannelDone, finishQuiz, checkIn }),
    [state, ready, markChannelDone, finishQuiz, checkIn],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLearningLocalState(): LearningLocalApi {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error('useLearningLocalState must be used within LearningLocalProvider');
  }
  return ctx;
}
