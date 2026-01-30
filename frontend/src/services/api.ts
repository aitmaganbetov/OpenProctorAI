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
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('[API] POST request to:', url);
    console.log('[API] Request data:', data);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Error response:', { status: response.status, statusText: response.statusText, body: errorText });
      throw new Error(`API error ${response.status}: ${response.statusText}`);
    }
    const result = await response.json();
    console.log('[API] Response:', result);
    return result;
  }

  async get<T>(endpoint: string): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('[API] GET request to:', url);
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Error response:', { status: response.status, statusText: response.statusText, body: errorText });
      throw new Error(`API error ${response.status}: ${response.statusText}`);
    }
    const result = await response.json();
    console.log('[API] Response:', result);
    return result;
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('[API] POST FormData request to:', url);
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Error response:', { status: response.status, statusText: response.statusText, body: errorText });
      throw new Error(`API error ${response.status}: ${response.statusText}`);
    }
    const result = await response.json();
    console.log('[API] Response:', result);
    return result;
  }

  // Exam endpoints
  async getExams(): Promise<Exam[]> {
    return this.get<Exam[]>('/exams');
  }

  async createExam(exam: Partial<Exam>): Promise<Exam> {
    return this.post<Exam>('/exams', exam);
  }

  async putExam(examId: number | string, exam: Partial<Exam>): Promise<Exam> {
    const url = `${API_BASE_URL}/exams/${examId}`;
    console.log('[API] PUT request to:', url);
    console.log('[API] Request data:', exam);
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exam),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Error response:', { status: response.status, statusText: response.statusText, body: errorText });
      throw new Error(`API error ${response.status}: ${response.statusText}`);
    }
    const result = await response.json();
    console.log('[API] Response:', result);
    return result;
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

  async assignExam(examId: number | string, payload: { student_id?: number; student_email?: string; due_date?: string; }): Promise<any> {
    return this.post(`/exams/${examId}/assign`, payload);
  }

  async getAssignments(): Promise<any[]> {
    return this.get<any[]>('/assignments');
  }

  async getExamAssignments(examId: number | string): Promise<any[]> {
    return this.get<any[]>(`/exams/${examId}/assignments`);
  }

  async deleteAssignment(assignmentId: number | string): Promise<any> {
    const url = `${API_BASE_URL}/exams/assignments/${assignmentId}`;
    console.log('[API] DELETE request to:', url);
    const response = await fetch(url, { method: 'DELETE' });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Error response:', { status: response.status, statusText: response.statusText, body: errorText });
      throw new Error(`API error ${response.status}: ${response.statusText}`);
    }
    const result = await response.json();
    console.log('[API] Response:', result);
    return result;
  }
}

export default ApiService.getInstance();
