# E-Bringgs Technologies — Full Application Flow

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Project Structure](#2-project-structure)
3. [Startup Flow](#3-startup-flow)
4. [Authentication Flow](#4-authentication-flow)
5. [Frontend Routing & Page Map](#5-frontend-routing--page-map)
6. [Backend API Reference](#6-backend-api-reference)
7. [Feature Flows](#7-feature-flows)
8. [Data Models](#8-data-models)
9. [Real-Time (WebSocket)](#9-real-time-websocket)
10. [Security](#10-security)
11. [Environment Variables](#11-environment-variables)

---

## 1. Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                          │
│   React 18 + TypeScript + Vite + TailwindCSS v4 + Zustand          │
│   Axios (HTTP) ─────────────────────── WebSocket (WebRTC signaling)│
└─────────┬──────────────────────────────────────┬───────────────────┘
          │ HTTP (REST API)                      │ ws://
          ▼                                      ▼
┌─────────────────────────────────────┐  ┌──────────────────────┐
│       EXPRESS SERVER (:5000)        │  │  WebSocket Server    │
│  Helmet ─ CORS ─ Rate Limit ─ JSON │  │  (ws on /ws path)    │
│                                     │  │                      │
│  ┌─────────────┐  ┌──────────────┐ │  │  WebRTC Signaling:   │
│  │  Middleware  │  │  Controllers │ │  │  - join/leave room   │
│  │  auth.mid   │──│  9 files     │ │  │  - offer/answer/ICE  │
│  │  upload.mid │  │  (business   │ │  │  - chat messages     │
│  │  error.mid  │  │   logic)     │ │  │  - mute-all / kick   │
│  └─────────────┘  └──────┬───────┘ │  │  - attendance        │
│                          │         │  └──────────────────────┘
│                          ▼         │
│                   ┌────────────┐   │
│                   │  MongoDB   │   │
│                   │  Mongoose  │   │
│                   └────────────┘   │
│                                     │
│  External: Stripe API, Nodemailer   │
└─────────────────────────────────────┘
```

**Tech Stack:**
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS v4 (CSS-first, no config file), Zustand (state), React Router v6, Axios
- **Backend:** Node.js, Express, TypeScript, Mongoose (MongoDB), JWT (access + refresh), bcryptjs, Stripe, Helmet, express-rate-limit, multer, swagger-ui-express
- **Real-time:** WebSocket (`ws` library) for WebRTC signaling

---

## 2. Project Structure

```
e-bringgs/
├── package.json              # Root — runs both with `concurrently`
├── CLAUDE.md                 # Project todo / roadmap
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx          # Entry point → <App />
│   │   ├── App.tsx           # All routes (BrowserRouter)
│   │   ├── index.css         # @import "tailwindcss"
│   │   ├── types/index.ts    # Shared TS interfaces
│   │   ├── store/
│   │   │   └── auth.store.ts # Zustand auth state (persist to localStorage)
│   │   ├── services/
│   │   │   └── api.ts        # Axios instance + interceptors (auto refresh)
│   │   ├── hooks/
│   │   │   └── useSEO.ts     # document.title + meta tags
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Layout.tsx      # Navbar + Footer wrapper
│   │   │   │   ├── AdminLayout.tsx # Sidebar + Outlet for /admin/*
│   │   │   │   ├── Navbar.tsx      # Top nav with auth dropdown
│   │   │   │   └── Footer.tsx      # Site footer
│   │   │   └── ui/
│   │   │       ├── LoadingSpinner.tsx
│   │   │       ├── EmptyState.tsx
│   │   │       └── ErrorMessage.tsx
│   │   └── pages/            # All page components (see Section 5)
│   └── vite.config.ts        # @tailwindcss/vite plugin
│
└── backend/
    ├── src/
    │   ├── index.ts           # HTTP server + WebSocket setup
    │   ├── app.ts             # Express app (middleware + route mounting)
    │   ├── types.ts           # AuthRequest interface
    │   ├── config/
    │   │   ├── db.ts          # Mongoose connection
    │   │   └── swagger.ts     # OpenAPI 3.0 spec
    │   ├── middleware/
    │   │   ├── auth.middleware.ts   # JWT verify (protect) + role check (authorize)
    │   │   ├── error.middleware.ts  # AppError class + global error handler
    │   │   └── upload.middleware.ts # Multer config (disk, 50MB, MIME allowlist)
    │   ├── models/            # Mongoose schemas (see Section 8)
    │   ├── controllers/       # Business logic (9 files, see Section 6)
    │   ├── routes/            # Thin route declarations (middleware + controller)
    │   ├── signaling/
    │   │   └── server.ts      # WebSocket signaling logic
    │   └── utils/
    │       └── email.ts       # Nodemailer templates
    └── uploads/               # File upload directory (local disk)
```

---

## 3. Startup Flow

### `npm run dev` (from project root)

```
concurrently runs:
  ├── frontend: vite dev server → localhost:5173
  └── backend:  ts-node/nodemon → localhost:5000
```

### Backend startup sequence:

```
index.ts
  │
  ├── dotenv.config()            # Load .env
  ├── connectDB()                # Mongoose → MongoDB
  │     └── mongoose.connect(MONGODB_URI)
  ├── createServer(app)          # HTTP server wrapping Express
  ├── new WebSocketServer(...)   # ws on /ws path
  │     └── setupSignalingServer(wss)
  └── httpServer.listen(5000)
```

### Express middleware stack (in order):

```
app.ts
  │
  1. helmet()                       # Security headers
  2. cors({ origin, credentials })  # CORS for frontend
  3. rateLimit(100 req / 15 min)    # Rate limiting on /api
  4. /api/payments/webhook          # RAW body (before JSON parser)
  5. express.json({ limit: 10mb })  # JSON body parser
  6. express.urlencoded()           # Form body parser
  7. morgan('dev')                  # Request logging
  8. Route handlers                 # /api/auth, /api/users, etc.
  9. /uploads (static)              # Serve uploaded files
  10. /api/docs (Swagger UI)        # API documentation
  11. 404 handler                   # Catch-all
  12. errorHandler                  # Global error handler
```

### Frontend startup sequence:

```
main.tsx
  └── createRoot(#root).render(<App />)
        └── BrowserRouter → Routes → matched page component
              └── Each page fetches from api.ts (Axios → localhost:5000/api)
```

---

## 4. Authentication Flow

### Registration
```
User fills Register form
  │
  ├── POST /api/auth/register  { name, email, password, role }
  │     ├── Zod validation
  │     ├── Check email uniqueness
  │     ├── User.create() — password auto-hashed by pre-save hook (bcrypt, 12 rounds)
  │     ├── Generate emailVerificationToken → send verification email (Nodemailer)
  │     ├── Sign JWT access token (15 min) + refresh token (7 days)
  │     └── Return { user, accessToken, refreshToken }
  │
  └── Zustand store saves tokens to localStorage + state
        └── User is now authenticated → redirected to /dashboard
```

### Login
```
POST /api/auth/login  { email, password }
  ├── Find user by email (with +password select)
  ├── bcrypt.compare(password, user.password)
  ├── Sign access + refresh tokens
  └── Return { user, accessToken, refreshToken }
```

### Token Refresh (automatic)
```
Axios interceptor detects 401 response
  ├── POST /api/auth/refresh  { refreshToken }
  │     ├── Verify refresh token (jwt.verify)
  │     ├── Sign new access token
  │     └── Return { accessToken }
  └── Retry original request with new token
      └── If refresh fails → clear localStorage → redirect to /login
```

### Protected Routes (Backend)
```
protect middleware:
  ├── Extract Bearer token from Authorization header
  ├── jwt.verify(token, JWT_SECRET)
  ├── Attach { userId, role } to req.user
  └── next()

authorize('admin') middleware:
  ├── Check req.user.role === 'admin'
  └── 403 if not
```

### Password Reset
```
POST /api/auth/forgot-password  { email }
  ├── Generate reset token + expiry (1 hour)
  ├── Save to user document
  └── Send reset email with link: /reset-password?token=xxx

POST /api/auth/reset-password  { token, password }
  ├── Find user by token + check expiry
  ├── Set new password (auto-hashed by pre-save hook)
  └── Clear reset token fields
```

### Email Verification
```
GET /api/auth/verify-email?token=xxx
  ├── Find user by emailVerificationToken
  ├── Set isEmailVerified = true
  └── Clear token
```

---

## 5. Frontend Routing & Page Map

### Standalone pages (no navbar/footer):

| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | `Login` | Email/password form |
| `/register` | `Register` | Name, email, password, role selector |
| `/forgot-password` | `ForgotPassword` | Email input → sends reset link |
| `/reset-password` | `ResetPassword` | New password form (token from URL) |
| `/verify-email` | `VerifyEmail` | Auto-verifies on load (token from URL) |
| `/checkout` | `Checkout` | Stripe Elements payment form |
| `/payment/success` | `PaymentSuccess` | Success confirmation |
| `/payment/failed` | `PaymentFailed` | Failure message + retry |
| `/classroom/:roomId` | `Classroom` | Full-screen WebRTC video room |

### Public layout (Navbar + Footer):

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Landing` | Hero, services preview, CTA |
| `/pricing` | `Pricing` | Plan cards + FAQ accordion |
| `/services` | `Services` | Filterable service catalog + inquiry modal |
| `/services/:id` | `ServiceDetail` | Single service detail |
| `/courses` | `Courses` | Search, filter, paginated course grid |
| `/courses/:slug` | `CourseDetail` | Modules accordion, enroll button |
| `/blog` | `Blog` | Search, category pills, paginated posts |
| `/blog/:slug` | `BlogPost` | Full markdown-rendered article |
| `/about` | `About` | Company info |
| `/contact` | `Contact` | Contact form |
| `/terms` | `Terms` | Terms of service |
| `/privacy` | `Privacy` | Privacy policy |
| `/dashboard` | `Dashboard` | 5 tabs: Overview, My Courses, Resources, Schedule, Assignments |
| `/profile` | `Profile` | Edit name/bio, change password, email verification status |
| `/certificate/:courseId` | `Certificate` | Printable completion certificate |

### Admin layout (dark sidebar):

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin` | `AdminOverview` | Stats cards (users, courses, revenue, etc.) from DB |
| `/admin/users` | `AdminUsers` | User table, role assignment dropdown |
| `/admin/courses` | `AdminCourses` | Course CRUD, links to modules + cohort |
| `/admin/courses/:id/modules` | `AdminCourseModules` | Drag-drop modules & lessons editor |
| `/admin/courses/:id/cohort` | `AdminCohort` | Enrolled students table, remove student |
| `/admin/assignments` | `AdminAssignments` | Review submissions, give feedback + grade |
| `/admin/live-sessions` | `AdminLiveSessions` | Schedule live classes, generate room links |
| `/admin/blogs` | `AdminBlogs` | Blog post CRUD |
| `/admin/payments` | `AdminPayments` | Transaction history table |
| `/admin/service-requests` | `AdminServiceRequests` | Inquiries list with status management |
| `/admin/settings` | `AdminSettings` | System config overview + .env checklist |

---

## 6. Backend API Reference

### Auth (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | - | Create account (Zod validated) |
| POST | `/login` | - | Get tokens |
| POST | `/refresh` | - | Refresh access token |
| POST | `/forgot-password` | - | Send reset email |
| POST | `/reset-password` | - | Set new password |
| GET | `/verify-email` | - | Verify email token |
| GET | `/me` | JWT | Get current user profile |

### Users (`/api/users`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Admin | List all users |
| PATCH | `/profile` | JWT | Update own name/bio/avatar |
| PATCH | `/change-password` | JWT | Change own password |
| PATCH | `/:id/role` | Admin | Assign role to user |

### Courses (`/api/courses`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | - | List published courses (search, filter, paginate) |
| GET | `/:slug` | - | Get single course by slug |
| POST | `/` | Admin | Create course |
| PATCH | `/:id` | Admin | Update course |
| DELETE | `/:id` | Admin | Delete course |
| GET | `/:id/modules` | Admin | Get modules + lessons |
| PUT | `/:id/modules` | Admin | Replace all modules |
| POST | `/:id/enroll` | Student | Enroll in course |

### Blog (`/api/blogs`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | - | List published posts (search, category, tag, paginate) |
| GET | `/:slug` | - | Get post by slug (increments views) |
| POST | `/` | Admin | Create post |
| PATCH | `/:id` | Admin | Update post |
| DELETE | `/:id` | Admin | Delete post |

### Services (`/api/services`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | - | Get service catalog (in-memory array) |
| POST | `/inquire` | - | Submit inquiry (saved to MongoDB) |
| GET | `/:id` | - | Get single service |

### Payments (`/api/payments`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/create-intent` | JWT | Create Stripe PaymentIntent |
| GET | `/transactions` | JWT | Get user's transactions |
| POST | `/webhook` | - | Stripe webhook (raw body, signature verified) |

### Assignments (`/api/assignments`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Student | Submit assignment (multipart with file) |
| GET | `/my` | Student | Get own assignments |
| GET | `/` | Admin | Get all assignments (filter by course/status) |
| PATCH | `/:id/review` | Admin | Add feedback + grade |

### Upload (`/api/upload`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | JWT | Upload single file → `/uploads/<filename>` |

### Admin (`/api/admin`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/stats` | Admin | Dashboard stats (all counts + revenue aggregate) |
| GET | `/inquiries` | Admin | List service inquiries |
| PATCH | `/inquiries/:id/status` | Admin | Update inquiry status |
| GET | `/cohorts` | Admin | List courses with enrollment counts |
| GET | `/cohorts/:id/students` | Admin | Enrolled students for a course |
| DELETE | `/cohorts/:id/students/:userId` | Admin | Remove student from cohort |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/docs` | Swagger UI |
| GET | `/uploads/*` | Static file serving |

---

## 7. Feature Flows

### Course Enrollment
```
Student on CourseDetail page
  │
  ├── Click "Enroll" button
  ├── POST /api/courses/:id/enroll  (JWT)
  │     ├── Find course by ID
  │     ├── Check not already enrolled (409 if so)
  │     ├── Push userId to course.enrolledStudents[]
  │     └── Save → 200 "Enrolled successfully"
  │
  └── Frontend redirects to /dashboard → "My Courses" tab shows new course
```

### Assignment Submission
```
Student on Dashboard → Assignments tab
  │
  ├── Click "New submission"
  ├── Fill title, select course, description, attach file
  ├── POST /api/assignments (multipart/form-data, JWT)
  │     ├── multer processes file → /uploads/<filename>
  │     ├── Assignment.create({ student, course, title, fileUrl, fileName })
  │     └── 201 → assignment object
  │
  └── Assignment appears in list with status "submitted"

Admin reviews:
  ├── PATCH /api/assignments/:id/review { feedback, grade }
  │     └── Sets status: 'reviewed', reviewedBy, reviewedAt
  └── Student sees feedback + grade in dashboard
```

### Stripe Payment
```
User on Pricing page → clicks "Get started"
  │
  ├── Redirected to /checkout with plan details in URL params
  ├── POST /api/payments/create-intent { amount, currency, description }
  │     └── stripe.paymentIntents.create() → clientSecret
  │
  ├── Frontend renders Stripe Elements <CardElement>
  ├── User enters card → stripe.confirmCardPayment(clientSecret)
  │     ├── Success → redirect to /payment/success
  │     └── Failure → redirect to /payment/failed
  │
  └── Stripe sends webhook event:
        POST /api/payments/webhook (raw body + signature verification)
          ├── payment_intent.succeeded → Transaction status = 'succeeded'
          └── payment_intent.payment_failed → Transaction status = 'failed'
```

### Service Inquiry
```
Visitor on Services page
  │
  ├── Click "Request Service" on a card
  ├── Modal opens: name, email, message fields
  ├── POST /api/services/inquire { name, email, serviceId, message }
  │     ├── Validate required fields
  │     ├── Match serviceId → serviceName from catalog
  │     └── ServiceInquiry.create() → saved to MongoDB
  │
  └── Admin sees it in /admin/service-requests
        ├── Status: new → contacted → closed
        └── PATCH /api/admin/inquiries/:id/status
```

### Blog Reading
```
Visitor on /blog
  │
  ├── Search bar, category pills, pagination
  ├── GET /api/blogs?search=...&category=...&page=1&limit=6
  │     └── Returns paginated posts (content excluded for list)
  │
  └── Click post → /blog/:slug
        └── GET /api/blogs/:slug
              ├── Increments views counter ($inc: { views: 1 })
              └── Returns full post with content (rendered as markdown)
```

### Live Classroom (WebRTC)
```
Instructor creates session in /admin/live-sessions
  └── Generates room link: /classroom/:roomId

Student/Instructor opens /classroom/:roomId
  │
  ├── WebSocket connects to ws://localhost:5000/ws
  ├── Sends: { type: 'join', roomId, userId, name, role }
  │
  ├── WebRTC flow:
  │     ├── New user joins → server broadcasts 'user-joined' to room
  │     ├── Existing peers send 'offer' → new peer returns 'answer'
  │     ├── ICE candidates exchanged via 'ice-candidate' messages
  │     └── Peer-to-peer video/audio streams established
  │
  ├── Features:
  │     ├── Camera toggle (on/off)
  │     ├── Microphone toggle (on/off)
  │     ├── Screen sharing (replaces camera track)
  │     ├── Chat messages (via WebSocket, not WebRTC)
  │     ├── Instructor: "Mute all" → server sends mute to all peers
  │     ├── Instructor: "Kick" user → server sends kick event
  │     └── Attendance panel (shows who joined/left + timestamps)
  │
  └── On leave: sends { type: 'leave' } → server cleans up
```

---

## 8. Data Models

### User
```
name            String (required)
email           String (required, unique, lowercase)
password        String (required, select: false, bcrypt hashed)
role            Enum: 'admin' | 'student' | 'client' (default: 'student')
avatar          String (URL)
bio             String
isEmailVerified Boolean (default: false)
emailVerificationToken   String (select: false)
passwordResetToken       String (select: false)
passwordResetExpires     Date (select: false)
createdAt, updatedAt     (timestamps: true)
```

### Course
```
title              String (required)
slug               String (unique, auto-generated)
description        String (required)
thumbnail          String
instructor         ObjectId → User
category           String (required)
price              Number (default: 0)
isFree             Boolean (default: true)
isPublished        Boolean (default: false)
tags               [String]
cohortStartDate    Date
cohortEndDate      Date
enrolledStudents   [ObjectId → User]
modules            [{ title, description, order, lessons: [{ title, content, videoUrl, duration, order }] }]
createdAt, updatedAt
```

### Blog
```
title         String (required)
slug          String (unique, auto-generated)
content       String (required, markdown)
excerpt       String
author        ObjectId → User
category      String
tags          [String]
isPublished   Boolean (default: false)
publishedAt   Date
views         Number (default: 0)
createdAt, updatedAt
```

### Transaction
```
user                    ObjectId → User
stripePaymentIntentId   String (unique)
amount                  Number (required)
currency                String (default: 'usd')
status                  Enum: 'pending' | 'succeeded' | 'failed' (default: 'pending')
type                    Enum: 'one_time' | 'subscription'
description             String
createdAt, updatedAt
```

### Assignment
```
student       ObjectId → User (required)
course        ObjectId → Course (required)
title         String (required)
description   String
fileUrl       String
fileName      String
status        Enum: 'submitted' | 'reviewed' (default: 'submitted')
feedback      String
grade         String
reviewedBy    ObjectId → User
reviewedAt    Date
submittedAt   Date (default: now)
createdAt, updatedAt
```

### ServiceInquiry
```
name          String (required)
email         String (required)
serviceId     String
serviceName   String
message       String (required)
status        Enum: 'new' | 'contacted' | 'closed' (default: 'new')
createdAt, updatedAt
```

---

## 9. Real-Time (WebSocket)

**Path:** `ws://localhost:5000/ws`

### Message Types (Client → Server)
```json
{ "type": "join",          "roomId": "...", "userId": "...", "name": "...", "role": "instructor|student" }
{ "type": "leave",         "roomId": "..." }
{ "type": "offer",         "roomId": "...", "targetId": "...", "sdp": "..." }
{ "type": "answer",        "roomId": "...", "targetId": "...", "sdp": "..." }
{ "type": "ice-candidate", "roomId": "...", "targetId": "...", "candidate": "..." }
{ "type": "chat",          "roomId": "...", "message": "..." }
{ "type": "mute-all",      "roomId": "..." }
{ "type": "kick",          "roomId": "...", "targetId": "..." }
```

### Message Types (Server → Client)
```json
{ "type": "user-joined",   "userId": "...", "name": "...", "role": "..." }
{ "type": "user-left",     "userId": "..." }
{ "type": "offer",         "fromId": "...", "sdp": "..." }
{ "type": "answer",        "fromId": "...", "sdp": "..." }
{ "type": "ice-candidate", "fromId": "...", "candidate": "..." }
{ "type": "chat",          "fromId": "...", "name": "...", "message": "...", "timestamp": "..." }
{ "type": "mute-all" }
{ "type": "kicked" }
{ "type": "room-users",    "users": [...] }
```

---

## 10. Security

| Layer | Implementation |
|-------|---------------|
| **Auth** | JWT access tokens (15 min) + refresh tokens (7 days) |
| **Passwords** | bcryptjs with 12 salt rounds |
| **Headers** | Helmet (all secure headers) |
| **CORS** | Origin restricted to CLIENT_URL env var |
| **Rate Limiting** | 100 requests / 15 minutes per IP on /api |
| **Input Validation** | Zod schemas on auth routes |
| **File Upload** | MIME allowlist (images, PDF, MP4), 50MB max |
| **Stripe Webhook** | Signature verification with STRIPE_WEBHOOK_SECRET |
| **Tokens** | Access token in Authorization header, refresh in request body |
| **Password Fields** | `select: false` in Mongoose — never sent to client |

---

## 11. Environment Variables

### Backend `.env`
```env
# Database
MONGODB_URI=mongodb://localhost:27017/ebringgs

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Nodemailer)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=ebringgstechnologies@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM=E-Bringgs <ebringgstechnologies@gmail.com>

# App
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

---

## Quick Start

```bash
# 1. Clone and install
npm install
cd frontend && npm install
cd ../backend && npm install

# 2. Set up environment
cp backend/.env.example backend/.env   # Edit with your values

# 3. Run both (from project root)
npm run dev

# Frontend: http://localhost:5173
# Backend:  http://localhost:5000
# API Docs: http://localhost:5000/api/docs
# WebSocket: ws://localhost:5000/ws
```
