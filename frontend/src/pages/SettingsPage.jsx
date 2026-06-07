import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleDarkMode } from '../store/slices/uiSlice';

export default function SettingsPage() {
  const dispatch = useDispatch();
  const { darkMode } = useSelector(s => s.ui);
  const { user } = useSelector(s => s.auth);

  const Toggle = ({ enabled, onToggle, label, description }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'}`}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your application preferences</p>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Appearance</h2>
        <Toggle enabled={darkMode} onToggle={() => dispatch(toggleDarkMode())} label="Dark Mode" description="Switch between light and dark theme" />
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Account Info</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">Name</span><span className="text-gray-700 dark:text-gray-300">{user?.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Email</span><span className="text-gray-700 dark:text-gray-300">{user?.email}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Role</span><span className="text-gray-700 dark:text-gray-300 capitalize">{user?.role?.replace('_', ' ')}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Member since</span><span className="text-gray-700 dark:text-gray-300">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span></div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-1">About</h2>
        <p className="text-sm text-gray-500">ProjectHub v1.0.0 — Enterprise Project Management Tool</p>
        <p className="text-xs text-gray-400 mt-1">Built with React, Node.js, MongoDB Atlas, and Socket.io</p>
      </div>
    </div>
  );
}
