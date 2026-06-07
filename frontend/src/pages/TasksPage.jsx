import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchTasks } from '../store/slices/taskSlice';
import TaskModal from '../components/TaskModal';

const PRIORITY_BADGE = { low: 'priority-low', medium: 'priority-medium', high: 'priority-high', critical: 'priority-critical' };
const STATUS_BADGE = { todo: 'badge-todo', in_progress: 'badge-in_progress', review: 'badge-review', completed: 'badge-completed' };

export default function TasksPage() {
  const dispatch = useDispatch();
  const { list: tasks, loading } = useSelector(s => s.tasks);
  const { user } = useSelector(s => s.auth);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    dispatch(fetchTasks({ ...filters }));
  }, [filters]);

  const filtered = tasks.filter(t => {
    if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.status && t.status !== filters.status) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    return true;
  });

  const overdue = filtered.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed');
  const upcoming = filtered.filter(t => t.deadline && new Date(t.deadline) >= new Date() && t.status !== 'completed');
  const completed = filtered.filter(t => t.status === 'completed');

  const TaskRow = ({ task }) => (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      onClick={() => setSelectedTask(task)}
      className="card p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex-shrink-0">
        <span className={STATUS_BADGE[task.status]}>{task.status?.replace('_', ' ')}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.project && (
            <Link to={`/projects/${task.project._id}`} onClick={e => e.stopPropagation()} className="text-xs text-primary-500 hover:underline">
              {task.project.name}
            </Link>
          )}
          {task.deadline && (
            <span className={`text-xs ${new Date(task.deadline) < new Date() && task.status !== 'completed' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
              Due {new Date(task.deadline).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <span className={PRIORITY_BADGE[task.priority]}>{task.priority}</span>
      <div className="flex -space-x-1">
        {task.assignedTo?.slice(0, 3).map((u, i) => (
          <div key={i} title={u.name} className="w-7 h-7 rounded-full bg-primary-100 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-semibold text-primary-600">
            {u.name?.charAt(0)}
          </div>
        ))}
      </div>
    </motion.div>
  );

  const Section = ({ title, tasks, color }) => tasks.length === 0 ? null : (
    <div>
      <div className={`flex items-center gap-2 mb-3`}>
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h2>
        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{tasks.length}</span>
      </div>
      <div className="space-y-2">{tasks.map(t => <TaskRow key={t._id} task={t} />)}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Tasks</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} tasks assigned to you</p>
        </div>
        {['admin', 'project_manager'].includes(user?.role) && (
          <button onClick={() => setModalOpen(true)} className="btn-primary">+ Add Task</button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <input type="text" placeholder="Search tasks..." value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} className="input-field flex-1 min-w-48" />
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="input-field w-36">
          <option value="">All Statuses</option>
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Review</option>
          <option value="completed">Completed</option>
        </select>
        <select value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))} className="input-field w-36">
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-1">No tasks found</h3>
          <p className="text-gray-500 text-sm">Tasks assigned to you will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <Section title="Overdue" tasks={overdue} color="bg-red-500" />
          <Section title="Upcoming" tasks={upcoming} color="bg-blue-500" />
          <Section title="Completed" tasks={completed} color="bg-green-500" />
        </div>
      )}

      <AnimatePresence>
        {(modalOpen || selectedTask) && (
          <TaskModal
            task={selectedTask}
            onClose={() => {
              setModalOpen(false);
              setSelectedTask(null);
            }}
            onSave={() => dispatch(fetchTasks({ ...filters }))}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
