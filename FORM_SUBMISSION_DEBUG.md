# Exam Form Submission - Debug Guide

## Enhanced Logging Added

The frontend now has **comprehensive console logging** to help diagnose form submission issues. All logs are prefixed with `[FORM]` or `[DASHBOARD]` for easy filtering.

## How to Test the Form

### 1. Open Browser DevTools
- Press **F12** (Windows/Linux) or **Cmd+Opt+I** (Mac)
- Go to the **Console** tab
- Clear any existing logs

### 2. Fill Out the Exam Form Correctly

The form has **strict validation**. You must provide:

| Field | Requirement |
|-------|-------------|
| **Exam Title** | Required (non-empty) |
| **Duration** | At least 1 minute |
| **Questions** | At least 1 question |
| **Question Text** | Each question must have text |
| **Question Options** (for MCQ) | At least 2 filled options |

### 3. Complete Form Example

1. **Title:** `Math Quiz`
2. **Description:** `Basic arithmetic questions` (optional)
3. **Duration:** `30` minutes
4. **Question 1:**
   - Text: `What is 2+2?`
   - Type: `Multiple Choice`
   - Points: `1`
   - Options:
     - `3`
     - `4` ← Correct answer
     - `5`
     - `6`

### 4. Click "Create Exam" and Monitor Console

Watch for these console messages:

#### ✅ Success Flow
```
[FORM] Submit button clicked
[FORM] Current form data: {...}
[FORM] Validation check - title: "Math Quiz" duration: 30 questions: 1
[FORM] Validation errors found: []
[FORM] Validation passed, submitting exam...
[FORM] Submitting exam with data: {...}
[DASHBOARD] Creating new exam
[DASHBOARD] handleCreateExam called with data: {...}
[DASHBOARD] Exam created successfully: {...}
[DASHBOARD] Refreshed exams list: [...]
[DASHBOARD] Form closed and exams list updated
[FORM] Exam submitted successfully!
```

#### ❌ Validation Failure
```
[FORM] Submit button clicked
[FORM] Current form data: {...}
[FORM] Validation check - title: "" duration: 30 questions: 1
[FORM] Validation errors found: ["Exam title is required", "Question 1 text is required", ...]
[FORM] Validation failed - see errors array below
[FORM] Validation errors: [...]
```

Error messages will also display in the form's red error box.

#### ❌ API Failure
```
[FORM] Submitting exam with data: {...}
[DASHBOARD] Creating new exam
[DASHBOARD] handleCreateExam called with data: {...}
[DASHBOARD] Failed to create exam: Error: Network error (or similar)
[DASHBOARD] Form submission error: Error: Network error
[FORM] Failed to create exam: Error: Network error
[FORM] Error details: {...}
```

## Validation Requirements (Strict)

### Required Fields
- ✅ **Exam Title** - Cannot be empty or only whitespace
- ✅ **At least 1 Question** - The form starts with 1 question

### Per Question Validation
- ✅ **Question Text** - Cannot be empty
- ✅ **For Multiple Choice** - Must have **at least 2 options** with text
  - Short Answer and Essay questions don't need options
  
## Common Issues

### Issue: "Form validation failed" appears
**Solution:** 
- Make sure exam title is filled in
- Make sure all question texts are filled in
- For MCQ questions, make sure at least 2 options have text

### Issue: Form shows but nothing happens when clicking "Create Exam"
**Solution:**
1. Check the browser console (F12)
2. If you see validation errors, fill in the required fields
3. If you see network errors, check if backend is running:
   ```bash
   curl http://localhost:8000/api/v1/exams
   ```

### Issue: Form closes but exams don't appear in list
**Solution:**
1. Check console for logs with `[DASHBOARD]`
2. The list should automatically refresh after successful creation
3. Try manually refreshing the page (F5)

## Backend Verification

To verify the API is working independently:

```bash
# Test API is running
curl http://localhost:8000/api/v1/exams

# Create exam via API
curl -X POST http://localhost:8000/api/v1/exams \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Test",
    "description": "Testing API directly",
    "duration_minutes": 45,
    "questions": [
      {
        "text": "Test question?",
        "type": "multiple_choice",
        "points": 1,
        "options": ["A", "B", "C", "D"]
      }
    ]
  }'
```

## Real-time Logging Messages

All form interactions now log to console:
- `[FORM] Submit button clicked` - Form submission initiated
- `[FORM] Question X field 'Y' changed to: Z` - Field changes
- `[FORM] Validation check` - Validation running
- `[FORM] Submitting exam with data` - API call about to be made
- `[DASHBOARD] handleCreateExam called` - Backend handler triggered
- `[DASHBOARD] Exam created successfully` - Exam saved to DB
- `[DASHBOARD] Refreshed exams list` - List updated from server

## Debugging Checklist

1. ✅ Backend running: `docker ps | grep university-proctoring`
2. ✅ Frontend running: `npm run dev` in `/frontend`
3. ✅ Open http://localhost:3000 in browser
4. ✅ Press F12 to open DevTools Console
5. ✅ Fill form completely (see example above)
6. ✅ Click "Create Exam"
7. ✅ Check console for logs
8. ✅ Confirm exam appears in "My Exams" list

## Next Steps

If the form submission still doesn't work after following this guide:
1. Copy the **full console output** (all `[FORM]` and `[DASHBOARD]` logs)
2. Check if there are any **red error messages** in the console
3. Check if the **backend logs** show any errors:
   ```bash
   docker logs university-proctoring-backend-1 | tail -50
   ```
4. Share the console output and backend logs for further debugging
