import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchProject } from '../store/slices/projectSlice';
import { fetchTasks } from '../store/slices/taskSlice';
import api from '../services/api';
import toast from 'react-hot-toast';
import TaskModal from '../components/TaskModal';

const STATUS_BADGE = { planning: 'badge-todo', active: 'badge-in_progress', on_hold: 'badge-review', completed: 'badge-completed' };
const TASK_BADGE = { todo: 'badge-todo', in_progress: 'badge-in_progress', review: 'badge-review', completed: 'badge-completed' };

export default function ProjectDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current: project } = useSelector(s => s.projects);
  const { list: tasks } = useSelector(s => s.tasks);
  const { user } = useSelector(s => s.auth);
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [addingMember, setAddingMember] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    dispatch(fetchProject(id));
    dispatch(fetchTasks({ projectId: id }));
    api.get('/users').then(({ data }) => setUsers(data.data)).catch(() => {});
  }, [id]);

  if (!project) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
    </div>
  );

  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  const handleAddMember = async (userId) => {
    try {
      await api.post(`/projects/${id}/members`, { userId });
      dispatch(fetchProject(id));
      toast.success('Member added!');
      setAddingMember(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      dispatch(fetchProject(id));
      toast.success('Member removed');
    } catch { toast.error('Failed'); }
  };

  const nonMembers = users.filter(u => !project.members?.some(m => m.user?._id === u._id) && u._id !== project.owner?._id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/projects" className="text-gray-400 hover:text-gray-600 text-sm">Projects</Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-600 dark:text-gray-300 text-sm">{project.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
          {project.clientName && <p className="text-sm text-gray-400">Client: {project.clientName}</p>}
        </div>
        <div className="flex gap-2">
          {['admin', 'project_manager'].includes(user?.role) && (
            <button onClick={() => setModalOpen(true)} className="btn-primary text-sm">+ Add Task</button>
          )}
          <Link to={`/projects/${id}/kanban`} className="btn-secondary text-sm">📋 Kanban Board</Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-6">
          {['overview', 'tasks', 'members'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Todo', value: tasksByStatus.todo, color: 'bg-gray-100 text-gray-700' },
              { label: 'In Progress', value: tasksByStatus.in_progress, color: 'bg-blue-100 text-blue-700' },
              { label: 'In Review', value: tasksByStatus.review, color: 'bg-yellow-100 text-yellow-700' },
              { label: 'Completed', value: tasksByStatus.completed, color: 'bg-green-100 text-green-700' },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <div className={`text-2xl font-bold mb-1 ${s.color.split(' ')[1]}`}>{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Project Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-400">Status</span><div className={`mt-1 inline-block ${STATUS_BADGE[project.status]}`}>{project.status}</div></div>
              <div><span className="text-gray-400">Priority</span><div className="mt-1 text-gray-700 dark:text-gray-300 font-medium capitalize">{project.priority}</div></div>
              <div><span className="text-gray-400">Start Date</span><div className="mt-1 text-gray-700 dark:text-gray-300">{project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'}</div></div>
              <div><span className="text-gray-400">End Date</span><div className="mt-1 text-gray-700 dark:text-gray-300">{project.endDate ? new Date(project.endDate).toLocaleDateString() : '—'}</div></div>
              <div><span className="text-gray-400">Owner</span><div className="mt-1 text-gray-700 dark:text-gray-300">{project.owner?.name}</div></div>
              <div><span className="text-gray-400">Total Tasks</span><div className="mt-1 text-gray-700 dark:text-gray-300">{tasks.length}</div></div>
            </div>
            {project.description && (
              <div><span className="text-gray-400 text-sm">Description</span><p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{project.description}</p></div>
            )}
          </div>
        </motion.div>
      )}

      {/* Tasks tab */}
      {activeTab === 'tasks' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">{tasks.length} tasks</span>
            <Link to={`/projects/${id}/kanban`} className="text-sm text-primary-600 hover:underline">View Kanban →</Link>
          </div>
          {tasks.length === 0 ? (
            <div className="card p-8 text-center text-gray-400">No tasks yet. Use the Kanban board to create tasks.</div>
          ) : tasks.map(task => (
            <div key={task._id} onClick={() => setSelectedTask(task)} className="card p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
              <span className={TASK_BADGE[task.status]}>{task.status.replace('_', ' ')}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{task.title}</p>
                {task.deadline && <p className="text-xs text-gray-400">Due {new Date(task.deadline).toLocaleDateString()}</p>}
              </div>
              <div className="flex -space-x-1">
                {task.assignedTo?.map((u, i) => (
                  <div key={i} title={u.name} className="w-6 h-6 rounded-full bg-primary-100 border border-white flex items-center justify-center text-xs font-semibold text-primary-600">
                    {u.name?.charAt(0)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Members tab */}
      {activeTab === 'members' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">{(project.members?.length || 0) + 1} members</span>
            {(user?.role === 'admin' || project.owner?._id === user?._id) && (
              <button onClick={() => setAddingMember(!addingMember)} className="btn-secondary text-sm">+ Add Member</button>
            )}
          </div>

          {addingMember && (
            <div className="card p-4">
              <p className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Select a user to add:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {nonMembers.map(u => (
                  <button key={u._id} onClick={() => handleAddMember(u._id)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-left transition-colors">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold text-sm">{u.name?.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </button>
                ))}
                {nonMembers.length === 0 && <p className="text-sm text-gray-400 text-center py-2">All users are already members</p>}
              </div>
            </div>
          )}

          {/* Owner */}
          <div className="card p-4 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">{project.owner?.name?.charAt(0)}</div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{project.owner?.name}</p>
                  <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">Owner</span>
                </div>
                <p className="text-xs text-gray-400">{project.owner?.email}</p>
              </div>
            </div>
            {(() => {
              const memberTasks = tasks.filter(t => t.assignedTo?.some(u => u._id === project.owner?._id));
              const assignedCount = memberTasks.length;
              const completedCount = memberTasks.filter(t => t.status === 'completed').length;
              const percentage = assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0;
              return (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 min-w-[200px]">
                  <div className="text-xs text-gray-500">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{completedCount}</span>/{assignedCount} Tasks
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 max-w-[100px]">
                      <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{percentage}%</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {project.members?.map(m => (
            <div key={m.user?._id} className="card p-4 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-semibold">{m.user?.name?.charAt(0)}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{m.user?.name}</p>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{m.role?.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs text-gray-400">{m.user?.email}</p>
                </div>
              </div>
              {(() => {
                const memberTasks = tasks.filter(t => t.assignedTo?.some(u => u._id === m.user?._id));
                const assignedCount = memberTasks.length;
                const completedCount = memberTasks.filter(t => t.status === 'completed').length;
                const percentage = assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0;
                return (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 min-w-[200px]">
                    <div className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{completedCount}</span>/{assignedCount} Tasks
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 max-w-[100px]">
                        <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{percentage}%</span>
                    </div>
                  </div>
                );
              })()}
              {(user?.role === 'admin' || project.owner?._id === user?._id) && (
                <button onClick={() => handleRemoveMember(m.user?._id)} className="text-gray-300 hover:text-red-500 transition-colors text-sm ml-1">✕</button>
              )}
            </div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {(modalOpen || selectedTask) && (
          <TaskModal
            task={selectedTask}
            projectId={id}
            projectMembers={[
              ...(project.members || []),
              project.owner ? { user: project.owner } : []
            ].flat().filter(Boolean)}
            onClose={() => {
              setModalOpen(false);
              setSelectedTask(null);
            }}
            onSave={() => {
              dispatch(fetchTasks({ projectId: id }));
              dispatch(fetchProject(id));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
