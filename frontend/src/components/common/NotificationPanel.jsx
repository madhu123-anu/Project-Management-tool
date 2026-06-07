import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markAsRead, markAllAsRead } from '../../store/slices/notificationSlice';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationPanel({ onClose }) {
  const dispatch = useDispatch();
  const { list } = useSelector(s => s.notifications);

  useEffect(() => { dispatch(fetchNotifications({ limit: 15 })); }, []);

  const handleMarkRead = (id) => { dispatch(markAsRead(id)); };

  const typeIcon = {
    task_assigned: '📋', task_completed: '✅', comment_added: '💬',
    mention: '@', deadline_near: '⏰', project_updated: '📁', member_added: '👤'
  };

  return (
    <div className="absolute right-0 top-10 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <span className="font-semibold text-sm text-gray-900 dark:text-white">Notifications</span>
        <button onClick={() => dispatch(markAllAsRead())} className="text-xs text-primary-600 hover:underline">Mark all read</button>
      </div>
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
        {list.length === 0 && (
          <p className="text-center text-gray-500 py-8 text-sm">No notifications</p>
        )}
        {list.map(n => (
          <button key={n._id} onClick={() => { handleMarkRead(n._id); onClose(); }}
            className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!n.isRead ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
            <div className="flex gap-3">
              <span className="text-lg flex-shrink-0">{typeIcon[n.type] || '📢'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-white">{n.title}</p>
                <p className="text-xs text-gray-500 truncate">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
              </div>
              {!n.isRead && <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
