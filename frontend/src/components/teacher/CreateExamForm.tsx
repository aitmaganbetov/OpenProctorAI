import React, { useState } from 'react';
import { Exam, Question } from '../../services/api';

interface CreateExamFormProps {
  onSubmit: (exam: Partial<Exam>) => Promise<void>;
  onCancel: () => void;
  initialExam?: Partial<Exam> | null;
}

export const CreateExamForm: React.FC<CreateExamFormProps> = ({ onSubmit, onCancel, initialExam }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [questions, setQuestions] = useState<Partial<Question>[]>([
    {
      text: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      points: 1,
    },
  ]);

  React.useEffect(() => {
    if (initialExam) {
      setTitle(initialExam.title || '');
      setDescription(initialExam.description || '');
      setDurationMinutes(initialExam.duration_minutes || 60);
      if (initialExam.questions && initialExam.questions.length > 0) {
        setQuestions(initialExam.questions as Partial<Question>[]);
      }
    }
  }, [initialExam]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        type: 'multiple_choice',
        options: ['', '', '', ''],
        points: 1,
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (qIndex: number, field: string, value: any) => {
    console.log(`[FORM] Question ${qIndex} field '${field}' changed to:`, value);
    const updated = [...questions];
    (updated[qIndex] as any)[field] = value;
    setQuestions(updated);
    console.log('[FORM] Updated questions:', updated);
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    console.log(`[FORM] Question ${qIndex} option ${oIndex} changed to:`, value);
    const updated = [...questions];
    const options = (updated[qIndex].options || []) as string[];
    options[oIndex] = value;
    updated[qIndex].options = options;
    setQuestions(updated);
    console.log('[FORM] Updated questions:', updated);
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!title.trim()) newErrors.push('Exam title is required');
    if (durationMinutes < 1) newErrors.push('Duration must be at least 1 minute');
    if (questions.length === 0) newErrors.push('At least one question is required');

    questions.forEach((q, idx) => {
      if (!q.text?.trim()) newErrors.push(`Question ${idx + 1} text is required`);
      if (q.type === 'multiple_choice') {
        const filledOptions = (q.options || []).filter((o) => o?.trim());
        if (filledOptions.length < 2) {
          newErrors.push(`Question ${idx + 1} must have at least 2 options`);
        }
      }
    });

    console.log('[FORM] Validation check - title:', title, 'duration:', durationMinutes, 'questions:', questions.length);
    console.log('[FORM] Validation errors found:', newErrors);
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[FORM] Submit button clicked');
    console.log('[FORM] Current form data:', { title, description, durationMinutes, questions });
    
    if (!validateForm()) {
      console.warn('[FORM] Validation failed - see errors array below');
      console.warn('[FORM] Validation errors:', errors);
      return;
    }

    setLoading(true);
    console.log('[FORM] Validation passed, submitting exam...');
    try {
      console.log('[FORM] Submitting exam with data:', { title, description, durationMinutes, questions });
      await onSubmit({
        title,
        description,
        duration_minutes: durationMinutes,
        questions: questions as Question[],
      });
      console.log('[FORM] Exam submitted successfully!');
    } catch (error: any) {
      console.error('[FORM] Failed to create exam:', error);
      console.error('[FORM] Error details:', { 
        message: error?.message, 
        status: error?.status,
        response: error?.response 
      });
      setErrors(['Failed to create exam: ' + (error?.message || 'Unknown error')]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Create New Exam</h2>

      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-400 font-medium mb-2">Please fix the following errors:</p>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, idx) => (
              <li key={idx} className="text-red-300 text-sm">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmitForm} className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Exam Details</h3>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Introduction to Chemistry Midterm"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide instructions and exam description..."
              rows={3}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Duration (minutes)</label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Questions</h3>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              + Add Question
            </button>
          </div>

          {questions.map((question, qIndex) => (
            <div
              key={qIndex}
              className="p-6 bg-slate-700 rounded-lg border border-slate-600 space-y-4"
            >
              <div className="flex justify-between items-start gap-4">
                <h4 className="font-semibold text-white">Question {qIndex + 1}</h4>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIndex)}
                    className="text-red-400 hover:text-red-300 font-medium text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <input
                type="text"
                value={question.text || ''}
                onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                placeholder="Question text..."
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                  <select
                    value={question.type || 'multiple_choice'}
                    onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="short_answer">Short Answer</option>
                    <option value="essay">Essay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Points</label>
                  <input
                    type="number"
                    value={question.points || 1}
                    onChange={(e) => handleQuestionChange(qIndex, 'points', Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              {question.type === 'multiple_choice' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Options</label>
                  {(question.options || []).map((option, oIndex) => (
                    <input
                      key={oIndex}
                      type="text"
                      value={option || ''}
                      onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                      placeholder={`Option ${oIndex + 1}`}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-slate-600">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Creating...' : 'Create Exam'}
          </button>
        </div>
      </form>
    </div>
  );
};
