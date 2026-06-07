# 🚀 ProjectHub — Enterprise Project Management Tool

A full-stack Trello/Asana/Jira-style project management application built with React, Node.js, and MongoDB Atlas.

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Redux Toolkit, Tailwind CSS, Framer Motion, Recharts |
| Backend | Node.js, Express.js, Socket.io |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + Refresh Tokens, bcrypt |
| Real-time | Socket.io |
| File Storage | Cloudinary |
| Drag & Drop | @dnd-kit |
| Calendar | FullCalendar React |

---

## 📁 Project Structure

```
project-management/
├── backend/
│   ├── controllers/       # Route handlers
│   ├── middleware/        # Auth, error handling
│   ├── models/            # Mongoose schemas
│   ├── routes/            # Express routers
│   ├── socket/            # Socket.io manager
│   ├── utils/             # Email, notifications
│   ├── .env               # Environment variables
│   └── server.js          # Entry point
└── frontend/
    ├── public/
    └── src/
        ├── components/    # Reusable components
        ├── pages/         # Route pages
        ├── services/      # API, socket clients
        └── store/         # Redux store + slices
```

---

## ⚡ Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
```

Edit `.env` — the MongoDB URI is already configured:
```env
MONGODB_URI=mongodb+srv://madhurimallipudi6_db_user:anu@87477@cluster0.so61gxy.mongodb.net/projectmanagement?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=change_this_to_a_secure_random_string
JWT_REFRESH_SECRET=change_this_too
```

Also fill in Cloudinary credentials if you want file uploads.

```bash
npm run dev      # development (nodemon)
npm start        # production
```

Backend runs on: **http://localhost:5000**

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on: **http://localhost:3000**

---

## 👤 User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access — manage users, all projects, analytics |
| **Project Manager** | Create projects, assign tasks, manage team |
| **Team Member** | View assigned tasks, update status, comment |

Register your first account. To make yourself Admin, update directly in MongoDB Atlas:
```
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

---

## 🌐 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh-token` | Refresh JWT |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/forgot-password` | Request reset |
| POST | `/api/auth/reset-password/:token` | Reset password |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/projects/stats/dashboard` | Dashboard stats |
| POST | `/api/projects/:id/members` | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/kanban/:projectId` | Kanban view |
| PUT | `/api/tasks/:id` | Update task |
| PATCH | `/api/tasks/:id/status` | Move on Kanban |
| DELETE | `/api/tasks/:id` | Delete task |

---

## 🔌 Real-time Events (Socket.io)

| Event | Direction | Description |
|-------|-----------|-------------|
| `join_project` | Client → Server | Join project room |
| `task_created` | Server → Client | New task added |
| `task_updated` | Server → Client | Task modified |
| `task_moved` | Server → Client | Kanban drag-drop |
| `task_deleted` | Server → Client | Task removed |
| `notification` | Server → Client | New notification |
| `comment_added` | Server → Client | New comment |

---

## 🚀 Deployment

### Backend (Render/Railway)
1. Push to GitHub
2. Connect repo on Render
3. Set environment variables
4. Deploy

### Frontend (Vercel/Netlify)
1. Set `REACT_APP_API_URL=https://your-backend.render.com/api`
2. Set `REACT_APP_SOCKET_URL=https://your-backend.render.com`
3. Deploy

---

## 🔒 Security Features

- JWT access tokens (15 min) + refresh tokens (7 days)
- bcrypt password hashing (12 rounds)
- Rate limiting (100 req/15 min, 20 for auth)
- MongoDB injection sanitization
- CORS protection
- Helmet security headers
- Input validation with express-validator

---

## 📦 Features Checklist

- [x] Register / Login / Forgot Password / Reset Password
- [x] JWT Auth with refresh token rotation
- [x] Role-Based Access Control (Admin / PM / Member)
- [x] Dashboard with stats and charts
- [x] Project CRUD with filters & search
- [x] Task management with priorities and deadlines
- [x] Drag-and-drop Kanban board
- [x] Real-time updates via Socket.io
- [x] Comments with replies and @mentions
- [x] File attachments (Cloudinary)
- [x] Real-time notifications
- [x] Calendar view (FullCalendar)
- [x] Team management with role assignment
- [x] Reports: team, productivity, deadline
- [x] Export to CSV
- [x] Dark mode
- [x] Fully responsive

---

## 🛠️ Development Notes

- After changes to `.env`, restart the backend server
- Cloudinary: create a free account at cloudinary.com and fill in `.env`
- To seed test data, create projects/tasks via the UI after registering
- Socket.io uses JWT for authentication — ensure `accessToken` is in localStorage
