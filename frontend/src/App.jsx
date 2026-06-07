import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { getMe } from './store/slices/authSlice';
import { initSocket, disconnectSocket } from './services/socket';
import { addNotification } from './store/slices/notificationSlice';
import { addTaskRealtime, updateTaskRealtime, removeTaskRealtime } from './store/slices/taskSlice';

import Layout from './components/common/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import KanbanPage from './pages/KanbanPage';
import TasksPage from './pages/TasksPage';
import CalendarPage from './pages/CalendarPage';
import ReportsPage from './pages/ReportsPage';
import TeamPage from './pages/TeamPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

const ProtectedRoute = ({ children }) => {
  const { user, initialized } = useSelector(state => state.auth);
  if (!initialized) return <div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user } = useSelector(state => state.auth);
  return user ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { darkMode } = useSelector(state => state.ui);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    const token = localStorage.getItem('accessToken');
    if (token) dispatch(getMe());
  }, []);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('accessToken');
    const socket = initSocket(token);
    socket.on('notification', (notification) => dispatch(addNotification(notification)));
    socket.on('task_created', (task) => dispatch(addTaskRealtime(task)));
    socket.on('task_updated', (task) => dispatch(updateTaskRealtime(task)));
    socket.on('task_deleted', ({ taskId }) => dispatch(removeTaskRealtime(taskId)));
    return () => disconnectSocket();
  }, [user]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '10px', background: '#333', color: '#fff' } }} />
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="projects/:id/kanban" element={<KanbanPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
