import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { fetchDashboardStats } from '../store/slices/projectSlice';

const StatCard = ({ icon, label, value, color, sub }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
    className="card p-5 flex items-start gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${color}`}>{icon}</div>
    <div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? <span className="skeleton w-8 h-6 inline-block" />}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </motion.div>
);

const COLORS = ['#6366f1', '#3b82f6', '#f59e0b', '#10b981'];

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { stats, loading } = useSelector(s => s.projects);

  useEffect(() => { dispatch(fetchDashboardStats()); }, []);

  const taskStatusData = stats?.tasksByStatus?.map(s => ({
    name: s._id.replace('_', ' '),
    value: s.count
  })) || [];

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyChartData = (() => {
    if (!stats?.monthlyData) return [];
    const grouped = {};
    stats.monthlyData.forEach(d => {
      const key = `${monthNames[d._id.month - 1]} ${d._id.year}`;
      if (!grouped[key]) grouped[key] = { name: key, created: 0, completed: 0 };
      if (d._id.status === 'completed') grouped[key].completed += d.count;
      else grouped[key].created += d.count;
    });
    return Object.values(grouped).slice(-6);
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Good morning, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Here's what's happening across your projects.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon="📁" label="Total Projects" value={stats?.totalProjects} color="bg-indigo-100 dark:bg-indigo-900/30" />
        <StatCard icon="🚀" label="Active Projects" value={stats?.activeProjects} color="bg-blue-100 dark:bg-blue-900/30" />
        <StatCard icon="✅" label="Completed" value={stats?.completedProjects} color="bg-green-100 dark:bg-green-900/30" />
        <StatCard icon="📋" label="Pending Tasks" value={stats?.pendingTasks} color="bg-yellow-100 dark:bg-yellow-900/30" />
        <StatCard icon="⏰" label="Overdue" value={stats?.overdueTasks} color="bg-red-100 dark:bg-red-900/30" />
        <StatCard icon="📈" label="Completion Rate" value={stats ? `${stats.completionRate}%` : null} color="bg-purple-100 dark:bg-purple-900/30" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly productivity */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Productivity</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="created" stroke="#6366f1" strokeWidth={2} dot={false} name="Tasks Created" />
              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={false} name="Tasks Completed" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Task distribution */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Task Distribution</h2>
          {taskStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {taskStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend formatter={(val) => <span className="text-xs capitalize">{val}</span>} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No task data yet</div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/projects" className="btn-primary text-sm">+ New Project</Link>
          <Link to="/tasks" className="btn-secondary text-sm">View My Tasks</Link>
          <Link to="/calendar" className="btn-secondary text-sm">📅 Calendar</Link>
          <Link to="/reports" className="btn-secondary text-sm">📊 Reports</Link>
        </div>
      </div>
    </div>
  );
}
