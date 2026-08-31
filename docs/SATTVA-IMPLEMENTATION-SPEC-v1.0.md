# SATTVA — Implementation Specification

**Module:** Attendance MVP  
**Version:** 1.0  
**Date:** 31 August 2026  
**Status:** Implementation baseline  
**Source of truth:** PRD v1.2 + HLD v1.0 + LLD v1.0

---

# 1. Implementation Scope

Implement **only**:

- Supabase project/database
- Authentication
- Warden role
- Student role
- Student records
- Attendance sessions
- Attendance submission
- Warden attendance dashboard
- Student attendance dashboard
- Attendance history/search
- Warden attendance correction
- Audit logging
- Automated tests

Do **not** implement:

- AI/LangGraph
- IoT/MQTT
- WhatsApp
- Security role
- Complaints
- Leave
- Outings
- Deliveries
- Cleaning
- Laundry
- Visitor management

Future features may influence interfaces, but must not become implementation scope.

---

# 2. Repository Structure

Target structure:

```text
sattva-hostel-management/
│
├── docs/
│   ├── SATTVA-PRD-v1.2.md
│   ├── SATTVA-HLD-v1.1.md
│   ├── SATTVA-LLD-v1.1.md
│   └── SATTVA-IMPLEMENTATION-SPEC-v1.0.md
│
├── src/
├── supabase/
│   ├── migrations/
│   └── seed.sql
│
├── tests/
├── public/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

Do not create unnecessary infrastructure.

---

# 3. Database Schema

Use **PostgreSQL through Supabase**.

## 3.1 Enums

Create:

```sql
user_role:
WARDEN
STUDENT
```

```sql
attendance_status:
PRESENT
ON_LEAVE
OUTSIDE
```

```sql
attendance_session_status:
OPEN
CLOSED
```

`PENDING` is **not stored**. It is derived when an active student has no attendance record for the relevant session.

---

# 4. `profiles`

```sql
profiles
```

Fields:

```text
id           UUID PRIMARY KEY
role         user_role NOT NULL
created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
```

Constraints:

- `id` references `auth.users.id`
- `role` must be `WARDEN` or `STUDENT`

---

# 5. `students`

```sql
students
```

Fields:

```text
id             UUID PRIMARY KEY
profile_id     UUID UNIQUE NOT NULL
student_id     TEXT UNIQUE NOT NULL
full_name      TEXT NOT NULL
email          TEXT NOT NULL
block          TEXT NOT NULL
room_number    TEXT NOT NULL
is_active      BOOLEAN NOT NULL DEFAULT true
created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
```

Foreign key:

```text
profile_id → profiles.id
```

Constraints:

- `profile_id` unique
- `student_id` unique
- Email required
- Room and block required

---

# 6. `attendance_sessions`

```sql
attendance_sessions
```

Fields:

```text
id            UUID PRIMARY KEY
session_date  DATE UNIQUE NOT NULL
name          TEXT NOT NULL
opens_at      TIMESTAMPTZ NOT NULL
closes_at     TIMESTAMPTZ NOT NULL
status        attendance_session_status NOT NULL
created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
```

Rules:

- One standard attendance session per hostel date.
- `opens_at < closes_at`
- New student submissions require `status = OPEN`.

---

# 7. `attendance_records`

```sql
attendance_records
```

Fields:

```text
id             UUID PRIMARY KEY
session_id     UUID NOT NULL
student_id     UUID NOT NULL
status         attendance_status NOT NULL
submitted_at   TIMESTAMPTZ
submitted_by   UUID NOT NULL
created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
```

Foreign keys:

```text
session_id → attendance_sessions.id
student_id → students.id
submitted_by → profiles.id
```

Critical constraint:

```text
UNIQUE(session_id, student_id)
```

This is the database-level protection against duplicate attendance.

---

# 8. `audit_logs`

```sql
audit_logs
```

Fields:

```text
id               UUID PRIMARY KEY
actor_profile_id UUID NOT NULL
action           TEXT NOT NULL
entity_type      TEXT NOT NULL
entity_id        UUID NOT NULL
before_data      JSONB
after_data       JSONB
created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
```

Foreign key:

```text
actor_profile_id → profiles.id
```

MVP action:

```text
ATTENDANCE_CORRECTED
```

Audit entries must not be editable through the normal application.

---

# 9. Indexes

Create indexes for expected query patterns:

```text
students(student_id)
students(full_name)
students(room_number)
students(block)

attendance_sessions(session_date)

attendance_records(session_id)
attendance_records(student_id)
attendance_records(session_id, student_id)

audit_logs(actor_profile_id)
audit_logs(entity_type, entity_id)
```

Use sensible database indexing; do not add indexes without a query/use case.

---

# 10. Derived Attendance Logic

## Expected students

```sql
SELECT *
FROM students
WHERE is_active = true;
```

## Submitted students

Students with a valid attendance record for the session.

## Missing students

Conceptually:

```sql
active_students
LEFT JOIN attendance_records
  ON attendance_records.student_id = students.id
 AND attendance_records.session_id = target_session
WHERE attendance_records.id IS NULL;
```

This logic must be deterministic.

---

# 11. Attendance Percentage

For the current session:

```text
percentage =
submitted active students
/
expected active students
× 100
```

If expected student count is zero:

```text
percentage = 0
```

Round the displayed percentage to a sensible whole number unless greater precision is genuinely useful.

---

# 12. Student Attendance Submission

The browser sends:

```json
{
  "sessionId": "uuid"
}
```

The server obtains the student identity from the authenticated session.

The client must **not** be trusted to determine `student_id`.

Server flow:

```text
authenticated user
→ profile
→ student
→ validate active
→ validate session
→ validate session OPEN
→ check duplicate
→ create PRESENT record
```

---

# 13. Student Submission Rules

A submission is rejected when:

- User is unauthenticated.
- User is not a student.
- Student record does not exist.
- Student is inactive.
- Session does not exist.
- Session is closed.
- Attendance already exists.

Normal student submission always creates:

```text
status = PRESENT
submitted_by = authenticated profile
submitted_at = now()
```

Students cannot choose another status.

---

# 14. Warden Correction Rules

Warden may change an attendance status for an existing record.

Allowed statuses:

```text
PRESENT
ON_LEAVE
OUTSIDE
```

For the MVP UI, expose only statuses that the product actually supports operationally. `ON_LEAVE` and `OUTSIDE` are primarily future-state compatibility.

Every correction must create an audit entry containing:

```text
actor
attendance record
before state
after state
timestamp
```

---

# 15. API Contracts

## Authentication

Supabase Auth handles credential authentication.

Logical operations:

```text
signIn(email, password)
signOut()
getCurrentUser()
getCurrentProfile()
```

---

## `GET /api/students/me`

**Access:** Student

Returns current student's profile.

Example:

```json
{
  "id": "uuid",
  "studentId": "RVU12345",
  "fullName": "Ananya Sharma",
  "email": "ananya@example.com",
  "block": "A",
  "roomNumber": "204",
  "isActive": true
}
```

---

## `GET /api/students`

**Access:** Warden

Optional query parameters:

```text
search
block
roomNumber
isActive
```

---

## `GET /api/attendance/today`

**Access:** Warden

Returns:

```json
{
  "session": {
    "id": "uuid",
    "date": "2026-08-31",
    "status": "OPEN"
  },
  "summary": {
    "expected": 120,
    "submitted": 108,
    "missing": 12,
    "percentage": 90
  },
  "students": []
}
```

---

## `POST /api/attendance`

**Access:** Student

Request:

```json
{
  "sessionId": "uuid"
}
```

Response:

```json
{
  "attendanceId": "uuid",
  "status": "PRESENT",
  "submittedAt": "2026-08-31T21:42:00Z"
}
```

---

## `GET /api/attendance/me`

**Access:** Student

Optional:

```text
from
to
```

Response:

```json
{
  "records": [
    {
      "sessionDate": "2026-08-31",
      "status": "PRESENT",
      "submittedAt": "2026-08-31T21:42:00Z"
    }
  ]
}
```

---

## `GET /api/attendance`

**Access:** Warden

Optional:

```text
studentId
search
roomNumber
status
from
to
```

Returns attendance records matching permitted filters.

---

## `GET /api/attendance/missing`

**Access:** Warden

Response:

```json
{
  "sessionId": "uuid",
  "students": [
    {
      "studentId": "RVU12345",
      "fullName": "Ananya Sharma",
      "block": "A",
      "roomNumber": "204"
    }
  ]
}
```

---

## `GET /api/attendance/statistics`

**Access:** Warden

Optional:

```text
from
to
studentId
block
```

Response:

```json
{
  "expectedTotal": 120,
  "submittedTotal": 108,
  "missingTotal": 12,
  "completionPercentage": 90,
  "averageAttendancePercentage": 92.4
}
```

---

## `PATCH /api/attendance/:attendanceId`

**Access:** Warden

Request:

```json
{
  "status": "PRESENT"
}
```

The server performs the correction and audit operation.

---

# 16. Error Contract

All API errors should follow:

```json
{
  "error": {
    "code": "ATTENDANCE_ALREADY_SUBMITTED",
    "message": "Attendance has already been submitted for this session."
  }
}
```

Required codes:

```text
AUTH_REQUIRED
FORBIDDEN
VALIDATION_ERROR
STUDENT_NOT_FOUND
SESSION_NOT_FOUND
SESSION_CLOSED
ATTENDANCE_ALREADY_SUBMITTED
ATTENDANCE_NOT_FOUND
INVALID_ATTENDANCE_STATUS
INTERNAL_ERROR
```

Do not expose raw database errors to users.

---

# 17. Authorization Matrix

| Operation | Warden | Student | Security |
|---|---:|---:|---:|
| Login | ✅ | ✅ | ❌ |
| View own profile | ✅ | ✅ | ❌ |
| View all students | ✅ | ❌ | ❌ |
| View all attendance | ✅ | ❌ | ❌ |
| View own attendance | ✅ | ✅ | ❌ |
| Submit attendance | Override | ✅ | ❌ |
| Correct attendance | ✅ | ❌ | ❌ |
| View audit logs | Restricted | ❌ | ❌ |
| AI access | Future | ❌ initially | ❌ |

---

# 18. RLS Requirements

RLS must enforce the following behavior.

## Profiles

Student:

```text
SELECT own profile
```

Warden:

```text
SELECT permitted profiles
```

## Students

Student:

```text
SELECT own student record
```

Warden:

```text
SELECT all student records
```

## Attendance

Student:

```text
SELECT own records
INSERT own record
```

Student cannot:

```text
SELECT another student's records
UPDATE arbitrary records
DELETE records
```

Warden:

```text
SELECT all
UPDATE permitted attendance
```

Deletion of attendance records should not be exposed through the MVP.

## Audit logs

Students:

```text
NO ACCESS
```

Warden:

```text
READ as permitted
CREATE through application workflow
```

Avoid allowing clients to directly insert arbitrary audit records.

---

# 19. Authentication Flow

```text
Login
 ↓
Supabase Auth
 ↓
Authenticated user
 ↓
Load profile
 ↓
Determine role
 ↓
Route to:
   Warden Dashboard
   OR
   Student Dashboard
```

If a profile is missing or invalid, fail safely instead of assuming a role.

---

# 20. Warden Dashboard Requirements

The dashboard should prioritize exactly:

```text
1. Students in hostel
2. Today's attendance
3. Needs attention
4. Quiet operational status
```

Required information:

```text
Attendance: submitted / expected
Progress: horizontal
Missing students: actionable list
Basic statistics
Recent relevant activity
```

Use the existing design direction from PRD Section 8.

Do not introduce:

- Donut charts
- Circular attendance rings
- Fake AI panels
- Excessive metrics
- Generic SaaS dashboard patterns

---

# 21. Student Dashboard Requirements

Required:

```text
Current attendance status
Attendance submission action
Submission confirmation
Personal attendance summary
Attendance history
```

Keep the flow extremely short:

```text
Login
→ Dashboard
→ Submit attendance
→ Confirmation
```

---

# 22. Session Handling

For the MVP, use one standard daily session.

The application must know:

```text
current hostel date
session status
opens_at
closes_at
```

Use:

```text
Asia/Kolkata
```

for hostel-local date/session calculations.

Timestamps remain timezone-aware.

---

# 23. Seed Data

Development seed data should contain:

### Users

- 1 warden
- 8–12 students

### Students

Include a realistic spread across:

```text
Block A
Block B
multiple rooms
active students
```

### Attendance

Create:

- One open current session
- Some submitted records
- Some missing students
- Historical sessions

Example development state:

```text
12 students
9 submitted
3 missing
```

Seed passwords must be development-only and documented as such.

Never use real student data.

---

# 24. Testing Requirements

## Unit tests

Test:

- Missing attendance calculation
- Attendance percentage
- Active/inactive filtering
- Duplicate prevention
- Open/closed session rules
- Warden correction rules

## Authorization tests

Test:

- Student cannot access another student's records
- Student cannot access warden endpoints
- Student cannot submit for another student
- Security has no access
- Warden can access required records

## Integration tests

Test:

```text
login
→ submit attendance
→ database update
→ warden dashboard result
```

## End-to-end test

At least one complete student-to-warden flow must pass.

---

# 25. Environment Configuration

Use:

```text
.env.local
```

for local development.

Provide:

```text
.env.example
```

with placeholders only.

Client-safe configuration may include:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Never place service-role keys or secrets in frontend code.

Never commit `.env` files.

---

# 26. Git Rules

Use small, meaningful commits.

Examples:

```text
chore: initialize SATTVA frontend
feat: add Supabase authentication
feat: add student attendance submission
feat: add warden attendance dashboard
feat: add attendance history
feat: add attendance correction audit
test: add attendance authorization tests
```

Do not commit:

```text
.env
API keys
tokens
passwords
node_modules
build output
.DS_Store
```

---

# 27. Implementation Order

Build strictly in this sequence:

```text
1. React/Vite project foundation
        ↓
2. Supabase project/configuration
        ↓
3. PostgreSQL schema + migrations
        ↓
4. Seed/demo data
        ↓
5. Authentication
        ↓
6. Profiles + role routing
        ↓
7. RLS policies
        ↓
8. Student dashboard
        ↓
9. Attendance session logic
        ↓
10. Student attendance submission
        ↓
11. Warden attendance service
        ↓
12. Warden dashboard
        ↓
13. Missing attendance
        ↓
14. Attendance history/search
        ↓
15. Warden correction
        ↓
16. Audit logging
        ↓
17. Automated tests
        ↓
18. Integration/E2E testing
        ↓
19. Deployment
```

After each major step:

```text
implement
→ run tests
→ run typecheck
→ run build
→ fix errors
→ verify
→ commit
```

---

# 28. Cursor/Replit Guardrails

Any coding agent must follow these rules:

1. Read PRD, HLD, LLD, and this document before implementation.
2. Implement only the current Attendance MVP.
3. Do not implement future AI, IoT, WhatsApp, security, or other hostel modules.
4. Do not redesign architecture without an explicit instruction.
5. Do not invent database tables unless required by the current specification.
6. Do not give the LLM direct database access.
7. Do not put business-critical attendance logic only in React.
8. Do not trust client-provided student identity.
9. Do not weaken RLS to make a feature easier.
10. Test every security-sensitive feature.
11. Keep code modular so future modules can reuse the existing foundation.
12. Stop after completing the defined phase rather than automatically expanding scope.

---

# 29. Definition of Done

The Attendance MVP is ready for demonstration when:

```text
✅ Warden can log in
✅ Student can log in
✅ Student sees only their own permitted data
✅ Student can submit attendance
✅ Duplicate attendance is prevented
✅ Warden sees accurate totals
✅ Warden sees missing students
✅ Warden can search attendance
✅ Warden can view history
✅ Warden can correct attendance
✅ Corrections are audited
✅ RLS blocks unauthorized access
✅ Core tests pass
✅ Build passes
✅ No secrets are committed
✅ Application works without AI/IoT/WhatsApp
```

---

# 30. Future AI Compatibility

The following functions are the intended future agent-tool boundary:

```ts
getStudents(filters)
getTodayAttendance()
getMissingAttendance(sessionId)
getStudentAttendance(studentId, filters)
getAttendanceStatistics(filters)
```

These functions should return structured application data.

They must remain independent of any particular LLM or LangGraph implementation.

The future agent architecture is:

```text
Warden
 ↓
LangGraph
 ↓
LLM
 ↓
Controlled Tool
 ↓
Existing SATTVA Service
 ↓
PostgreSQL
```

The AI does not become the source of truth.

---

# 31. Final Implementation Boundary

The MVP architecture is:

```text
                  SATTVA
                    │
        ┌───────────┴───────────┐
        │                       │
     WARDEN                  STUDENT
        │                       │
        └───────────┬───────────┘
                    ▼
             React Frontend
                    │
                    ▼
             App/API Layer
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
       Student   Attendance  Audit
       Service    Service    Service
          │         │         │
          └─────────┼─────────┘
                    ▼
             Supabase
             PostgreSQL
                    │
                   RLS
```

Anything outside this diagram is future scope unless explicitly added later.

---

# 32. Engineering Authority

When documents appear to conflict:

```text
Implementation Specification
        ↓
LLD
        ↓
HLD
        ↓
PRD
```

However, the implementation specification must not contradict a product requirement intentionally. If a contradiction is discovered, stop and flag it rather than silently changing scope.

The goal is a **small, secure, working Attendance MVP** that becomes the foundation for later SATTVA modules.