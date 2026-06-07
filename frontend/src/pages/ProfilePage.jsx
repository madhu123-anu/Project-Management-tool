import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { updateUser } from '../store/slices/authSlice';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  const { register: regProfile, handleSubmit: handleProfile } = useForm({ defaultValues: { name: user?.name, email: user?.email } });
  const { register: regPw, handleSubmit: handlePw, watch, reset: resetPw } = useForm();

  const onSaveProfile = async (data) => {
    setSaving(true);
    try {
      const { data: res } = await api.put('/auth/profile', data);
      dispatch({ type: 'auth/updateUser', payload: res.user });
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const onChangePassword = async (data) => {
    setSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed!');
      resetPw();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account settings</p>
      </div>

      {/* Avatar section */}
      <div className="card p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-3xl">
          {user?.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" /> : user?.name?.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-lg">{user?.name}</p>
          <p className="text-gray-500 text-sm">{user?.email}</p>
          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium capitalize mt-1 inline-block">{user?.role?.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-6">
          {['profile', 'security'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>
              {tab === 'profile' ? '👤 Profile' : '🔒 Security'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h2>
          <form onSubmit={handleProfile(onSaveProfile)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input {...regProfile('name', { required: true })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input type="email" {...regProfile('email')} className="input-field" disabled />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Avatar URL</label>
              <input {...regProfile('avatar')} className="input-field" placeholder="https://example.com/avatar.jpg" />
            </div>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
          </form>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Change Password</h2>
          <form onSubmit={handlePw(onChangePassword)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
              <input type="password" {...regPw('currentPassword', { required: true })} className="input-field" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
              <input type="password" {...regPw('newPassword', { required: true, minLength: { value: 8, message: 'Min 8 chars' } })} className="input-field" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
              <input type="password" {...regPw('confirm', { validate: v => v === watch('newPassword') || 'Passwords do not match' })} className="input-field" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Changing...' : 'Change Password'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
