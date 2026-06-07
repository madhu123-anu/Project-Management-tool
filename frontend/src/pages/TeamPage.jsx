import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';

const ROLE_BADGE = {
  admin: 'bg-purple-100 text-purple-700',
  project_manager: 'bg-blue-100 text-blue-700',
  team_member: 'bg-gray-100 text-gray-700'
};

function TeamMemberModal({ onClose, onSave }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/users', data);
      toast.success('Team member added successfully!');
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add team member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Team Member</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
            <input {...register('name', { required: 'Required' })} className="input-field" placeholder="John Doe" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
            <input type="email" {...register('email', { required: 'Required' })} className="input-field" placeholder="john@example.com" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select {...register('role')} className="input-field">
              <option value="team_member">Team Member</option>
              <option value="project_manager">Project Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
            <input type="password" {...register('password', { required: 'Required', minLength: { value: 8, message: 'Minimum 8 characters' } })} className="input-field" placeholder="••••••••" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">{loading ? 'Adding...' : 'Add Member'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function TeamPage() {
  const { user } = useSelector(s => s.auth);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data.data);
      // load stats for each
      const statsMap = {};
      await Promise.all(data.data.map(async u => {
        try {
          const { data: s } = await api.get(`/users/${u._id}/stats`);
          statsMap[u._id] = s.data;
        } catch {}
      }));
      setStats(statsMap);
    } catch { toast.error('Failed to load team'); }
    finally { setLoading(false); }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (user?.role !== 'admin') return toast.error('Only admins can change roles');
    try {
      await api.put(`/users/${userId}`, { role: newRole });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
      toast.success('Role updated!');
    } catch { toast.error('Failed to update role'); }
  };

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const canAddMember = ['admin', 'project_manager'].includes(user?.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} members in your organization</p>
        </div>
        {canAddMember && (
          <button onClick={() => setModalOpen(true)} className="btn-primary">+ Add Member</button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <input type="text" placeholder="Search by name or email..." value={search}
          onChange={e => setSearch(e.target.value)} className="input-field flex-1 min-w-48" />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field w-44">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="project_manager">Project Manager</option>
          <option value="team_member">Team Member</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-40 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-gray-500">No team members found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(u => {
            const s = stats[u._id];
            return (
              <div key={u._id} className="card p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg flex-shrink-0">
                    {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full rounded-full object-cover" /> : u.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{u.name}</p>
                      {u._id === user?._id && <span className="text-xs text-primary-500">(you)</span>}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    <div className="mt-1.5">
                      {user?.role === 'admin' && u._id !== user?._id ? (
                        <select value={u.role} onChange={e => handleRoleChange(u._id, e.target.value)}
                          className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer ${ROLE_BADGE[u.role]}`}>
                          <option value="admin">Admin</option>
                          <option value="project_manager">Project Manager</option>
                          <option value="team_member">Team Member</option>
                        </select>
                      ) : (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE[u.role]}`}>
                          {u.role?.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {s && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Completion</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{s.completionRate}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${s.completionRate}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{s.assignedTasks} tasks</span>
                      <span>{s.projects} projects</span>
                    </div>
                  </div>
                )}

                <div className={`mt-3 flex items-center gap-1.5 text-xs ${u.isActive ? 'text-green-500' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-green-400' : 'bg-gray-300'}`} />
                  {u.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <TeamMemberModal
            onClose={() => setModalOpen(false)}
            onSave={loadUsers}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
