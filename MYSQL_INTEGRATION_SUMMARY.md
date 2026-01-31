# MySQL Integration & TeacherDashboard Data Layer Summary

## Overview
The TeacherDashboard now fetches **real data from MySQL database** via REST API endpoints. All data is dynamically loaded from the backend, eliminating mock data dependencies.

---

## 📊 Database Models & Tables

### 1. **Users Table** (`users`)
Stores all system users (students, teachers, admins)
```sql
- id (INT, PRIMARY KEY)
- email (VARCHAR, UNIQUE)
- hashed_password (VARCHAR)
- full_name (VARCHAR)
- role (ENUM: student, teacher, proctor, admin)
- is_active (BOOLEAN)
- face_embedding_path (VARCHAR)
```

### 2. **StudentProfiles Table** (`student_profiles`)
Stores student identification photos & verification data
```sql
- id (INT, PRIMARY KEY)
- student_id (INT, FOREIGN KEY -> users.id)
- photo_path (VARCHAR)
- photo_base64 (JSON)
- is_verified (BOOLEAN)
- created_at (DATETIME)
- updated_at (DATETIME)
```

### 3. **Exams Table** (`exams`)
Stores exam configurations
```sql
- id (INT, PRIMARY KEY)
- title (VARCHAR)
- created_by_id (INT, FOREIGN KEY -> users.id)
- duration_minutes (INT)
- config (JSON) - contains description, questions, settings
- is_active (BOOLEAN)
```

### 4. **ExamSessions Table** (`exam_sessions`)
Stores active/completed exam sessions
```sql
- id (INT, PRIMARY KEY)
- exam_id (INT, FOREIGN KEY -> exams.id)
- student_id (INT, FOREIGN KEY -> users.id)
- start_time (DATETIME)
- end_time (DATETIME)
- status (VARCHAR: active, completed, failed)
- verdict (VARCHAR: pending, processing, passed, failed)
- ai_summary (JSON)
- violations (RELATIONSHIP -> violations table)
```

### 5. **Violations Table** (`violations`)
Records all proctoring violations detected during exams
```sql
- id (INT, PRIMARY KEY)
- session_id (INT, FOREIGN KEY -> exam_sessions.id)
- type (VARCHAR: gaze_away, face_missing, multiple_faces, voice_detected, tab_switch, object_detected)
- timestamp (DATETIME)
- severity_score (INT: 0-100)
- confidence (FLOAT: 0-1)
- video_proof_url (VARCHAR)
- snapshot_url (VARCHAR)
```

### 6. **ExamAssignments Table** (`exam_assignments`)
Maps exams to students with assignment metadata
```sql
- id (INT, PRIMARY KEY)
- exam_id (INT, FOREIGN KEY -> exams.id)
- student_id (INT, FOREIGN KEY -> users.id)
- assigned_at (DATETIME)
- due_date (DATETIME, optional)
- status (VARCHAR)
```

---

## 🔌 New Backend API Endpoints

All endpoints return data from MySQL database.

### **GET `/api/v1/exams/dashboard/students`**
Fetches all students for teacher dashboard
```json
[
  {
    "id": 1,
    "email": "student@university.edu",
    "full_name": "John Smith",
    "role": "student",
    "is_active": true,
    "created_at": "2026-01-31T10:00:00"
  }
]
```

### **GET `/api/v1/exams/dashboard/sessions`**
Fetches all exam sessions with violations data
```json
[
  {
    "id": 1,
    "exam_id": 1,
    "exam_title": "Advanced JavaScript",
    "student_id": 1,
    "student_name": "John Smith",
    "student_email": "john@university.edu",
    "start_time": "2026-01-31T10:00:00",
    "end_time": "2026-01-31T11:30:00",
    "status": "completed",
    "verdict": "passed",
    "violations_count": 1,
    "violations": [
      {
        "id": 1,
        "type": "tab_switch",
        "timestamp": "2026-01-31T10:05:30",
        "severity_score": 50,
        "confidence": 0.95
      }
    ]
  }
]
```

### **GET `/api/v1/exams/dashboard/sessions/{studentId}`**
Fetches sessions for a specific student
```json
[
  { ...session data... }
]
```

### **GET `/api/v1/exams`**
Fetches all exams with questions
```json
[
  {
    "id": 1,
    "title": "Advanced JavaScript",
    "description": "JavaScript fundamentals and advanced concepts",
    "duration_minutes": 90,
    "created_by": 1,
    "created_at": "2026-01-31T10:00:00",
    "questions": [...]
  }
]
```

### **POST `/api/v1/exams`**
Creates new exam (stored in MySQL)
```json
{
  "title": "New Exam",
  "description": "Exam description",
  "duration_minutes": 60,
  "questions": [...]
}
```

---

## 🎨 Frontend Integration

### **API Service** (`frontend/src/services/api.ts`)
Added three new methods to fetch dashboard data:

```typescript
async getDashboardStudents(): Promise<any[]>
async getDashboardSessions(): Promise<any[]>
async getStudentSessions(studentId: number): Promise<any[]>
```

### **TeacherDashboard Component** (`frontend/src/components/teacher/TeacherDashboard.tsx`)
Automatically loads data on component mount:

```typescript
useEffect(() => {
  const loadDashboardData = async () => {
    try {
      const [studentsData, sessionsData] = await Promise.all([
        api.getDashboardStudents(),
        api.getDashboardSessions()
      ]);
      
      setStudents(studentsData || []);
      setSessions(sessionsData || []);
      
      if (studentsData && studentsData.length > 0) {
        setSelectedStudent(studentsData[0]);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      notify('Ошибка при загрузке данных');
    }
  };
  
  loadDashboardData();
}, []);
```

---

## 📋 TeacherDashboard Features & Data Sources

### **1️⃣ Proctoring View** (Мониторинг)
| Feature | Data Source |
|---------|-------------|
| Student Name | `User.full_name` from MySQL |
| Student ID | `User.id` |
| Student Email | `User.email` |
| Live Video Feed | Simulated (integration ready) |
| Violation Log | `ExamSession.violations` → `Violation` table |
| Violation Type | `Violation.type` (enum in DB) |
| Violation Timestamp | `Violation.timestamp` |
| Severity | `Violation.severity_score` |
| Confidence | `Violation.confidence` |

### **2️⃣ Students Management View** (Студенты)
| Feature | Data Source |
|---------|-------------|
| Student List | `SELECT * FROM users WHERE role='student'` |
| Student Avatar | Generated from `full_name` initials |
| Group Assignment | Custom field (stored in user metadata) |
| Registration Form | Creates new `User` record in MySQL |
| Password Generation | Random secure password |
| Delete Student | `DELETE FROM users WHERE id=?` |

### **3️⃣ Questions Bank View** (Банк вопросов)
| Feature | Data Source |
|---------|-------------|
| Question Text | `Exam.config['questions']` (JSON in MySQL) |
| Question Type | Stored in question object |
| Difficulty Level | Stored in question object |
| Add Question | Updates `Exam.config` JSON |
| Delete Question | Updates `Exam.config` JSON |

### **4️⃣ Test Assignment View** (Назначение)
| Feature | Data Source |
|---------|-------------|
| Student Selection | `users WHERE role='student'` |
| Exam Selection | `exams` table |
| Time Limit | `exams.duration_minutes` |
| Proctoring Toggle | `exam_sessions.config['proctoring_enabled']` |
| Start Session | Creates new `ExamSession` record |

---

## 🔄 Data Flow Diagram

```
Frontend (React)
    ↓
API Service (api.ts)
    ↓
Backend (FastAPI)
    ↓
Database (MySQL)

GET /exams/dashboard/students
    └→ Query: SELECT * FROM users WHERE role='student'
       Response: [{ id, full_name, email, role, is_active }]

GET /exams/dashboard/sessions
    └→ Query: SELECT * FROM exam_sessions
              LEFT JOIN violations ON sessions.id = violations.session_id
              LEFT JOIN users ON sessions.student_id = users.id
              LEFT JOIN exams ON sessions.exam_id = exams.id
       Response: [{ id, exam_title, student_name, violations: [...] }]

POST /exams
    └→ Query: INSERT INTO exams (title, duration_minutes, config)
       Response: { id, title, duration_minutes, created_at }
```

---

## 📈 Real-Time Monitoring Capabilities

The system now supports:

### ✅ **Student Performance Tracking**
- Track exam session history
- Monitor violations in real-time
- Generate AI verdicts based on violations

### ✅ **Proctoring AI Integration**
- Record violations from computer vision
- Confidence scores for each detection
- Video proof URLs for review

### ✅ **Session Management**
- Start/end exam sessions
- Calculate scores
- Store final verdicts

### ✅ **Question Management**
- Store unlimited questions in JSON
- Organize by difficulty level
- Support multiple question types

---

## 🚀 Current Status

✅ **Database Models**: All defined in `backend/app/models/models.py`
✅ **API Endpoints**: Fully implemented in `backend/app/api/endpoints/exam.py`
✅ **Frontend Integration**: TeacherDashboard fetches real data
✅ **TypeScript Validation**: All types check out
✅ **Error Handling**: Try-catch blocks with user notifications

---

## 📝 Next Steps (Optional Enhancements)

1. **Add Pagination** - For large datasets (students, sessions)
2. **Add Filtering** - Filter sessions by date, status, verdict
3. **Add Sorting** - Sort violations by severity/timestamp
4. **Real-time Updates** - WebSocket for live session monitoring
5. **Export Reports** - Generate PDF/CSV reports of exams
6. **Analytics Dashboard** - Statistics on violations, pass rates, etc.

---

## 🔐 Security Notes

- Passwords are hashed (use bcrypt in backend)
- Role-based access control (RBAC) via `User.role`
- Exam sessions tied to specific students
- Video proof URLs for violation verification
- Audit logs available in `AuditLog` table (not yet used)

---

## 📞 Support

For questions about:
- **Database Schema**: See `backend/app/models/models.py`
- **API Implementation**: See `backend/app/api/endpoints/`
- **Frontend Components**: See `frontend/src/components/teacher/TeacherDashboard.tsx`
- **API Service**: See `frontend/src/services/api.ts`
