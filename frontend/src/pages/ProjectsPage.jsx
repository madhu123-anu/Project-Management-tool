import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { fetchProjects, createProject, deleteProject, updateProject } from '../store/slices/projectSlice';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const PRIORITY_COLORS = { low: 'priority-low', medium: 'priority-medium', high: 'priority-high', critical: 'priority-critical' };
const STATUS_COLORS = { planning: 'badge-todo', active: 'badge-in_progress', on_hold: 'badge-review', completed: 'badge-completed', archived: 'badge-todo' };

function ProjectModal({ onClose, project = null }) {
  const dispatch = useDispatch();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: project ? { ...project, startDate: project.startDate?.slice(0, 10), endDate: project.endDate?.slice(0, 10) } : {}
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (project) {
        await dispatch(updateProject({ id: project._id, data })).unwrap();
        toast.success('Project updated!');
      } else {
        await dispatch(createProject(data)).unwrap();
        toast.success('Project created!');
      }
      onClose();
    } catch (err) {
      toast.error(err || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{project ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name *</label>
            <input {...register('name', { required: 'Required' })} className="input-field" placeholder="e.g. Website Redesign" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea {...register('description')} rows={3} className="input-field resize-none" placeholder="What is this project about?" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client Name</label>
            <input {...register('clientName')} className="input-field" placeholder="Optional" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <input type="date" {...register('startDate')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
              <input type="date" {...register('endDate')} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
              <select {...register('priority')} className="input-field">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select {...register('status')} className="input-field">
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">{loading ? 'Saving...' : project ? 'Update' : 'Create Project'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ProjectCard({ project, onEdit }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const handleDelete = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await dispatch(deleteProject(project._id)).unwrap();
      toast.success('Project deleted');
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/projects/${project._id}`)}
      className="card p-5 cursor-pointer hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={STATUS_COLORS[project.status] || 'badge-todo'}>{project.status?.replace('_', ' ')}</span>
          <span className={PRIORITY_COLORS[project.priority]}>{project.priority}</span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit(project); }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg text-xs">✏️</button>
          <button onClick={handleDelete} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs">🗑️</button>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 hover:text-primary-600 transition-colors">{project.name}</h3>
        {project.clientName && <p className="text-xs text-gray-400 mb-2">Client: {project.clientName}</p>}
        {project.description && <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{project.description}</p>}

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span><span>{project.completionPercentage || 0}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${project.completionPercentage || 0}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {project.members?.slice(0, 4).map((m, i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-primary-100 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-semibold text-primary-600">
                {m.user?.name?.charAt(0) || '?'}
              </div>
            ))}
            {project.members?.length > 4 && <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white text-xs flex items-center justify-center text-gray-500">+{project.members.length - 4}</div>}
          </div>
          {project.endDate && <span className="text-xs text-gray-400">Due {new Date(project.endDate).toLocaleDateString()}</span>}
        </div>
      </div>
    </motion.div>
  );
}

export default function ProjectsPage() {
  const dispatch = useDispatch();
  const { list, loading, pagination } = useSelector(s => s.projects);
  const { user } = useSelector(s => s.auth);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchProjects({ ...filters, page }));
  }, [filters, page]);

  const canCreate = ['admin', 'project_manager'].includes(user?.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-gray-500 text-sm mt-1">{pagination?.total || 0} total projects</p>
        </div>
        {canCreate && (
          <button onClick={() => { setEditProject(null); setModalOpen(true); }} className="btn-primary">+ New Project</button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <input
          type="text" placeholder="Search projects..." value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          className="input-field flex-1 min-w-48" />
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="input-field w-36">
          <option value="">All Statuses</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
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

      {/* Project grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">📁</div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-1">No projects found</h3>
          <p className="text-gray-500 text-sm mb-4">Create your first project to get started.</p>
          {canCreate && <button onClick={() => setModalOpen(true)} className="btn-primary">Create Project</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(project => (
            <ProjectCard key={project._id} project={project} onEdit={(p) => { setEditProject(p); setModalOpen(true); }} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination?.pages > 1 && (
        <div className="flex justify-center gap-2">
          {[...Array(pagination.pages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === i + 1 ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 hover:bg-gray-100'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modalOpen && <ProjectModal onClose={() => { setModalOpen(false); setEditProject(null); }} project={editProject} />}
      </AnimatePresence>
    </div>
  );
}
