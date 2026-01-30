# University Proctoring AI System

An AI-powered proctoring system using face detection, gaze tracking, and violation detection to monitor exam integrity.

## Project Structure

```
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI application
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── api/            # API endpoints
│   │   ├── db/             # Database configuration
│   │   ├── core/           # Core configuration
│   │   └── services/       # Business logic services
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile
├── frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Utility functions
│   │   ├── workers/        # Web workers for ML
│   │   └── main.tsx        # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── Dockerfile
├── docker-compose.yml      # Multi-container setup
└── README.md              # This file
```

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Docker & Docker Compose (optional)

### Backend Setup

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Set environment variables
export MYSQL_USER=proctor_user
export MYSQL_PASSWORD=proctor_password
export MYSQL_SERVER=localhost
export MYSQL_DATABASE=proctoring_db
export SECRET_KEY=your_secret_key_here

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: http://localhost:8000

API Documentation: http://localhost:8000/docs

### Frontend Setup

```bash
cd frontend

# Install npm dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at: http://localhost:3000

### Using Docker Compose

```bash
docker-compose up --build
```

This will start:
- MySQL database (port 3306)
- FastAPI backend (port 8000)
- React frontend (port 3000)

## Features

### Core Components

- **Face Detection**: Uses MediaPipe Face Landmarker
- **Gaze Tracking**: Detects head pose and gaze direction
- **Violation Detection**: 
  - Gaze away from screen
  - Face missing/not detected
  - Multiple faces in frame
  - Voice/sound detection
  - Tab switching

- **Calibration**: Per-student eye calibration for accurate gaze detection
- **Session Management**: Track exam sessions with real-time monitoring
- **Violation Logging**: Detailed records with timestamps and severity scores

### API Endpoints

#### Health Check
- `GET /health` - Database and service health status

#### Exams
- `POST /api/v1/exams/sessions/{session_id}/finish` - Finalize exam session

#### Proctoring
- `POST /api/v1/proctoring/report-violation` - Report violation during exam

## Database Models

### User
- Stores student, teacher, proctor, and admin accounts
- Includes biometric data reference

### Exam
- Exam metadata and configuration
- Sensitivity settings per exam

### ExamSession
- Exam instance for a specific student
- Start/end times and verdict

### Violation
- Individual violations detected during exam
- Type, severity, confidence, and proof references

### AuditLog
- Administrative action logging

## Configuration

Edit `backend/app/core/config.py` for:
- Database connection strings
- JWT secrets
- API settings
- Model confidence thresholds

## Development

### Adding New Endpoints

1. Create endpoint file in `backend/app/api/endpoints/`
2. Define router with `APIRouter()`
3. Include router in `backend/app/api/routes.py`

### Adding New Models

1. Define in `backend/app/models/models.py`
2. Models inherit from `Base`
3. Run migrations with Alembic

### Frontend Components

- Components use React hooks and TypeScript
- State management via `useState`
- Side effects via Vite and web workers
- Styling with Tailwind CSS

## Testing

Backend:
```bash
cd backend
pytest
```

Frontend:
```bash
cd frontend
npm test
```

## Production Deployment

1. Set environment variables in `.env`
2. Use Alembic for database migrations
3. Configure Nginx reverse proxy
4. Use proper SSL/TLS certificates
5. Deploy with Docker Compose or Kubernetes

## Known Limitations

- MediaPipe models require GPU for optimal performance
- Database currently uses SQLite (development only) or MySQL
- Web worker file paths are relative to Vite build

## Future Enhancements

- [ ] Implement full LLM integration for intelligent violation analysis
- [ ] Add WebSocket support for real-time notifications
- [ ] Implement S3/MinIO for video storage
- [ ] Add advanced biometric verification
- [ ] Implement Celery for distributed task processing
- [ ] Add mobile app support

## License

Proprietary - University Proctoring System

## Support

For issues and questions, contact the development team.
