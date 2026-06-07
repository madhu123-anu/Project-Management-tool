import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ===== NOTIFICATION SLICE =====
export const fetchNotifications = createAsyncThunk('notifications/fetch', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/notifications', { params });
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const markAsRead = createAsyncThunk('notifications/markRead', async (id) => {
  await api.put(`/notifications/${id}/read`);
  return id;
});

export const markAllAsRead = createAsyncThunk('notifications/markAllRead', async () => {
  await api.put('/notifications/read-all');
});

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { list: [], unreadCount: 0, loading: false },
  reducers: {
    addNotification: (state, action) => {
      state.list.unshift(action.payload);
      state.unreadCount += 1;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.list = action.payload.data;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const n = state.list.find(n => n._id === action.payload);
        if (n && !n.isRead) { n.isRead = true; state.unreadCount = Math.max(0, state.unreadCount - 1); }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.list.forEach(n => n.isRead = true);
        state.unreadCount = 0;
      });
  }
});

export const { addNotification } = notificationSlice.actions;
export const notificationReducer = notificationSlice.reducer;
export default notificationReducer;
