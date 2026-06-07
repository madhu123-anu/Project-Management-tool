import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchTasks = createAsyncThunk('tasks/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/tasks', { params });
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchKanbanTasks = createAsyncThunk('tasks/kanban', async (projectId, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/tasks/kanban/${projectId}`);
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const createTask = createAsyncThunk('tasks/create', async (taskData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/tasks', taskData);
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const updateTask = createAsyncThunk('tasks/update', async ({ id, data: updateData }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/tasks/${id}`, updateData);
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const updateTaskStatus = createAsyncThunk('tasks/updateStatus', async ({ id, status, position }, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/tasks/${id}/status`, { status, position });
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const deleteTask = createAsyncThunk('tasks/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/tasks/${id}`);
    return id;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const taskSlice = createSlice({
  name: 'tasks',
  initialState: { list: [], kanban: { todo: [], in_progress: [], review: [], completed: [] }, loading: false, error: null },
  reducers: {
    setKanban: (state, action) => { state.kanban = action.payload; },
    moveTaskLocally: (state, action) => {
      const { taskId, fromStatus, toStatus, position } = action.payload;
      const task = state.kanban[fromStatus]?.find(t => t._id === taskId);
      if (task) {
        state.kanban[fromStatus] = state.kanban[fromStatus].filter(t => t._id !== taskId);
        const updated = { ...task, status: toStatus, position };
        state.kanban[toStatus] = [...(state.kanban[toStatus] || []), updated];
      }
    },
    addTaskRealtime: (state, action) => {
      const task = action.payload;
      if (state.kanban[task.status]) state.kanban[task.status].push(task);
    },
    updateTaskRealtime: (state, action) => {
      const task = action.payload;
      Object.keys(state.kanban).forEach(col => {
        state.kanban[col] = state.kanban[col].filter(t => t._id !== task._id);
      });
      if (state.kanban[task.status]) state.kanban[task.status].push(task);
    },
    removeTaskRealtime: (state, action) => {
      const taskId = action.payload;
      Object.keys(state.kanban).forEach(col => {
        state.kanban[col] = state.kanban[col].filter(t => t._id !== taskId);
      });
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => { state.loading = true; })
      .addCase(fetchTasks.fulfilled, (state, action) => { state.loading = false; state.list = action.payload.data; })
      .addCase(fetchKanbanTasks.fulfilled, (state, action) => { state.kanban = action.payload; })
      .addCase(createTask.fulfilled, (state, action) => { state.list.push(action.payload); })
      .addCase(deleteTask.fulfilled, (state, action) => { state.list = state.list.filter(t => t._id !== action.payload); });
  }
});

export const { setKanban, moveTaskLocally, addTaskRealtime, updateTaskRealtime, removeTaskRealtime } = taskSlice.actions;
export default taskSlice.reducer;
