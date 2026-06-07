import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { fetchKanbanTasks, moveTaskLocally, updateTaskStatus, createTask, deleteTask } from '../store/slices/taskSlice';
import { fetchProject } from '../store/slices/projectSlice';
import { joinProject, leaveProject } from '../services/socket';
import toast from 'react-hot-toast';
import TaskModal from '../components/TaskModal';

const COLUMNS = [
  { id: 'todo', label: 'Todo', color: 'bg-gray-400' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { id: 'review', label: 'Review', color: 'bg-yellow-500' },
  { id: 'completed', label: 'Completed', color: 'bg-green-500' },
];

const PRIORITY_COLORS = { low: 'priority-low', medium: 'priority-medium', high: 'priority-high', critical: 'priority-critical' };

function TaskCard({ task, onOpen, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({ id: task._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isSortableDragging ? 0.4 : 1 };
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className={`bg-white dark:bg-gray-700 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-600 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg rotate-1' : ''}`}
      onClick={() => onOpen(task)}>
      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-xs bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded">{tag}</span>
          ))}
        </div>
      )}
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2 leading-snug">{task.title}</p>
      {task.description && <p className="text-xs text-gray-400 line-clamp-2 mb-2">{task.description}</p>}
      <div className="flex items-center justify-between">
        <span className={PRIORITY_COLORS[task.priority]}>{task.priority}</span>
        <div className="flex items-center gap-1.5">
          {isOverdue && <span title="Overdue" className="text-xs">🔴</span>}
          {task.deadline && <span className="text-xs text-gray-400">{new Date(task.deadline).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>}
        </div>
      </div>
      {task.assignedTo?.length > 0 && (
        <div className="flex -space-x-1 mt-2">
          {task.assignedTo.slice(0, 3).map((u, i) => (
            <div key={i} title={u.name} className="w-6 h-6 rounded-full bg-primary-100 border border-white dark:border-gray-700 flex items-center justify-center text-xs font-semibold text-primary-600">
              {u.name?.charAt(0)}
            </div>
          ))}
          {task.assignedTo.length > 3 && <div className="w-6 h-6 rounded-full bg-gray-100 border border-white text-xs flex items-center justify-center text-gray-500">+{task.assignedTo.length - 3}</div>}
        </div>
      )}
    </div>
  );
}

function Column({ column, tasks, onOpen, onAddTask }) {
  return (
    <div className="flex-1 min-w-72 max-w-80 flex flex-col">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-2.5 h-2.5 rounded-full ${column.color}`} />
        <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">{column.label}</span>
        <span className="ml-auto bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs px-2 py-0.5 rounded-full font-medium">{tasks.length}</span>
      </div>
      <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-2 min-h-64 space-y-2">
        <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task._id} task={task} onOpen={onOpen} />
          ))}
        </SortableContext>
        <button onClick={() => onAddTask(column.id)}
          className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-gray-300">
          + Add task
        </button>
      </div>
    </div>
  );
}

// TaskModal imported from components/TaskModal.jsx

export default function KanbanPage() {
  const { id: projectId } = useParams();
  const dispatch = useDispatch();
  const { kanban } = useSelector(s => s.tasks);
  const { current: project } = useSelector(s => s.projects);
  const [activeTask, setActiveTask] = useState(null);
  const [modalTask, setModalTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState('todo');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    dispatch(fetchKanbanTasks(projectId));
    dispatch(fetchProject(projectId));
    joinProject(projectId);
    return () => leaveProject(projectId);
  }, [projectId]);

  const findContainer = (id) => {
    for (const col of COLUMNS) {
      if (kanban[col.id]?.find(t => t._id === id)) return col.id;
    }
    return null;
  };

  const handleDragStart = ({ active }) => {
    const col = findContainer(active.id);
    setActiveTask(kanban[col]?.find(t => t._id === active.id));
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;
    const fromCol = findContainer(active.id);
    const toCol = COLUMNS.find(c => c.id === over.id)?.id || findContainer(over.id);
    if (!fromCol || !toCol || fromCol === toCol) return;

    const tasksInTarget = kanban[toCol] || [];
    dispatch(moveTaskLocally({ taskId: active.id, fromStatus: fromCol, toStatus: toCol, position: tasksInTarget.length }));
    dispatch(updateTaskStatus({ id: active.id, status: toCol, position: tasksInTarget.length }));
  };

  const openAddTask = (status) => { setDefaultStatus(status); setModalTask(null); setModalOpen(true); };
  const openTask = (task) => { setModalTask(task); setModalOpen(true); };

  const allMembers = [
    ...(project?.members || []),
    project?.owner ? [{ user: project.owner }] : []
  ].flat().filter(Boolean);

  return (
    <div className="space-y-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <Link to="/projects">Projects</Link>
            <span>/</span>
            <Link to={`/projects/${projectId}`}>{project?.name || '...'}</Link>
            <span>/</span>
            <span>Kanban</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kanban Board</h1>
        </div>
        <button onClick={() => openAddTask('todo')} className="btn-primary">+ Add Task</button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map(col => (
            <Column key={col.id} column={col} tasks={kanban[col.id] || []} onOpen={openTask} onAddTask={openAddTask} />
          ))}
        </div>
        <DragOverlay>
          {activeTask && (
            <div className="bg-white dark:bg-gray-700 rounded-xl p-3 shadow-2xl border border-primary-200 rotate-2 w-72">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{activeTask.title}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <AnimatePresence>
        {modalOpen && (
          <TaskModal
            task={modalTask ? { ...modalTask, status: modalTask.status || defaultStatus } : { status: defaultStatus }}
            projectId={projectId}
            projectMembers={allMembers}
            onClose={() => { setModalOpen(false); setModalTask(null); }}
            onSave={() => dispatch(fetchKanbanTasks(projectId))}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
