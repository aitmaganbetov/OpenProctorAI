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

  async reportViolation(sessionId: string | number | undefined, violation: any): Promise<any> {
    const payload: Record<string, any> = { ...violation };
    if (sessionId) {
      payload.session_id = sessionId;
    }
    return this.post(`/proctoring/report-violation`, payload);
  }

  async assignExam(examId: number | string, payload: { student_id?: number; student_email?: string; due_date?: string; }): Promise<any> {
    return this.post(`/exams/${examId}/assign`, payload);
  }

  async getAssignments(): Promise<any[]> {
    return this.get<any[]>('/exams/assignments');
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

  async updateAssignment(assignmentId: number | string, payload: { due_date?: string; status?: string }): Promise<any> {
    const url = `${API_BASE_URL}/exams/assignments/${assignmentId}`;
    console.log('[API] PATCH request to:', url);
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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

  async uploadStudentPhoto(studentId: number, photoBase64: string): Promise<any> {
    const url = `${API_BASE_URL}/proctoring/student/${studentId}/photo`;
    console.log('[API] POST photo upload to:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo: photoBase64 }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Error response:', { status: response.status, statusText: response.statusText, body: errorText });
      throw new Error(`API error ${response.status}: ${response.statusText}`);
    }
    const result = await response.json();
    console.log('[API] Photo upload response:', result);
    return result;
  }

  // Admin endpoints
  async getAdminUsers(): Promise<any[]> {
    return this.get<any[]>('/admin/users');
  }

  async createAdminUser(payload: { email: string; full_name?: string; name?: string; role?: string; password?: string }): Promise<any> {
    return this.post<any>('/admin/users', payload);
  }

  async toggleAdminUser(userId: number): Promise<any> {
    const url = `${API_BASE_URL}/admin/users/${userId}/toggle`;
    console.log('[API] PATCH request to:', url);
    const response = await fetch(url, { method: 'PATCH' });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Error response:', { status: response.status, statusText: response.statusText, body: errorText });
      throw new Error(`API error ${response.status}: ${response.statusText}`);
    }
    const result = await response.json();
    console.log('[API] Response:', result);
    return result;
  }

  async deleteAdminUser(userId: number): Promise<any> {
    const url = `${API_BASE_URL}/admin/users/${userId}`;
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

  async getAdminLogs(): Promise<any[]> {
    return this.get<any[]>('/admin/logs');
  }

  async getServerStatus(): Promise<any> {
    return this.get<any>('/admin/server-status');
  }

  async checkStudentPhoto(studentId: number): Promise<any> {
    const url = `${API_BASE_URL}/proctoring/student/${studentId}/photo-status`;
    console.log('[API] GET photo status from:', url);
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Error response:', { status: response.status, statusText: response.statusText, body: errorText });
      throw new Error(`API error ${response.status}: ${response.statusText}`);
    }
    const result = await response.json();
    console.log('[API] Photo status response:', result);
    return result;
  }

  async getStudentProfile(studentId: number): Promise<any> {
    return this.get<any>(`/proctoring/student/${studentId}/profile`);
  }

  async verifyStudentPhoto(studentId: number, examPhotoBase64: string): Promise<any> {
    const url = `${API_BASE_URL}/proctoring/student/${studentId}/verify-photo`;
    console.log('[API] POST photo verification to:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exam_photo: examPhotoBase64 }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Error response:', { status: response.status, statusText: response.statusText, body: errorText });
      throw new Error(`API error ${response.status}: ${response.statusText}`);
    }
    const result = await response.json();
    console.log('[API] Photo verification response:', result);
    return result;
  }

  // Teacher Dashboard endpoints
  async getDashboardStudents(): Promise<any[]> {
    return this.get<any[]>('/exams/dashboard/students');
  }

  async createDashboardStudent(payload: { email: string; full_name?: string; name?: string; password?: string; group?: string; }): Promise<any> {
    return this.post<any>('/exams/dashboard/students', payload);
  }

  async deleteDashboardStudent(studentId: number): Promise<any> {
    const url = `${API_BASE_URL}/exams/dashboard/students/${studentId}`;
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

  async importDashboardStudents(students: Array<{ email: string; full_name?: string; name?: string; password?: string; group?: string; }>): Promise<any> {
    return this.post<any>('/exams/dashboard/students/import', { students });
  }

  async getDashboardSessions(): Promise<any[]> {
    return this.get<any[]>('/exams/dashboard/sessions');
  }

  async getStudentSessions(studentId: number): Promise<any[]> {
    return this.get<any[]>(`/exams/dashboard/sessions/${studentId}`);
  }

}

export default ApiService.getInstance();