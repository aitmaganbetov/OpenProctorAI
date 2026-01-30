// src/services/api.ts
const API_BASE_URL = '/api/v1';

export interface ExamSession {
  id: string;
  exam_id: string;
  student_id: string;
  started_at: string;
  ended_at?: string;
  status: 'active' | 'completed' | 'failed';
  score?: number;
  violations: Violation[];
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  created_by: string;
  created_at: string;
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'short_answer' | 'essay';
  options?: string[];
  correct_answer?: string;
  points: number;
}

export interface Violation {
  id: string;
  type: string;
  severity: 'soft' | 'hard';
  timestamp: string;
  description: string;
  video_url?: string;
}

class ApiService {
  private static instance: ApiService;

  private constructor() {}

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  }

  // Exam endpoints
  async getExams(): Promise<Exam[]> {
    return this.get<Exam[]>('/exams');
  }

  async createExam(exam: Partial<Exam>): Promise<Exam> {
    return this.post<Exam>('/exams', exam);
  }

  async startExamSession(examId: string): Promise<ExamSession> {
    return this.post<ExamSession>(`/exams/sessions`, { exam_id: examId });
  }

  async endExamSession(sessionId: string, answers: any): Promise<ExamSession> {
    return this.post<ExamSession>(`/exams/sessions/${sessionId}/finish`, { answers });
  }

  async reportViolation(sessionId: string, violation: any): Promise<any> {
    return this.post(`/proctoring/report-violation`, {
      session_id: sessionId,
      ...violation,
    });
  }
}

export default ApiService.getInstance();
