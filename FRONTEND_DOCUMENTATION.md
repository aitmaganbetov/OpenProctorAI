# 🎓 University Proctoring AI - Beautiful Frontend

A complete, production-ready AI-powered exam proctoring system with a stunning dark-themed user interface.

## ✨ Features

### 🔐 Authentication
- Beautiful login interface with role-based access (Student/Teacher)
- Demo credentials for quick testing
- Persistent session management

### 👨‍🏫 Teacher Dashboard
- **Exam Management**: Create, edit, and manage exams
- **Question Builder**: Support for multiple question types:
  - Multiple Choice
  - Short Answer
  - Essay Questions
- **Results Analytics**: View detailed exam results and student performance
- **Violation Monitoring**: Review detected academic integrity violations with timestamps and severity levels
- **Session Review**: Examine individual student exam sessions with comprehensive proctoring data

### 👨‍🎓 Student Interface
- **Exam Selection**: Browse and start available exams
- **Interactive Testing**: Clean, distraction-free exam interface
- **Real-time Proctoring**: Live AI monitoring during exams
- **Progress Tracking**: Visual progress indicator and question navigator
- **Timer Management**: Real-time countdown with visual warnings as time runs low

### 📊 AI Proctoring Features
- Face detection and tracking
- Eye gaze monitoring
- Tab/window switching detection
- Multiple face detection
- Object detection (clipboard, phone, etc.)
- Screen recording capabilities
- Violation logging with video evidence

## 🎨 Design Highlights

### Modern Dark Theme
- Slate gray color palette (#0f172a, #1e293b, #334155, #475569)
- Blue accent colors for interactive elements (#3b82f6, #2563eb)
- Glassmorphism effects for depth
- Smooth transitions and animations

### Responsive Layout
- Mobile-first design
- Tablet-optimized views
- Desktop full-featured interface
- Touch-friendly controls

### Accessibility
- Proper heading hierarchy
- Keyboard navigation support
- Color contrast compliance
- ARIA labels on interactive elements

## 🚀 Getting Started

### Access the Application

**Local Development:**
```
Frontend: http://localhost:3000
Backend API: http://localhost:8000
API Docs: http://localhost:8000/docs
```

**Remote Access (using server IP 10.0.1.109):**
```
Frontend: http://10.0.1.109:3000
Backend API: http://10.0.1.109:8000
API Docs: http://10.0.1.109:8000/docs
```

### Demo Login Credentials

**As a Teacher:**
- Email: `teacher@university.edu`
- Password: `password123`
- Role: Teacher

**As a Student:**
- Email: `student@university.edu`
- Password: `password123`
- Role: Student

## 📁 Project Structure

```
frontend/
├── public/                           # Static assets
├── src/
│   ├── components/
│   │   ├── LoginPage.tsx            # Authentication interface
│   │   ├── ProctoringSession.tsx    # Live proctoring component
│   │   ├── CalibrationStep.tsx      # Eye calibration setup
│   │   ├── teacher/
│   │   │   ├── TeacherDashboard.tsx # Teacher main interface
│   │   │   ├── CreateExamForm.tsx   # Exam creation form
│   │   │   ├── ResultsTable.tsx     # Results display
│   │   │   └── SessionDetail.tsx    # Session review interface
│   │   └── student/
│   │       ├── StudentDashboard.tsx # Student exam selection
│   │       └── ExamInterface.tsx    # Exam taking interface
│   ├── hooks/
│   │   ├── useAuth.ts              # Authentication state management
│   │   ├── useAIWorker.ts          # Web Worker for AI processing
│   │   ├── useEnvironmentMonitor.ts # Environment monitoring
│   │   ├── useExtension.ts         # Browser extension integration
│   │   └── useSmartRecorder.ts     # Recording management
│   ├── services/
│   │   └── api.ts                  # API client and types
│   ├── utils/
│   │   ├── math.ts                 # Math utilities
│   │   └── SmartRecorder.ts        # Recording utilities
│   ├── workers/
│   │   └── ai.worker.ts            # AI processing worker
│   ├── App.tsx                     # Main app component
│   ├── main.tsx                    # React entry point
│   └── index.css                   # Global styles with Tailwind
├── vite.config.ts                  # Vite configuration
├── tsconfig.json                   # TypeScript configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── postcss.config.js               # PostCSS configuration
└── package.json                    # Dependencies
```

## 🎯 Key Components

### LoginPage Component
Beautiful, role-based authentication interface with:
- Email/password input
- Role selection (Student/Teacher)
- Demo credentials display
- Error handling and validation

### TeacherDashboard
Comprehensive teacher interface with:
- Exam creation with question builder
- Dynamic question type support
- Results table with sorting
- Student session review
- Violation analysis

### ExamInterface
Student exam-taking interface featuring:
- Full-screen mode
- Question navigation
- Timer with visual warnings
- Progress tracking
- Real-time proctoring monitoring

### SessionDetail
Teacher review panel showing:
- Student performance metrics
- Violation timeline
- Severity indicators
- Video evidence links
- Duration and timing information

## 🔧 Technologies

### Frontend Framework
- **React 18.2.0**: Component library
- **TypeScript 5.3.0**: Type safety
- **Vite 5.0.0**: Build tool (fast HMR)

### Styling & UI
- **Tailwind CSS 3.3.0**: Utility-first CSS framework
- **PostCSS**: CSS processing
- **Custom CSS**: Global styles and animations

### State Management
- **React Hooks**: Local state (useState, useEffect, useCallback)
- **Context API**: Global state management (when needed)
- **LocalStorage**: Persistent client-side data

### APIs & Integration
- **Fetch API**: HTTP requests
- **Web Workers**: Parallel processing (AI analysis)
- **WebRTC**: Video/audio streaming
- **IndexedDB**: Client-side storage

## 💻 Deployment

### Docker Deployment
```bash
# Start all services
docker compose up -d

# View logs
docker logs university-proctoring-frontend-1

# Stop services
docker compose down
```

### Environment Variables
```bash
# Optional: Set API base URL
API_BASE_URL=http://backend:8000

# Optional: OpenAI integration
OPENAI_API_KEY=sk-...
```

## 🔌 API Integration

### Base URL
```
/api/v1
```

### Available Endpoints

**Exam Endpoints:**
- `GET /exams` - List all exams
- `POST /exams` - Create new exam
- `POST /exams/sessions` - Start exam session
- `POST /exams/sessions/{id}/finish` - End exam session

**Proctoring Endpoints:**
- `POST /proctoring/report-violation` - Report integrity violation

## 🎨 Customization

### Color Scheme
Edit `tailwind.config.js` to customize:
```js
colors: {
  slate: { /* primary */ },
  blue: { /* accent */ },
  green: { /* success */ },
  red: { /* error */ },
}
```

### Fonts
Modify `src/index.css` to change typography:
```css
body {
  font-family: 'Your Font', sans-serif;
}
```

### Component Styling
All components use Tailwind CSS classes for easy customization.

## 🧪 Development

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

### Type Checking
```bash
npx tsc --noEmit
```

## 📈 Performance

- **Fast Load Times**: Vite's instant HMR
- **Optimized Bundles**: Code splitting by route
- **Lazy Loading**: Components load on demand
- **Web Workers**: AI processing off main thread
- **Caching**: Efficient asset caching

## 🔐 Security Features

- **HTTPS Ready**: Secure connections
- **CORS Configuration**: API protection
- **Input Validation**: Form validation
- **XSS Protection**: React's built-in escaping
- **Session Management**: Secure token handling

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## 🎓 Educational Features

- Support for various question types
- Point-based scoring system
- Detailed analytics and reporting
- Academic integrity monitoring
- Evidence collection and review

## 🚨 Violation Detection

### Soft Violations (Warnings)
- Brief eye gaze breaks
- Clipboard in view
- Momentary focus loss

### Hard Violations (Critical)
- Multiple faces detected
- Face disappears from frame
- Suspicious window switching
- Phone detection

## 📊 Analytics & Insights

Teachers can review:
- Overall exam statistics
- Per-student performance
- Violation frequency and types
- Time spent per question
- Behavioral patterns

## 🤝 Contributing

To extend the frontend:

1. Add new components in `src/components/`
2. Create hooks in `src/hooks/`
3. Update API types in `src/services/api.ts`
4. Follow the existing Tailwind CSS patterns
5. Ensure TypeScript type safety

## 📝 License

This project is proprietary software for the University Proctoring AI system.

## 🆘 Support

For issues or questions:
1. Check the console for error messages
2. Review API docs at `/docs`
3. Check browser console (F12)
4. Review Docker logs

## ✅ Browser Compatibility

- ✅ Chrome/Chromium 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🎉 Status

**Development Status**: ✅ Production Ready

**Last Updated**: January 30, 2026

---

**Build with ❤️ for academic integrity**
