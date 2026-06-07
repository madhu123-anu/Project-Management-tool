import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { createTask, updateTask, deleteTask } from '../store/slices/taskSlice';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function TaskModal({ task, projectId, projectMembers, onClose, onSave }) {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  
  const [projectsList, setProjectsList] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || (task?.project?._id || task?.project || ''));
  const [membersList, setMembersList] = useState(projectMembers || []);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  const isReadOnly = task?._id && !['admin', 'project_manager'].includes(user?.role);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    defaultValues: task ? {
      ...task,
      deadline: task.deadline?.slice(0, 10),
      assignedTo: task.assignedTo?.map(u => u._id) || []
    } : {
      status: 'todo',
      priority: 'medium',
      assignedTo: []
    }
  });

  useEffect(() => {
    if (task) {
      reset({
        ...task,
        deadline: task.deadline?.slice(0, 10),
        assignedTo: task.assignedTo?.map(u => u._id) || []
      });
    } else {
      reset({
        status: 'todo',
        priority: 'medium',
        assignedTo: []
      });
    }
    setSelectedProjectId(projectId || (task?.project?._id || task?.project || ''));
  }, [task, projectId, reset]);

  // Load all projects if no projectId is pre-specified (for My Tasks view)
  useEffect(() => {
    if (!projectId) {
      api.get('/projects')
        .then(({ data }) => setProjectsList(data.data))
        .catch(() => {});
    }
  }, [projectId]);

  // Load all registered team members in the system as assignees
  useEffect(() => {
    api.get('/users')
      .then(({ data }) => {
        setMembersList(data.data || []);
      })
      .catch(() => {});
  }, []);

  // Load task comments if editing
  useEffect(() => {
    if (task?._id) {
      api.get('/comments', { params: { taskId: task._id } })
        .then(({ data }) => setComments(data.data))
        .catch(() => {});
    }
  }, [task?._id]);

  const onSubmit = async (data) => {
    const finalProjectId = projectId || selectedProjectId;
    if (!finalProjectId) {
      toast.error('Please select a project');
      return;
    }

    setLoading(true);
    try {
      if (task?._id) {
        await dispatch(updateTask({ id: task._id, data })).unwrap();
        toast.success('Task updated successfully!');
      } else {
        await dispatch(createTask({ ...data, projectId: finalProjectId })).unwrap();
        toast.success('Task created successfully!');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await dispatch(deleteTask(task._id)).unwrap();
      toast.success('Task deleted successfully');
      onSave();
      onClose();
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const { data } = await api.post('/comments', { taskId: task._id, content: newComment });
      setComments(prev => [...prev, data.data]);
      setNewComment('');
    } catch {
      toast.error('Failed to post comment');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {task?._id ? 'Edit Task' : 'New Task'}
          </h2>
          <div className="flex items-center gap-2">
            {task?._id && !isReadOnly && (
              <button onClick={handleDelete} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">
                Delete
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
              ×
            </button>
          </div>
        </div>

        {task?._id && (
          <div className="flex gap-4 px-5 pt-4 border-b border-gray-100 dark:border-gray-700">
            {['details', 'comments', 'files'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                  activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'details' && (
            <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              {!projectId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project *
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={e => setSelectedProjectId(e.target.value)}
                    className="input-field"
                    disabled={!!task?._id}
                  >
                    <option value="">Select a Project</option>
                    {projectsList.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  {...register('title', { required: 'Title is required' })}
                  className="input-field"
                  placeholder="Task title"
                  disabled={isReadOnly}
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="What needs to be done?"
                  disabled={isReadOnly}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select {...register('status')} className="input-field">
                    <option value="todo">Todo</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select {...register('priority')} className="input-field" disabled={isReadOnly}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Deadline
                  </label>
                  <input type="date" {...register('deadline')} className="input-field" disabled={isReadOnly} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    {...register('estimatedHours')}
                    className="input-field"
                    placeholder="0"
                    min="0"
                    disabled={isReadOnly}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assignees
                </label>
                <div className="space-y-1 max-h-36 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-2">
                  {membersList.map(m => {
                    const u = m.user || m;
                    return (
                      <label key={u._id} className="flex items-center gap-2 p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          value={u._id}
                          {...register('assignedTo')}
                          className="rounded border-gray-300 text-primary-600"
                          disabled={isReadOnly}
                        />
                        <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-600">
                          {u.name?.charAt(0)}
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {u.name}
                        </span>
                      </label>
                    );
                  })}
                  {membersList.length === 0 && (
                    <p className="text-xs text-gray-400 p-1">
                      {projectId || selectedProjectId ? 'No members in project' : 'Select a project first'}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags (comma separated)
                </label>
                <input {...register('tags')} className="input-field" placeholder="frontend, bug, urgent" disabled={isReadOnly} />
              </div>
            </form>
          )}

          {activeTab === 'comments' && task?._id && (
            <div className="space-y-4">
              {comments.length === 0 && <p className="text-center text-gray-400 text-sm py-6">No comments yet</p>}
              {comments.map(c => (
                <div key={c._id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-xs flex-shrink-0">
                    {c.author?.name?.charAt(0)}
                  </div>
                  <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{c.author?.name}</span>
                      <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                      {c.isEdited && <span className="text-xs text-gray-300">(edited)</span>}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{c.content}</p>
                  </div>
                </div>
              ))}
              <form onSubmit={submitComment} className="flex gap-2 pt-2">
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  className="input-field flex-1 text-sm"
                  placeholder="Write a comment..."
                />
                <button type="submit" className="btn-primary text-sm px-3">
                  Post
                </button>
              </form>
            </div>
          )}

          {activeTab === 'files' && task?._id && (
            <div className="space-y-3">
              {task.attachments?.length === 0 || !task.attachments ? (
                <p className="text-center text-gray-400 text-sm py-6">No attachments yet</p>
              ) : (
                task.attachments.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-xl">
                    <span className="text-2xl">
                      {f.fileType?.includes('image') ? '🖼️' : f.fileType?.includes('pdf') ? '📄' : '📎'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{f.filename}</p>
                      <p className="text-xs text-gray-400">{f.fileType}</p>
                    </div>
                    <a href={f.fileUrl} target="_blank" rel="noreferrer" className="text-primary-600 text-xs hover:underline">
                      Download
                    </a>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {activeTab === 'details' && (
          <div className="flex gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" form="task-form" disabled={loading} className="flex-1 btn-primary">
              {loading ? 'Saving...' : 'Save Task'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
