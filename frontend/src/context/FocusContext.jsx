import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api, { errorMessage } from '../api/axiosInstance';
import { useAuth } from './AuthContext';
import { useTasks } from './TasksContext';
import { useToast } from './ToastContext';

const FocusContext = createContext(null);
const STORAGE_KEY = 'ytasker-timer';
const MIN = 60 * 1000;

function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && ['focus', 'break'].includes(saved.mode)) return saved;
  } catch {
    /* ignore corrupt/unavailable storage */
  }
  return null;
}

const IDLE = { mode: 'focus', status: 'idle', endsAt: null, pausedLeft: null, taskId: '' };

export function FocusProvider({ children }) {
  const { user } = useAuth();
  const { reload, touchStats } = useTasks();
  const toast = useToast();

  const focusMs = (user?.settings?.focusLength || 25) * MIN;
  const breakMs = (user?.settings?.breakLength || 5) * MIN;

  const [timer, setTimer] = useState(() => loadSaved() || IDLE);
  const [now, setNow] = useState(() => Date.now());
  const finishing = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
    } catch {
      /* ignore */
    }
  }, [timer]);

  const total = timer.mode === 'focus' ? focusMs : breakMs;
  let remaining = total;
  if (timer.status === 'running') remaining = Math.max(0, timer.endsAt - now);
  else if (timer.status === 'paused') remaining = timer.pausedLeft;

  const finish = useCallback(async () => {
    if (finishing.current) return;
    finishing.current = true;
    const { mode, taskId } = timer;

    if (mode === 'focus') {
      try {
        await api.post('/focus', { minutes: Math.round(focusMs / MIN), taskId: taskId || undefined });
        reload({ silent: true });
        touchStats();
        toast('Focus session complete. Take a break!');
      } catch (err) {
        toast(errorMessage(err, 'Could not save your focus session'), { type: 'error' });
      }
    } else {
      toast('Break is over — ready for another round?', { type: 'info' });
    }

    if (user?.settings?.notifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(mode === 'focus' ? 'Focus session complete' : 'Break is over', {
        body: mode === 'focus' ? 'Nice work. Time for a short break.' : 'Ready to focus again?',
        icon: '/favicon.svg',
      });
    }

    setTimer((t) => ({ ...IDLE, mode: mode === 'focus' ? 'break' : 'focus', taskId: t.taskId }));
    finishing.current = false;
  }, [timer, focusMs, reload, touchStats, toast, user]);

  // Tick while running; finish when the clock hits zero.
  useEffect(() => {
    if (timer.status !== 'running') return undefined;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= timer.endsAt) finish();
    }, 250);
    return () => clearInterval(id);
  }, [timer.status, timer.endsAt, finish]);

  // Show the countdown in the browser tab so it's visible from other tabs.
  useEffect(() => {
    if (timer.status === 'idle') return undefined;
    const mm = String(Math.floor(remaining / 60000)).padStart(2, '0');
    const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');
    const original = document.title;
    document.title = `${mm}:${ss} · ${timer.mode === 'focus' ? 'Focus' : 'Break'} — Ytasker`;
    return () => {
      document.title = original;
    };
  }, [timer.status, timer.mode, remaining]);

  const start = useCallback(() => {
    if (
      user?.settings?.notifications &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission();
    }
    setNow(Date.now());
    setTimer((t) => {
      const left = t.status === 'paused' ? t.pausedLeft : t.mode === 'focus' ? focusMs : breakMs;
      return { ...t, status: 'running', endsAt: Date.now() + left, pausedLeft: null };
    });
  }, [user, focusMs, breakMs]);

  const pause = useCallback(() => {
    setTimer((t) =>
      t.status === 'running'
        ? { ...t, status: 'paused', pausedLeft: Math.max(0, t.endsAt - Date.now()), endsAt: null }
        : t
    );
  }, []);

  const reset = useCallback(() => {
    setTimer((t) => ({ ...IDLE, mode: t.mode, taskId: t.taskId }));
  }, []);

  const setMode = useCallback((mode) => {
    setTimer((t) => ({ ...IDLE, mode, taskId: t.taskId }));
  }, []);

  const setTaskId = useCallback((taskId) => setTimer((t) => ({ ...t, taskId })), []);

  const value = useMemo(
    () => ({
      mode: timer.mode,
      status: timer.status,
      taskId: timer.taskId,
      remaining,
      total,
      progress: total ? 1 - remaining / total : 0,
      start,
      pause,
      reset,
      setMode,
      setTaskId,
      skip: finish,
    }),
    [timer.mode, timer.status, timer.taskId, remaining, total, start, pause, reset, setMode, setTaskId, finish]
  );

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}

export function useFocus() {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error('useFocus must be used inside FocusProvider');
  return ctx;
}

export function formatClock(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
