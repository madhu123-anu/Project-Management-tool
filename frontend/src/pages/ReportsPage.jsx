import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#3b82f6', '#f59e0b', '#10b981', '#ef4444'];

function SectionCard({ title, children, action }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function ReportsPage() {
  const [teamReport, setTeamReport] = useState([]);
  const [prodReport, setProdReport] = useState(null);
  const [deadlineReport, setDeadlineReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('team');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [team, prod, deadline] = await Promise.all([
        api.get('/reports/team'),
        api.get('/reports/productivity'),
        api.get('/reports/deadlines')
      ]);
      setTeamReport(team.data.data);
      setProdReport(prod.data.data);
      setDeadlineReport(deadline.data.data);
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  };

  const exportCSV = (data, filename) => {
    if (!data?.length) return;
    const keys = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object');
    const csv = [keys.join(','), ...data.map(row => keys.map(k => `"${row[k] ?? ''}"`).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = filename;
    a.click();
  };

  const teamChartData = teamReport.map(r => ({
    name: r.user?.name?.split(' ')[0] || 'Unknown',
    assigned: r.assigned,
    completed: r.completed,
    rate: r.completionRate
  }));

  const prodChartData = (() => {
    if (!prodReport) return [];
    const map = {};
    prodReport.dailyCreations?.forEach(d => { if (!map[d._id]) map[d._id] = { date: d._id, created: 0, completed: 0 }; map[d._id].created = d.count; });
    prodReport.dailyCompletions?.forEach(d => { if (!map[d._id]) map[d._id] = { date: d._id, created: 0, completed: 0 }; map[d._id].completed = d.count; });
    return Object.values(map).slice(-14);
  })();

  const tabs = ['team', 'productivity', 'deadlines'];

  if (loading) return (
    <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}</div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Analytics and insights across your projects</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-6">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab === 'team' ? '👥 Team' : tab === 'productivity' ? '📈 Productivity' : '⏰ Deadlines'}
            </button>
          ))}
        </div>
      </div>

      {/* Team report */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <SectionCard title="Team Performance" action={
            <button onClick={() => exportCSV(teamReport.map(r => ({ name: r.user?.name, assigned: r.assigned, completed: r.completed, rate: r.completionRate + '%' })), 'team-report.csv')}
              className="btn-secondary text-xs py-1.5 px-3">Export CSV</button>
          }>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={teamChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="assigned" fill="#6366f1" name="Assigned" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamReport.map(r => (
              <div key={r.user?._id} className="card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">{r.user?.name?.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{r.user?.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{r.user?.role?.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Completion rate</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{r.completionRate}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${r.completionRate}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{r.assigned} assigned</span>
                    <span>{r.completed} completed</span>
                    {r.overdue > 0 && <span className="text-red-500">{r.overdue} overdue</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Productivity report */}
      {activeTab === 'productivity' && (
        <SectionCard title="Daily Productivity (Last 14 Days)">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={prodChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="created" stroke="#6366f1" strokeWidth={2} name="Tasks Created" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Tasks Completed" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>
      )}

      {/* Deadline report */}
      {activeTab === 'deadlines' && deadlineReport && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center border-l-4 border-red-400">
              <p className="text-2xl font-bold text-red-500">{deadlineReport.overdue?.length || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Overdue</p>
            </div>
            <div className="card p-4 text-center border-l-4 border-yellow-400">
              <p className="text-2xl font-bold text-yellow-600">{deadlineReport.dueThisWeek?.length || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Due This Week</p>
            </div>
            <div className="card p-4 text-center border-l-4 border-blue-400">
              <p className="text-2xl font-bold text-blue-600">{deadlineReport.dueThisMonth?.length || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Due This Month</p>
            </div>
          </div>

          {deadlineReport.overdue?.length > 0 && (
            <SectionCard title="🔴 Overdue Tasks">
              <div className="space-y-2">
                {deadlineReport.overdue.map(t => (
                  <div key={t._id} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.title}</p>
                      <p className="text-xs text-red-500">Due {new Date(t.deadline).toLocaleDateString()}</p>
                    </div>
                    {t.project && <span className="text-xs text-gray-400">{t.project.name}</span>}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {deadlineReport.dueThisWeek?.length > 0 && (
            <SectionCard title="🟡 Due This Week">
              <div className="space-y-2">
                {deadlineReport.dueThisWeek.map(t => (
                  <div key={t._id} className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.title}</p>
                      <p className="text-xs text-yellow-600">Due {new Date(t.deadline).toLocaleDateString()}</p>
                    </div>
                    {t.project && <span className="text-xs text-gray-400">{t.project.name}</span>}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
}
