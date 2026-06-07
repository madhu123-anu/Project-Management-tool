import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ===== PROJECT SLICE =====
export const fetchProjects = createAsyncThunk('projects/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/projects', { params });
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchProject = createAsyncThunk('projects/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/projects/${id}`);
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const createProject = createAsyncThunk('projects/create', async (projectData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/projects', projectData);
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const updateProject = createAsyncThunk('projects/update', async ({ id, data: updateData }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/projects/${id}`, updateData);
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const deleteProject = createAsyncThunk('projects/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/projects/${id}`);
    return id;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchDashboardStats = createAsyncThunk('projects/dashboardStats', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/projects/stats/dashboard');
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const projectSlice = createSlice({
  name: 'projects',
  initialState: { list: [], current: null, stats: null, loading: false, error: null, pagination: null },
  reducers: {
    updateProjectRealtime: (state, action) => {
      const idx = state.list.findIndex(p => p._id === action.payload._id);
      if (idx !== -1) state.list[idx] = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => { state.loading = true; })
      .addCase(fetchProjects.fulfilled, (state, action) => { state.loading = false; state.list = action.payload.data; state.pagination = action.payload.pagination; })
      .addCase(fetchProjects.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchProject.fulfilled, (state, action) => { state.current = action.payload; })
      .addCase(createProject.fulfilled, (state, action) => { state.list.unshift(action.payload); })
      .addCase(updateProject.fulfilled, (state, action) => {
        const idx = state.list.findIndex(p => p._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.current?._id === action.payload._id) state.current = action.payload;
      })
      .addCase(deleteProject.fulfilled, (state, action) => { state.list = state.list.filter(p => p._id !== action.payload); })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => { state.stats = action.payload; });
  }
});
export const { updateProjectRealtime } = projectSlice.actions;
export const projectReducer = projectSlice.reducer;
export default projectReducer;
