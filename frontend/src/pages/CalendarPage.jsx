import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/tasks', { params: { limit: 200 } });
      const calEvents = data.data
        .filter(t => t.deadline)
        .map(t => ({
          id: t._id,
          title: t.title,
          date: t.deadline,
          backgroundColor: getPriorityColor(t.priority),
          borderColor: getPriorityColor(t.priority),
          extendedProps: { task: t }
        }));
      setEvents(calEvents);
    } catch (err) {
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = { low: '#10b981', medium: '#3b82f6', high: '#f59e0b', critical: '#ef4444' };
    return colors[priority] || '#6366f1';
  };

  const handleEventClick = ({ event }) => {
    setSelected(event.extendedProps.task);
  };

  const STATUS_BADGE = { todo: 'badge-todo', in_progress: 'badge-in_progress', review: 'badge-review', completed: 'badge-completed' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar</h1>
          <p className="text-gray-500 text-sm mt-1">Task deadlines across all your projects</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {[['Low', '#10b981'], ['Medium', '#3b82f6'], ['High', '#f59e0b'], ['Critical', '#ef4444']].map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 card p-4">
          {loading ? (
            <div className="skeleton h-96 rounded-xl" />
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
              events={events}
              eventClick={handleEventClick}
              height="auto"
              eventDisplay="block"
              eventTextColor="#fff"
              dayMaxEvents={3}
            />
          )}
        </div>

        <div className="space-y-4">
          {selected ? (
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Task Detail</h3>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">×</button>
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{selected.title}</p>
                {selected.description && <p className="text-xs text-gray-500 mt-1 line-clamp-3">{selected.description}</p>}
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className={STATUS_BADGE[selected.status]}>{selected.status?.replace('_',' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Priority</span>
                  <span className="font-medium capitalize text-gray-700 dark:text-gray-300">{selected.priority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Due</span>
                  <span className="text-gray-700 dark:text-gray-300">{new Date(selected.deadline).toLocaleDateString()}</span>
                </div>
                {selected.assignedTo?.length > 0 && (
                  <div>
                    <span className="text-gray-400 block mb-1">Assignees</span>
                    <div className="flex flex-wrap gap-1">
                      {selected.assignedTo.map(u => (
                        <span key={u._id} className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">{u.name}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card p-4 text-center text-gray-400 text-sm">
              <div className="text-3xl mb-2">📅</div>
              Click a task on the calendar to see details
            </div>
          )}

          {/* Upcoming deadlines */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Next 7 Days</h3>
            <div className="space-y-2">
              {events
                .filter(e => {
                  const d = new Date(e.date);
                  const now = new Date();
                  const week = new Date(now.getTime() + 7 * 86400000);
                  return d >= now && d <= week;
                })
                .slice(0, 5)
                .map(e => (
                  <button key={e.id} onClick={() => setSelected(e.extendedProps.task)}
                    className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-left transition-colors">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.backgroundColor }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{e.title}</p>
                      <p className="text-xs text-gray-400">{new Date(e.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </button>
                ))}
              {events.filter(e => { const d = new Date(e.date); const now = new Date(); return d >= now && d <= new Date(now.getTime() + 7 * 86400000); }).length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">No deadlines this week 🎉</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
