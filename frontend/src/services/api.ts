// src/services/api.ts

const API_BASE_URL = '/api/v1';
const DEBUG = import.meta.env.DEV;

// Types
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
  type: 'single_choice' | 'multiple_choice' | 'short_answer' | 'essay';
  options?: string[];
  correct_answer?: string;
  correct_answers?: number[];
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

// Error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
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

  private log(message: string, data?: unknown): void {
    if (DEBUG) {
      console.log(`[API] ${message}`, data ?? '');
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      if (DEBUG) {
        console.error('[API] Error:', { status: response.status, body: errorText });
      }
      throw new ApiError(
        `API error ${response.status}: ${response.statusText}`,
        response.status,
        errorText
      );
    }
    return response.json();
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    this.log('POST', { url, data });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    return this.handleResponse<T>(response);
  }

  async get<T>(endpoint: string): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    this.log('GET', url);
    
    const response = await fetch(url);
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    this.log('PUT', { url, data });
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    this.log('PATCH', { url, data });
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: data ? { 'Content-Type': 'application/json' } : {},
      body: data ? JSON.stringify(data) : undefined,
    });
    
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    this.log('DELETE', url);
    
    const response = await fetch(url, { method: 'DELETE' });
    return this.handleResponse<T>(response);
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    this.log('POST FormData', url);
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    
    return this.handleResponse<T>(response);
  }

  // === Exam endpoints ===
  
  getExams = (): Promise<Exam[]> => this.get('/exams');
  
  createExam = (exam: Partial<Exam>): Promise<Exam> => this.post('/exams', exam);
  
  putExam = (examId: number | string, exam: Partial<Exam>): Promise<Exam> =>
    this.put(`/exams/${examId}`, exam);

  startExamSession = (examId: string): Promise<ExamSession> =>
    this.post('/exams/sessions', { exam_id: examId });

  endExamSession = (sessionId: string, answers: unknown): Promise<ExamSession> =>
    this.post(`/exams/sessions/${sessionId}/finish`, { answers });

  // === Violation endpoints ===
  
  reportViolation = (sessionId: string | number | undefined, violation: Record<string, unknown>): Promise<unknown> => {
    const payload = sessionId ? { ...violation, session_id: sessionId } : violation;
    return this.post('/proctoring/report-violation', payload);
  };

  reportViolationEvidence = (form: FormData): Promise<unknown> =>
    this.postFormData('/proctoring/report-violation-evidence', form);

  // === Assignment endpoints ===
  
  assignExam = (
    examId: number | string,
    payload: { student_id?: number; student_email?: string; due_date?: string }
  ): Promise<unknown> => this.post(`/exams/${examId}/assign`, payload);

  getAssignments = (): Promise<unknown[]> => this.get('/exams/assignments');

  getExamAssignments = (examId: number | string): Promise<unknown[]> =>
    this.get(`/exams/${examId}/assignments`);

  deleteAssignment = (assignmentId: number | string): Promise<unknown> =>
    this.delete(`/exams/assignments/${assignmentId}`);

  updateAssignment = (
    assignmentId: number | string,
    payload: { due_date?: string; status?: string }
  ): Promise<unknown> => this.patch(`/exams/assignments/${assignmentId}`, payload);

  // === Student Photo endpoints ===
  
  uploadStudentPhoto = (studentId: number, photoBase64: string): Promise<unknown> =>
    this.post(`/proctoring/student/${studentId}/photo`, { photo: photoBase64 });

  checkStudentPhoto = (studentId: number): Promise<unknown> =>
    this.get(`/proctoring/student/${studentId}/photo-status`);

  getStudentProfile = (studentId: number): Promise<unknown> =>
    this.get(`/proctoring/student/${studentId}/profile`);

  verifyStudentPhoto = (studentId: number, examPhotoBase64: string): Promise<unknown> =>
    this.post(`/proctoring/student/${studentId}/verify-photo`, { exam_photo: examPhotoBase64 });

  // === Admin endpoints ===
  
  getAdminUsers = (): Promise<unknown[]> => this.get('/admin/users');

  createAdminUser = (payload: {
    email: string;
    full_name?: string;
    name?: string;
    role?: string;
    password?: string;
  }): Promise<unknown> => this.post('/admin/users', payload);

  toggleAdminUser = (userId: number): Promise<unknown> =>
    this.patch(`/admin/users/${userId}/toggle`);

  deleteAdminUser = (userId: number): Promise<unknown> =>
    this.delete(`/admin/users/${userId}`);

  getAdminLogs = (): Promise<unknown[]> => this.get('/admin/logs');

  getServerStatus = (): Promise<unknown> => this.get('/admin/server-status');

  // === Teacher Dashboard endpoints ===
  
  getDashboardStudents = (): Promise<unknown[]> => this.get('/exams/dashboard/students');

  createDashboardStudent = (payload: {
    email: string;
    full_name?: string;
    name?: string;
    password?: string;
    group?: string;
  }): Promise<unknown> => this.post('/exams/dashboard/students', payload);

  deleteDashboardStudent = (studentId: number): Promise<unknown> =>
    this.delete(`/exams/dashboard/students/${studentId}`);

  importDashboardStudents = (
    students: Array<{
      email: string;
      full_name?: string;
      name?: string;
      password?: string;
      group?: string;
    }>
  ): Promise<unknown> => this.post('/exams/dashboard/students/import', { students });

  getDashboardSessions = (): Promise<unknown[]> => this.get('/exams/dashboard/sessions');

  getStudentSessions = (studentId: number): Promise<unknown[]> =>
    this.get(`/exams/dashboard/sessions/${studentId}`);
}

export default ApiService.getInstance();