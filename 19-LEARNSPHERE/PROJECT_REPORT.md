# LearnSphere — Learning Management System (LMS)
# Comprehensive Project Report

---

## 1. Project Overview

**Learnsphere** is a modern, AI-integrated Learning Management System (LMS) built as a full-featured web application. It provides a complete educational ecosystem supporting **Learners**, **Instructors**, and **Administrators** with role-based access, interactive course delivery, gamification, and an AI-powered academic assistant.

| Detail | Description |
|---|---|
| **Project Name** | LearnSphere |
| **Type** | Learning Management System (LMS) Web Application |
| **Platform** | Web (Responsive — Desktop & Mobile) |
| **Deployment** | Vite-based SPA with Firebase Backend |
| **AI Model** | Llama 3.3 70B Instruct (via Qubrid Platform) |
| **Theme** | Light/Dark/System — switchable |

---

## 2. Technology Stack

### 2.1 Frontend Stack

| Technology | Version | Purpose |
|---|---|---|
| **React** | 18.3 | Core UI library for building component-based interfaces |
| **TypeScript** | 5.8 | Type-safe JavaScript for robust, maintainable code |
| **Vite** | 5.4 | Modern build tool — fast HMR, optimized production bundles |
| **Tailwind CSS** | 3.4 | Utility-first CSS framework for rapid, responsive styling |
| **React Router DOM** | 6.30 | Client-side routing with nested layouts and route protection |
| **Radix UI** | Latest | Accessible, unstyled UI primitives (Dialog, Dropdown, Tabs, etc.) |
| **Shadcn/UI** | Custom | Pre-built, customizable component library built on Radix UI |
| **Lucide React** | 0.462 | Modern icon library (500+ icons) |
| **Recharts** | 2.15 | Data visualization and charting library |
| **Framer Motion** | — | Smooth animations and micro-interactions |
| **TanStack React Query** | 5.83 | Server state management, caching, and data fetching |
| **React Hook Form + Zod** | Latest | Form management with schema-based validation |
| **Sonner** | 1.7 | Beautiful toast notification system |
| **Canvas Confetti** | 1.9 | Celebration effects for gamification achievements |

### 2.2 Backend Stack (BaaS — Backend as a Service)

| Technology | Purpose |
|---|---|
| **neon auth Authentication** | User registration, login, session management |
| **neon postgresql Database** | Profile storage, user data persistence |

### 2.3 AI / Machine Learning Stack

| Technology | Purpose |
|---|---|
| **Qubrid Platform API** | AI inference endpoint (OpenAI-compatible) |
| **Llama 3.3 70B Instruct** (Meta) | Large Language Model powering the AI Assistant |
| **Vite Dev Proxy** | Proxies API calls to avoid CORS issues in development |

### 2.4 Development & Testing Tools

| Tool | Purpose |
|---|---|
| **ESLint** | Code quality and linting |
| **Vitest** | Unit testing framework |
| **PostCSS + Autoprefixer** | CSS processing and browser compatibility |

---

## 3. Authentication System

### 3.1 Authentication Provider
The application uses **Firebase Authentication** for secure user management.

### 3.2 Types of Login

| Login Type | Description | How It Works |
|---|---|---|
| **Email + Password Login** | Traditional email/password authentication | Users enter email and password; neon auth validates credentials via `signInWithEmailAndPassword()` |
| **Email + Password Registration** | New account creation | Users provide name, email, password, and select a role; neon auth creates the account via `createUserWithEmailAndPassword()` |
| **Role-Based Login** | Users select their role before logging in | A visual **Role Selector** component lets users choose: Learner, Instructor, or Admin before signing in |

### 3.3 User Roles

| Role | Icon | Access Level | Description |
|---|---|---|---|
| **Learner** 🎓 | GraduationCap | Standard | Access courses, track progress, earn badges, take quizzes |
| **Instructor** 📽️ | Projector | Elevated | Create/edit courses, manage students, view reports |
| **Admin** 🛡️ | ShieldCheck | Full | System configuration, user management, complete oversight |
| **Guest** | — | Read-only | Browse courses catalog (no enrollment) |

### 3.4 Authentication Flow

```
User Opens App
    ↓
AuthContext checks neon auth state (onAuthStateChanged)
    ↓
If Authenticated → Redirect to Dashboard / My Courses
If Not Authenticated → Show Login Page
    ↓
User selects Role → Enters Email + Password → Submits
    ↓
neon auth validates → Auth State updates → User enters app
    ↓
Protected Routes check role → Grant/Deny access
```

### 3.5 Route Protection
- **ProtectedRoute**: Requires authentication; optionally checks user role
- **AuthRoute**: Redirects already-logged-in users away from login/register pages
- **Role-Based Guards**: Backoffice routes require `admin` or `instructor` roles

---

## 4. AI Agent — LearnSphere AI Assistant

### 4.1 Overview
The AI Assistant is an **always-available, floating chatbot** powered by **Meta's Llama 3.3 70B Instruct** model through the **Qubrid Platform API**.

### 4.2 AI Architecture

```
User sends message
    ↓
AIChatBot Component (React State)
    ↓
askAI() function (src/api/ai.ts)
    ↓
Vite Proxy (/api/qubrid → platform.qubrid.com/v1)
    ↓
Qubrid Platform API
    ↓
Llama 3.3 70B Instruct Model
    ↓
Response displayed in ChatWindow
```

### 4.3 AI Model Configuration

| Parameter | Value |
|---|---|
| **Model** | meta-llama/Llama-3.3-70B-Instruct |
| **Platform** | Qubrid (platform.qubrid.com) |
| **API Format** | OpenAI-compatible Chat Completions |
| **Max Tokens** | 4096 |
| **Temperature** | 0.7 |
| **Top P** | 0.9 |
| **Timeout** | 60 seconds |
| **Retries** | 2 retries with exponential backoff |

### 4.4 AI Capabilities

| Capability | Description |
|---|---|
| **Course Guidance** | Suggests courses, explains learning roadmaps, recommends based on skill level |
| **Score & Progress Analysis** | Analyzes learner performance, identifies improvement areas |
| **Concept Explanation** | Explains technical topics with simple examples and summaries |
| **Study Planner** | Creates weekly study plans, time management suggestions |
| **FAQ Support** | Course availability, certification info, enrollment help |

### 4.5 AI Safety Rules
- Only discusses **education and learning-related** topics
- Politely redirects unrelated queries
- Responses are structured with markdown, bullet points, and numbered lists
- Maintains a **professional, supportive, motivating** tone

### 4.6 AI Components

| Component | File | Description |
|---|---|---|
| **AIChatBot** | `components/ai/AIChatBot.tsx` | Main controller — manages state, message history, API calls |
| **ChatWindow** | `components/ai/ChatWindow.tsx` | Chat UI — message area, input, quick actions |
| **FloatingButton** | `components/ai/FloatingButton.tsx` | Floating action button (bottom-right) to open/close chat |
| **MessageBubble** | `components/ai/MessageBubble.tsx` | Individual message rendering with markdown support |
| **AI Service** | `api/ai.ts` | API integration — request building, error handling, retries |

### 4.7 Why Qubrid + Llama 3.3 70B?
- **Open-source model**: Meta's Llama is free and powerful
- **70B parameters**: High-quality, nuanced responses for academic content
- **OpenAI-compatible API**: Standard interface, easy to integrate
- **Cost-effective**: Qubrid provides affordable serverless inference
- **No vendor lock-in**: Can switch to other OpenAI-compatible providers easily

---

## 5. Main Features of the Web Application

### 5.1 Landing Page (Home)
- Hero section with animated call-to-action
- Feature highlights (Course Guidance, Score Analysis, Study Planning, etc.)
- Interactive cards with hover effects
- Learning roadmap visualization
- Floating blob animations for modern aesthetics

### 5.2 Course Catalog
- Browse all available courses with search and filtering
- Filter by tags: React, JavaScript, TypeScript, Design, Node.js, Python, AI, Mobile, DevOps, Marketing
- Course cards showing: title, description, instructor, rating, enrolled count, duration
- Animated card interactions

### 5.3 Course Detail Page
- Complete course information with curriculum breakdown
- Lesson list with type indicators (Video 🎬, Document 📄, Image 🖼️, Quiz ❓)
- Instructor profile and course reviews
- Enrollment / Purchase flow
- Start Learning button for enrolled users
- Review submission system with star ratings

### 5.4 Lesson Player
- Full-screen, immersive lesson experience
- Supports 4 lesson types:
  - **Video**: Embedded video player
  - **Document**: PDF/document viewer with download option
  - **Image**: Image viewer
  - **Quiz**: Interactive quiz experience
- Progress tracking per lesson
- Navigation (Previous / Next lesson)
- Sidebar with lesson list and completion status
- Mark as complete functionality
- Gamification popup on course completion

### 5.5 Quiz System
- Multiple-choice questions with single/multiple correct answers
- Progress bar showing current question position
- Score calculation with attempt-based rewards:
  - 1st attempt: 30 points
  - 2nd attempt: 20 points
  - 3rd attempt: 10 points
  - 4th+ attempt: 5 points
- Result screen with confetti celebration animation
- Badge and points integration

### 5.6 My Courses Dashboard
- View all enrolled courses
- Track progress (Yet to Start, In Progress, Completed)
- Continue learning from where left off
- Time spent tracking

### 5.7 Gamification System

#### Badge System (6 Levels)
| Badge | Level | Required Points | Icon |
|---|---|---|---|
| Newbie | 1 | 20 | 🌱 |
| Explorer | 2 | 40 | 🔍 |
| Achiever | 3 | 60 | ⭐ |
| Specialist | 4 | 80 | 🎯 |
| Expert | 5 | 100 | 💎 |
| Master | 6 | 120 | 👑 |

#### Achievement Badges (15 Unique Badges)
| Badge Name | Condition |
|---|---|
| First Launch | Logged in for the first time |
| Course Starter | Started first course |
| Consistency King | 7-day learning streak |
| Night Owl | Studied after midnight |
| Finisher | Completed a full course |
| Course Explorer | Started 5 different courses |
| Daily Grinder | Learned every day for 3 days |
| Knowledge Seeker | Started 3 different courses |
| Halfway Hero | Reached 50% in any course |
| Streak Master | 14-day learning streak |
| Early Bird | Studied before 6 AM |
| Marathon Learner | Spent long hours learning |
| Curious Mind | Explored multiple topics |
| Focused Student | Completed lessons without skipping |
| Legendary Learner | Elite learning achievement |

#### Gamification Panel
- Visual progress bar to next badge
- Points display
- Unlocked vs locked badge indicators
- Animated badge cards with glow effects

### 5.8 Settings Page
- **Profile Management**: Display name, username, email, phone, bio, location, interests
- **Profile Photo**: Upload and change avatar
- **Security**: Password change functionality
- **Theme Preference**: Light / Dark / System toggle
- **Data**: Saved to Firebase Realtime Database

### 5.9 Theme System
- **Light Mode**: Clean, professional appearance
- **Dark Mode**: Reduced eye strain, modern look
- **System Mode**: Automatically follows OS preference
- Smooth transition effects between themes
- Persistent preference stored in localStorage

### 5.10 AI Learning Assistant (Chat)
- Floating action button accessible from every page
- Chat window with quick action suggestions
- Conversation history within session
- Typing indicator with animated dots
- Clear chat functionality
- Keyboard shortcut (ESC to close)
- Unread message indicator
- Mobile-responsive (full-width bottom sheet on mobile)

---

## 6. Backoffice (Admin/Instructor Panel)

### 6.1 Dashboard
- Overview statistics: Total Participants, Yet to Start, In Progress, Completed
- Tabular learner data with customizable columns
- Filters: Course name, Status, Date range, Search
- Column visibility customization

### 6.2 Course Management
- Create/Edit/Delete courses
- Course editor with lesson management
- Drag-and-drop lesson ordering
- Set course visibility, access rules, and pricing

### 6.3 Learner Management
- View all enrolled learners
- Track individual progress
- Export learner reports

### 6.4 Instructor Management
- Add/Remove instructors
- Assign courses to instructors
- View instructor performance

### 6.5 Reports
- Course completion reports
- Learner activity analytics
- Time spent analysis
- Progress distribution charts

---

## 7. Application Architecture

### 7.1 Folder Structure

```
src/
├── api/                    # API services
│   ├── ai.ts               # Qubrid AI integration
│   └── profileService.ts   # Firebase profile CRUD
├── components/             # Reusable UI components
│   ├── ai/                 # AI chatbot components
│   ├── auth/               # Authentication components
│   ├── courses/            # Course-related components
│   ├── gamification/       # Badge & points components
│   ├── home/               # Landing page components
│   ├── layout/             # Navbar, sidebar, layouts
│   └── ui/                 # 55+ Shadcn/UI components
├── contexts/               # React Context providers
│   ├── AuthContext.tsx      # Auth state management
│   └── ThemeContext.tsx     # Theme state management
├── data/                   # Mock data
│   └── mockData.ts         # Courses, lessons, quizzes, reviews
├── hooks/                  # Custom React hooks
│   ├── use-mobile.tsx       # Mobile detection hook
│   └── use-toast.ts        # Toast notification hook
├── lib/                    # Shared utilities
│   ├── firebase.ts         # Firebase initialization
│   └── utils.ts            # Utility functions
├── pages/                  # Page-level components
│   ├── HomePage.tsx         # Landing page
│   ├── CoursesPage.tsx      # Course catalog
│   ├── CourseDetailPage.tsx  # Individual course view
│   ├── LessonPlayerPage.tsx  # Lesson player
│   ├── QuizPage.tsx         # Quiz experience
│   ├── LoginPage.tsx        # Login page
│   ├── RegisterPage.tsx     # Registration page
│   ├── MyCoursesPage.tsx    # Enrolled courses
│   ├── BadgesPage.tsx       # Achievements & badges
│   ├── SettingsPage.tsx     # User settings
│   └── backoffice/          # Admin panel pages
│       ├── BackofficeDashboard.tsx
│       ├── BackofficeCoursesPage.tsx
│       ├── CourseEditorPage.tsx
│       ├── BackofficeLearnersPage.tsx
│       ├── BackofficeInstructorsPage.tsx
│       └── BackofficeReportsPage.tsx
├── types/                  # TypeScript type definitions
└── test/                   # Unit tests
```

### 7.2 State Management Strategy

| State Type | Solution | Example |
|---|---|---|
| **Auth State** | React Context (AuthContext) | User info, login status, role, points |
| **Theme State** | React Context (ThemeContext) | Light/Dark/System preference |
| **Server State** | TanStack React Query | API data fetching and caching |
| **Form State** | React Hook Form + Zod | Login/Register forms with validation |
| **Local State** | React useState | Component-level UI state |
| **Persistent State** | localStorage + Firebase | User preferences, profile data |

---

## 8. Security Measures

| Measure | Implementation |
|---|---|
| **API Key Protection** | All API keys stored in `.env` file, never committed to Git |
| **Git Security** | `.env` listed in `.gitignore`, only `.env.example` with placeholders is tracked |
| **Firebase Auth** | Secure authentication with Firebase's built-in security |
| **Route Guards** | Protected routes with role-based access control |
| **CORS Handling** | Vite proxy for secure API communication in development |
| **Input Validation** | Zod schema validation on forms |

---

## 9. Why These Technologies Were Chosen

| Technology | Reason |
|---|---|
| **React** | Most popular UI library; large ecosystem, reusable components, virtual DOM performance |
| **TypeScript** | Catches bugs at compile time; better IDE support; self-documenting code |
| **Vite** | Blazing fast dev server with HMR; optimized production builds; modern ES module support |
| **Tailwind CSS** | Rapid prototyping; consistent design system; responsive utilities out of the box |
| **Firebase** | Zero-server backend; built-in auth, database, and analytics; free tier available |
| **Llama 3.3 70B** | State-of-the-art open-source LLM; excellent for educational content; no API cost per token (via Qubrid) |
| **Qubrid Platform** | OpenAI-compatible API; affordable serverless GPU inference; easy integration |
| **Shadcn/UI + Radix** | Accessible, customizable components; professional design without heavy CSS frameworks |
| **React Router** | Industry-standard routing; nested layouts; route guards; lazy loading support |

---

## 10. Key Highlights

1. **AI-Powered Learning**: Integrated Llama 3.3 70B AI assistant that provides personalized academic support 24/7
2. **Role-Based Access**: Three distinct user roles (Learner, Instructor, Admin) with tailored experiences
3. **Gamification**: Point system, 6-level badges, 15 achievement badges, confetti celebrations
4. **Responsive Design**: Fully responsive across desktop, tablet, and mobile devices
5. **Theme Support**: Light, Dark, and System theme modes with smooth transitions
6. **Modern UI/UX**: Clean design with animations, glassmorphism effects, and micro-interactions
7. **Secure Architecture**: API keys protected via environment variables, Firebase authentication, route guards
8. **Comprehensive Backoffice**: Full admin panel with dashboard, course editor, reports, and learner management
9. **Interactive Quizzes**: Multiple-choice quizzes with attempt-based reward system
10. **Real-time Features**: Firebase Realtime Database for instant data synchronization

---

## 11. Pages Summary

| Page | Route | Access | Description |
|---|---|---|---|
| Home | `/` | Public | Landing page with hero, features, roadmap |
| Courses | `/courses` | Public | Course catalog with search and filters |
| Course Detail | `/course/:id` | Public | Full course info, curriculum, reviews |
| Login | `/login` | Guest Only | Email + Password login with role selector |
| Register | `/register` | Guest Only | New account creation |
| My Courses | `/my-courses` | Auth Required | Enrolled courses dashboard |
| Lesson Player | `/course/:id/learn` | Auth Required | Full-screen lesson experience |
| Quiz | `/course/:id/quiz/:id` | Auth Required | Interactive quiz |
| Badges | `/badges` | Auth Required | Achievements and badge gallery |
| Settings | `/settings` | Auth Required | Profile, security, theme settings |
| Backoffice Dashboard | `/backoffice` | Admin/Instructor | Analytics and learner overview |
| Backoffice Courses | `/backoffice/courses` | Admin/Instructor | Course management |
| Course Editor | `/backoffice/courses/:id` | Admin/Instructor | Create/Edit courses and lessons |
| Backoffice Learners | `/backoffice/learners` | Admin/Instructor | Learner management |
| Backoffice Instructors | `/backoffice/instructors` | Admin/Instructor | Instructor management |
| Backoffice Reports | `/backoffice/reports` | Admin/Instructor | Analytics and reports |

---

## 12. Conclusion

**LearnSphere** is a comprehensive, production-grade Learning Management System that combines modern web technologies with AI-powered learning assistance. The application demonstrates:

- **Full-stack web development** with React, TypeScript, and Firebase
- **AI integration** using the Llama 3.3 70B model via OpenAI-compatible APIs
- **Enterprise-grade architecture** with role-based access, route protection, and secure API handling
- **Engaging user experience** through gamification, animations, and responsive design
- **Scalable design** that can be extended with additional features, courses, and integrations

The project showcases the potential of combining modern frontend frameworks with AI capabilities to create intelligent, interactive educational platforms.

---

*Report Generated: February 27, 2026*
*Project: LearnSphere — Learning Management System*
