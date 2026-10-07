import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api, { errorMessage } from '../api/axiosInstance';
import { useToast } from './ToastContext';
import TaskModal from '../components/tasks/TaskModal';

const TasksContext = createContext(null);

const SERVER_FIELDS = ['title', 'description', 'status', 'priority', 'dueDate', 'tags', 'subtasks', 'order'];

export function TasksProvider({ children }) {
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ open: false, task: null, defaults: null });
  const [statsVersion, setStatsVersion] = useState(0);

  // Lets mutations roll back to the exact list that was on screen.
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/tasks');
      setTasks(data);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Failed to load tasks'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Dashboard stats come from the server; bump this so they refetch.
  const touchStats = useCallback(() => setStatsVersion((v) => v + 1), []);

  const createTask = useCallback(
    async (values) => {
      try {
        const { data } = await api.post('/tasks', values);
        setTasks((prev) => [data, ...prev]);
        touchStats();
        return data;
      } catch (err) {
        toast(errorMessage(err, 'Could not create task'), { type: 'error' });
        throw err;
      }
    },
    [toast, touchStats]
  );

  const updateTask = useCallback(
    async (id, patch) => {
      const before = tasksRef.current;
      // Optimistic: show the change immediately, reconcile with the server reply.
      setTasks((prev) =>
        prev.map((t) =>
          t._id === id
            ? {
                ...t,
                ...patch,
                ...(patch.status
                  ? { completedAt: patch.status === 'completed' ? new Date().toISOString() : null }
                  : {}),
              }
            : t
        )
      );
      try {
        const body = Object.fromEntries(Object.entries(patch).filter(([k]) => SERVER_FIELDS.includes(k)));
        const { data } = await api.put(`/tasks/${id}`, body);
        setTasks((prev) => prev.map((t) => (t._id === id ? data : t)));
        touchStats();
        return data;
      } catch (err) {
        setTasks(before);
        toast(errorMessage(err, 'Could not save changes'), { type: 'error' });
        throw err;
      }
    },
    [toast, touchStats]
  );

  const toggleDone = useCallback(
    (task) => updateTask(task._id, { status: task.status === 'completed' ? 'pending' : 'completed' }).catch(() => {}),
    [updateTask]
  );

  const deleteTask = useCallback(
    async (task) => {
      const before = tasksRef.current;
      setTasks((prev) => prev.filter((t) => t._id !== task._id));
      try {
        await api.delete(`/tasks/${task._id}`);
        touchStats();
      } catch (err) {
        setTasks(before);
        toast(errorMessage(err, 'Could not delete task'), { type: 'error' });
        return;
      }
      toast('Task deleted', {
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              const restorable = {
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                dueDate: task.dueDate,
                tags: task.tags,
                subtasks: (task.subtasks || []).map((s) => ({ title: s.title, done: s.done })),
                order: task.order,
              };
              const { data } = await api.post('/tasks', restorable);
              setTasks((prev) => [data, ...prev]);
              touchStats();
            } catch (err) {
              toast(errorMessage(err, 'Could not restore task'), { type: 'error' });
            }
          },
        },
      });
    },
    [toast, touchStats]
  );

  const clearCompleted = useCallback(async () => {
    try {
      const { data } = await api.delete('/tasks', { params: { status: 'completed' } });
      setTasks((prev) => prev.filter((t) => t.status !== 'completed'));
      touchStats();
      toast(`Cleared ${data.deleted} completed task${data.deleted === 1 ? '' : 's'}`);
    } catch (err) {
      toast(errorMessage(err, 'Could not clear completed tasks'), { type: 'error' });
    }
  }, [toast, touchStats]);

  const openTask = useCallback((task = null, defaults = null) => {
    setModal({ open: true, task, defaults });
  }, []);
  const closeTask = useCallback(() => setModal((m) => ({ ...m, open: false })), []);

  const value = useMemo(
    () => ({
      tasks,
      loading,
      error,
      reload: load,
      statsVersion,
      touchStats,
      createTask,
      updateTask,
      toggleDone,
      deleteTask,
      clearCompleted,
      openTask,
    }),
    [tasks, loading, error, load, statsVersion, touchStats, createTask, updateTask, toggleDone, deleteTask, clearCompleted, openTask]
  );

  return (
    <TasksContext.Provider value={value}>
      {children}
      <TaskModal
        open={modal.open}
        task={modal.task}
        defaults={modal.defaults}
        onClose={closeTask}
        onCreate={createTask}
        onUpdate={updateTask}
        onDelete={deleteTask}
      />
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasks must be used inside TasksProvider');
  return ctx;
}
