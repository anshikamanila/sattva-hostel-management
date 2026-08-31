# Low-Level Design (LLD)

## SATTVA — Intelligent Hostel Management Platform

**Module:** Attendance MVP
**Version:** 1.1
**Date:** 31 August 2026
**Status:** Draft — implementation blueprint derived from PRD v1.2 and HLD v1.1
**Supersedes:** LLD v1.0 (terminology/scope-labeling alignment with PRD v1.2 — no implementation changes)

---

# 1. Purpose

This LLD defines the implementation-level design for the SATTVA Attendance MVP.

It converts the PRD and HLD into concrete:

* Data structures
* Database tables and constraints
* Services and responsibilities
* API contracts
* Authentication and authorization behavior
* Validation rules
* Attendance logic
* Audit behavior
* Core interaction flows
* Future AI tool interfaces

The current implementation remains **attendance only**.

Per PRD v1.2 §0/§10: Sections 44–46 (Future AI Tool Interface, Future Notification Interface, Future Module Extension Pattern) describe architectural context for later phases and are not implementation requirements for this MVP.

---

# 2. Technology Baseline

| Layer                   | Technology                          |
| ----------------------- | ------------------------------------ |
| Frontend                | React + Vite + TypeScript           |
| Styling                 | Tailwind CSS                        |
| Backend / Data Platform | Supabase                            |
| Database                | PostgreSQL                          |
| Authentication          | Supabase Auth                       |
| Authorization           | PostgreSQL RLS + application checks |
| Source Control          | GitHub                              |
| Development Automation  | Cursor                              |
| Deployment              | Vercel + Supabase                   |

No LangGraph, IoT, MQTT, WhatsApp, or production AI agent is required for this implementation phase.

---

# 3. Core Domain Model

The MVP has four core concepts:

```text
User
  │
  └── Student profile

Student
  │
  └── Attendance records

Attendance Session
  │
  └── Attendance records

Audit Record
  │
  └── Administrative changes
```

Conceptually:

```text id="7sf9pp"
User ──────── 1:1 ──────── Student
                              │
                              │ 1:N
                              ▼
                        Attendance
                              │
                              │ N:1
                              ▼
                    Attendance Session

Warden ──────────────────────┐
                              │
                              ▼
                         Audit Record
```

---

# 4. Database Design

## 4.1 `profiles`

Represents an authenticated application user.

| Field        | Type        | Constraints                 |
| ------------ | ----------- | ---------------------------- |
| `id`         | UUID        | PK; maps to `auth.users.id` |
| `role`       | ENUM        | `WARDEN`, `STUDENT`         |
| `created_at` | TIMESTAMPTZ | NOT NULL                    |
| `updated_at` | TIMESTAMPTZ | NOT NULL                    |

### Notes

* Security users are deliberately absent from the MVP role set.
* Authentication identity is owned by Supabase Auth.
* Application role is stored separately from authentication credentials.

---

# 5. `students`

Stores hostel-specific information about students.

| Field         | Type        | Constraints                |
| ------------- | ----------- | --------------------------- |
| `id`          | UUID        | PK                          |
| `profile_id`  | UUID        | UNIQUE, FK → `profiles.id` |
| `student_id`  | TEXT        | UNIQUE, NOT NULL            |
| `full_name`   | TEXT        | NOT NULL                    |
| `email`       | TEXT        | NOT NULL                    |
| `block`       | TEXT        | NOT NULL                    |
| `room_number` | TEXT        | NOT NULL                    |
| `is_active`   | BOOLEAN     | NOT NULL, default `true`    |
| `created_at`  | TIMESTAMPTZ | NOT NULL                    |
| `updated_at`  | TIMESTAMPTZ | NOT NULL                    |

### Notes

`student_id` is the hostel/college-facing identifier.

`profile_id` links the student record to the authenticated user.

Inactive students remain in the database for historical integrity but are excluded from expected-attendance calculations.

---

# 6. `attendance_sessions`

Represents a particular attendance-taking period.

| Field          | Type        | Constraints      |
| -------------- | ----------- | ----------------- |
| `id`           | UUID        | PK               |
| `session_date` | DATE        | NOT NULL         |
| `name`         | TEXT        | NOT NULL         |
| `opens_at`     | TIMESTAMPTZ | NOT NULL         |
| `closes_at`    | TIMESTAMPTZ | NOT NULL         |
| `status`       | ENUM        | `OPEN`, `CLOSED` |
| `created_at`   | TIMESTAMPTZ | NOT NULL         |

### MVP assumption

The MVP supports one standard attendance session per hostel day.

The schema intentionally models sessions separately from dates so future versions can support multiple sessions per day without restructuring the attendance table.

### Uniqueness

For the MVP:

```text
UNIQUE(session_date)
```

This prevents accidental creation of multiple standard daily sessions.

---

# 7. `attendance_records`

Stores the actual student attendance state for a session.

| Field          | Type        | Constraints                             |
| -------------- | ----------- | ----------------------------------------- |
| `id`           | UUID        | PK                                      |
| `session_id`   | UUID        | NOT NULL, FK → `attendance_sessions.id` |
| `student_id`   | UUID        | NOT NULL, FK → `students.id`            |
| `status`       | ENUM        | `PRESENT`, `ON_LEAVE`, `OUTSIDE`        |
| `submitted_at` | TIMESTAMPTZ | Nullable                                |
| `submitted_by` | UUID        | NOT NULL, FK → `profiles.id`            |
| `created_at`   | TIMESTAMPTZ | NOT NULL                                |
| `updated_at`   | TIMESTAMPTZ | NOT NULL                                |

### Critical uniqueness rule

```text
UNIQUE(session_id, student_id)
```

A student therefore has at most one authoritative attendance record for a session.

---

# 8. Handling "Missing" and "Pending"

`PENDING` should **not** be stored as a normal attendance record in the database for the MVP.

Instead:

```text
Active student
+
No attendance record for current session
=
PENDING / NOT SUBMITTED
```

This is preferable because “not submitted” represents **absence of a record**, not a submitted attendance state.

Therefore:

### Stored states

```text
PRESENT
ON_LEAVE
OUTSIDE
```

### Derived state

```text
PENDING
```

This keeps the database normalized and prevents stale `PENDING` records.

### MVP usage

Because leave and outside tracking are future modules, a newly created MVP attendance record will normally use:

```text
PRESENT
```

`ON_LEAVE` and `OUTSIDE` are reserved for future workflows and must not be manually exposed to students in the MVP unless explicitly implemented.

---

# 9. `audit_logs`

Tracks administrative changes.

| Field              | Type        | Constraints                  |
| ------------------ | ----------- | ------------------------------ |
| `id`               | UUID        | PK                            |
| `actor_profile_id` | UUID        | NOT NULL, FK → `profiles.id` |
| `action`           | TEXT/ENUM   | NOT NULL                     |
| `entity_type`      | TEXT        | NOT NULL                     |
| `entity_id`        | UUID        | NOT NULL                     |
| `before_data`      | JSONB       | Nullable                     |
| `after_data`       | JSONB       | Nullable                     |
| `created_at`       | TIMESTAMPTZ | NOT NULL                     |

### MVP examples

```text
ATTENDANCE_CORRECTED
```

The audit record must identify:

* Who made the change
* Which attendance record changed
* Previous state
* New state
* When it happened

---

# 10. Entity Relationships

```text id="5m5p91"
profiles
   │
   │ 1:1
   ▼
students
   │
   │ 1:N
   ▼
attendance_records
   ▲
   │ N:1
   │
attendance_sessions


profiles
   │
   │ 1:N
   ▼
audit_logs
```

---

# 11. Database Constraints

The database must enforce critical invariants.

### Student identity

```text
students.student_id UNIQUE
students.profile_id UNIQUE
```

### Attendance uniqueness

```text
attendance_records(session_id, student_id) UNIQUE
```

### Session uniqueness

```text
attendance_sessions.session_date UNIQUE
```

### Referential integrity

Foreign keys must prevent orphaned:

* Students
* Attendance records
* Sessions
* Audit records

### Active student rule

Inactive students are not counted in expected attendance.

---

# 12. Attendance Business Rules

## Rule 1 — Expected students

Expected attendance consists of:

```text
students
WHERE is_active = true
```

---

## Rule 2 — Submitted

A student is considered submitted when:

```text
attendance_record exists
AND
record.status is valid
```

---

## Rule 3 — Missing

A student is missing/pending when:

```text
active student
AND
no attendance record exists for current session
```

---

## Rule 4 — Duplicate submission

A student may not create another attendance record for the same session.

The database uniqueness constraint is authoritative.

---

## Rule 5 — Student identity

A student may only submit attendance for the currently authenticated student profile.

The client cannot choose an arbitrary `student_id` and gain authority from it.

---

## Rule 6 — Warden correction

A warden may correct an attendance record.

Every correction must produce an audit log.

---

## Rule 7 — Session timing

A student may submit attendance only when the session is `OPEN`.

A closed session is read-only for student submissions.

---

# 13. Attendance Status Model

```text
                  ┌───────────────┐
                  │ Active Student│
                  └───────┬───────┘
                          │
                          ▼
                 Current Session Open?
                     /          \
                   YES           NO
                    │             │
                    ▼             ▼
             Has record?       Read only
               /     \
             NO       YES
             │         │
             ▼         ▼
          PENDING    PRESENT
```

Future modules may introduce transitions such as:

```text
PENDING → ON_LEAVE
PENDING → OUTSIDE
```

but those transitions are not implemented in the Attendance MVP.

---

# 14. Service Architecture

The application should expose domain services rather than putting business logic directly in React components.

```text id="r1y7wq"
UI / API Handler
       │
       ▼
Service Layer
       │
       ├── Auth Service
       ├── Student Service
       ├── Attendance Service
       └── Audit Service
              │
              ▼
        Supabase / PostgreSQL
```

---

# 15. `AuthService`

### Responsibilities

* Authenticate users
* Retrieve session
* Determine application role
* Sign out
* Expose authenticated identity to the application

### Conceptual interface

```ts
getCurrentUser()
getCurrentProfile()
signIn(credentials)
signOut()
```

Authentication credentials remain managed by Supabase Auth.

---

# 16. `StudentService`

### Responsibilities

* Get authenticated student's profile
* Retrieve students for warden views
* Search students
* Determine active students

### Conceptual interface

```ts
getCurrentStudent()
getStudentById(id)
listStudents(filters)
searchStudents(query)
getActiveStudents()
```

---

# 17. `AttendanceService`

This is the central domain service.

### Responsibilities

* Create attendance records
* Validate attendance submissions
* Prevent duplicates
* Determine missing attendance
* Retrieve attendance history
* Calculate statistics
* Process warden corrections

### Conceptual interface

```ts
submitAttendance(studentId, sessionId)

getTodayAttendance()

getMissingAttendance(sessionId)

getStudentAttendance(studentId, filters)

getAttendanceHistory(filters)

getAttendanceStatistics(filters)

correctAttendance(attendanceId, newStatus, actorId)
```

All attendance business rules belong here or in database-enforced constraints.

---

# 18. `AuditService`

### Responsibilities

* Record administrative changes
* Create immutable audit entries

### Conceptual interface

```ts
createAuditLog({
  actorId,
  action,
  entityType,
  entityId,
  beforeData,
  afterData
})
```

Audit logs should not be editable through normal application operations.

---

# 19. API Architecture

The frontend communicates through application-level operations.

The exact deployment arrangement may use Supabase-backed server functions/API routes, but the logical contracts remain stable.

```text id="vl0g8k"
Frontend
   │
   ▼
API / Server Function
   │
   ▼
Service Layer
   │
   ▼
Supabase PostgreSQL
```

---

# 20. Authentication API Contracts

## POST `/auth/login`

### Request

```json
{
  "email": "student@example.com",
  "password": "********"
}
```

### Response

```json
{
  "user": {
    "id": "uuid",
    "role": "STUDENT"
  }
}
```

Authentication itself is handled by Supabase Auth.

---

# 21. Student API Contracts

## GET `/students/me`

Returns the authenticated student's permitted profile.

### Response

```json
{
  "id": "uuid",
  "studentId": "RVU12345",
  "fullName": "Student Name",
  "block": "A",
  "roomNumber": "204",
  "isActive": true
}
```

---

## GET `/students`

Warden-only.

Supports filters such as:

```text
search
block
room
isActive
```

---

# 22. Attendance API Contracts

## GET `/attendance/today`

### Warden-only

Returns the current session summary and attendance data.

### Response

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

# 23. Submit Attendance

## POST `/attendance`

### Student request

The student must not send `studentId` as an authoritative identity field.

```json
{
  "sessionId": "uuid"
}
```

The server derives the student from the authenticated user.

### Response

```json
{
  "attendanceId": "uuid",
  "status": "PRESENT",
  "submittedAt": "2026-08-31T21:42:00Z"
}
```

---

# 24. Student Attendance History

## GET `/attendance/me`

Student-only.

Optional filters:

```text
from
to
```

### Response

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

# 25. Warden Attendance History

## GET `/attendance`

Warden-only.

Possible query parameters:

```text
studentId
studentName
roomNumber
status
from
to
```

The backend performs filtering.

The frontend must not download all student records and filter sensitive data client-side.

---

# 26. Missing Attendance API

## GET `/attendance/missing`

Warden-only.

### Response

```json
{
  "sessionId": "uuid",
  "students": [
    {
      "studentId": "RVU12345",
      "fullName": "Student Name",
      "block": "A",
      "roomNumber": "204"
    }
  ]
}
```

The returned list is calculated deterministically by the Attendance Service.

---

# 27. Attendance Statistics API

## GET `/attendance/statistics`

Warden-only.

Possible parameters:

```text
from
to
studentId
block
```

### Response

```json
{
  "expectedTotal": 120,
  "submittedTotal": 108,
  "missingTotal": 12,
  "completionPercentage": 90,
  "averageAttendancePercentage": 92.4
}
```

The exact statistics exposed in the MVP should remain limited to useful, trustworthy metrics.

---

# 28. Administrative Correction API

## PATCH `/attendance/:attendanceId`

Warden-only.

### Request

```json
{
  "status": "PRESENT"
}
```

The server must:

1. Authenticate the warden.
2. Retrieve the existing record.
3. Validate the new status.
4. Update the record.
5. Create an audit log.
6. Return the updated record.

### Response

```json
{
  "attendanceId": "uuid",
  "status": "PRESENT",
  "updatedAt": "2026-08-31T22:04:00Z"
}
```

Students cannot access this endpoint.

---

# 29. Error Contract

API errors should follow one consistent structure.

```json
{
  "error": {
    "code": "ATTENDANCE_ALREADY_SUBMITTED",
    "message": "Attendance has already been submitted for this session."
  }
}
```

### Initial error codes

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

The frontend should translate these into simple user-facing messages.

---

# 30. Authentication and Authorization

## Student request

```text
Request
  ↓
Supabase authentication
  ↓
Authenticated user
  ↓
Profile role = STUDENT
  ↓
Student identity resolved
  ↓
RLS/application policy
  ↓
Permitted resource
```

## Warden request

```text
Request
  ↓
Supabase authentication
  ↓
Authenticated user
  ↓
Profile role = WARDEN
  ↓
Warden authorization
  ↓
RLS/application policy
  ↓
Permitted resource
```

---

# 31. RLS Policy Model

The exact SQL policies will be implemented separately, but the intended behavior is:

### Profiles

Students may read their own profile.

Warden may read permitted user/profile information.

### Students

Students may read only their own student record.

Warden may read all active/inactive student records as required for administration.

### Attendance

Students may:

* Read their own attendance.
* Create their own attendance for an open session.

Students may not:

* Read another student's attendance.
* Update/delete attendance records arbitrarily.
* Submit for another student.

Warden may:

* Read all attendance.
* Correct attendance.

### Audit logs

Warden/system-level operations may create audit records.

Normal students may not read audit logs.

---

# 32. Important Security Rule

Never trust:

```json
{
  "studentId": "someone-else"
}
```

from a student's client.

The server must derive identity from the authenticated session.

Correct model:

```text
Authenticated user
      ↓
profile_id
      ↓
student record
      ↓
attendance record
```

---

# 33. Sequence — Student Attendance Submission

```text id="g7q5n6"
Student
   │
   │ POST /attendance
   ▼
API Handler
   │
   ├── Authenticate
   ├── Resolve student
   ├── Get session
   ├── Check session OPEN
   └── Validate eligibility
           │
           ▼
     Attendance Service
           │
           ├── Check duplicate
           │
           ▼
       PostgreSQL
           │
           ▼
      Attendance created
           │
           ▼
        API Response
           │
           ▼
         Student
```

---

# 34. Sequence — Warden Dashboard

```text id="xl8i9k"
Warden
  │
  ▼
Dashboard
  │
  ├──── GET /attendance/today
  │
  ├──── GET /attendance/missing
  │
  └──── GET /attendance/statistics
              │
              ▼
       Attendance Service
              │
              ▼
          PostgreSQL
              │
              ▼
       Prepared results
              │
              ▼
           Dashboard
```

Where practical, these operations should be consolidated into an efficient dashboard query/service rather than causing unnecessary repeated network requests.

---

# 35. Sequence — Warden Correction

```text id="c6m8vk"
Warden
   │
   ▼
PATCH /attendance/:id
   │
   ▼
Authorization
   │
   ▼
Attendance Service
   │
   ├───────────────┐
   ▼               ▼
Update record   Audit Service
   │               │
   ▼               ▼
Database        Audit Log
   │
   └───────────────┘
            │
            ▼
        Response
```

The attendance update and corresponding audit operation should be handled transactionally where supported.

---

# 36. Frontend Feature Structure

Recommended structure:

```text
src/
├── app/
│   ├── router/
│   ├── providers/
│   └── app.tsx
│
├── features/
│   ├── auth/
│   ├── attendance/
│   └── students/
│
├── pages/
│   ├── Login/
│   ├── WardenDashboard/
│   └── StudentDashboard/
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── feedback/
│
├── services/
│   ├── auth/
│   ├── attendance/
│   └── students/
│
├── types/
└── utils/
```

Feature-specific business behavior should live close to its feature.

---

# 37. Frontend Route Model

Conceptually:

```text
/login

/warden
/warden/attendance
/warden/students

/student
/student/attendance
/student/history
```

Route guards should improve UX, but backend/database authorization remains authoritative.

---

# 38. Warden Dashboard Data Model

The dashboard should consume a prepared view model rather than exposing raw database structures to UI components.

Example:

```ts
type WardenAttendanceDashboard = {
  expected: number
  submitted: number
  missing: number
  completionPercentage: number
  missingStudents: StudentSummary[]
  recentActivity: AttendanceActivity[]
}
```

This keeps presentation independent from database structure.

---

# 39. Student Attendance View Model

```ts
type StudentAttendanceView = {
  currentSession: {
    id: string
    date: string
    isOpen: boolean
    status: "PENDING" | "PRESENT"
  }
  history: AttendanceHistoryItem[]
  summary: {
    submittedSessions: number
    totalSessions: number
    attendancePercentage: number
  }
}
```

`PENDING` here is a **UI/domain-derived state**, not a stored database enum.

---

# 40. Validation Rules

## Login

* Email format valid.
* Authentication handled by Supabase.

## Attendance submission

* Authenticated user required.
* User must be an active student.
* Session must exist.
* Session must be open.
* Student must not already have a record.
* Status is server-defined as `PRESENT` for normal student submission.

## Warden correction

* Warden role required.
* Attendance record must exist.
* Target status must be valid.
* Audit entry must be created.

---

# 41. Idempotency / Retry Handling

The system must tolerate repeated submission caused by:

* Double clicks
* Browser retries
* Network retries

The primary protection is:

```text
UNIQUE(session_id, student_id)
```

The service should translate a uniqueness violation into:

```text
ATTENDANCE_ALREADY_SUBMITTED
```

rather than a generic server error.

---

# 42. Time Handling

All stored timestamps should use timezone-aware PostgreSQL timestamps.

The system should establish one canonical hostel timezone:

```text
Asia/Kolkata
```

Session date calculations must use hostel-local time rather than the user's browser timezone.

This prevents errors around:

* Midnight
* Session opening/closing
* Attendance dates
* Historical reporting

---

# 43. Testing Design

## Unit tests

Attendance business rules:

* Active student is expected.
* Inactive student is excluded.
* Missing attendance is calculated correctly.
* Duplicate submission is rejected.
* Closed session rejects student submission.
* Warden correction creates an audit event.

## API tests

* Student can submit own attendance.
* Student cannot submit for another student.
* Student cannot retrieve another student's attendance.
* Student cannot access warden endpoints.
* Warden can retrieve all attendance.
* Warden can correct attendance.

## Database/RLS tests

Verify actual database policies independently of frontend behavior.

## End-to-end test

Minimum critical journey:

```text
Student login
→ Submit attendance
→ Warden login
→ Dashboard reflects submission
→ Missing count changes
```

---

# 44. Future AI Tool Interface *(Product/architectural context — not an MVP implementation requirement)*

The MVP does not run an AI agent. **AI-readiness clarification** (PRD v1.2 §10): building these functions cleanly is an MVP requirement (they are simply the Attendance/Student Service interfaces from Sections 16–17); wrapping them as LangGraph tools and running an agent against them is not. The following service functions should remain clean enough to become agent tools later:

```ts
getTodayAttendance()

getMissingAttendance(sessionId)

getStudentAttendance(studentId, filters)

getAttendanceStatistics(filters)

getStudents(filters)
```

These tools should return structured data.

The future LangGraph agent will sit **above** these functions:

```text
LLM
 ↓
LangGraph
 ↓
Tool
 ↓
Attendance Service
 ↓
Database
```

No AI logic belongs inside the Attendance Service.

---

# 45. Future Notification Interface *(Product/architectural context — not an MVP implementation requirement)*

Not implemented in MVP. Per PRD v1.2 §15/§20, this covers WhatsApp and any other channel — deferred to the future notification phase, with the provider (e.g. warden's personal WhatsApp vs. WhatsApp Business Cloud API) decided at that time.

Define only the architectural boundary:

```ts
interface NotificationService {
  sendNotification(request: NotificationRequest): Promise<NotificationResult>
}
```

The implementation/provider is deliberately deferred.

---

# 46. Future Module Extension Pattern *(Product/architectural context — not an MVP implementation requirement)*

A future module should follow the same structure:

```text
Feature
 ├── UI
 ├── API
 ├── Service
 ├── Data model
 ├── Authorization
 └── Tests
```

For example:

```text
attendance/
complaints/
leave/
deliveries/
cleaning/
iot/
```

Each module reuses:

```text
Auth
Database
Authorization
Audit
API infrastructure
```

---

# 47. Directory / Backend Structure

A logical backend structure:

```text
backend/
├── auth/
├── students/
├── attendance/
│   ├── attendance.service.ts
│   ├── attendance.types.ts
│   ├── attendance.validation.ts
│   └── attendance.repository.ts
├── audit/
├── shared/
│   ├── errors/
│   ├── auth/
│   └── database/
└── api/
```

The exact physical directory layout may be adapted to the selected Supabase/Vercel implementation model, but these logical boundaries should remain.

---

# 48. Environment Variables

Sensitive configuration must never be hardcoded.

Expected configuration categories include:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Server-only secrets, if introduced, must remain server-side and must not use the `VITE_` prefix.

`.env` files containing secrets must be excluded from Git.

---

# 49. Implementation Order

Cursor should implement the MVP in this order:

```text
1. Project foundation
        ↓
2. Supabase connection
        ↓
3. Database schema
        ↓
4. Auth
        ↓
5. RLS / authorization
        ↓
6. Student data
        ↓
7. Attendance sessions
        ↓
8. Attendance submission
        ↓
9. Student dashboard
        ↓
10. Warden attendance service
        ↓
11. Warden dashboard
        ↓
12. Attendance history/search
        ↓
13. Administrative correction + audit
        ↓
14. Automated tests
        ↓
15. Integration / end-to-end testing
        ↓
16. Deployment
```

---

# 50. Definition of Done

The Attendance MVP is technically complete when:

### Authentication

* Warden login works.
* Student login works.
* Unauthorized access is rejected.

### Data

* Students exist in PostgreSQL.
* Attendance sessions can be created.
* Attendance records persist correctly.
* Duplicate records are impossible.

### Student

* Student can submit attendance.
* Student receives confirmation.
* Student can view personal attendance history.

### Warden

* Warden can view today's attendance.
* Missing students are correctly identified.
* Statistics are accurate.
* Search/filter works.
* Warden can make permitted corrections.
* Corrections are auditable.

### Security

* Students cannot access another student's data.
* Students cannot access warden functionality.
* Security has no application access.
* RLS/database-level authorization is functioning.

### Quality

* Core attendance logic has automated tests.
* Application builds successfully.
* No secrets are committed.
* MVP works independently of AI and IoT.

---

# 51. Architecture Summary

```text
                         SATTVA MVP
                              │
              ┌───────────────┴───────────────┐
              │                               │
         Warden App                       Student App
              │                               │
              └───────────────┬───────────────┘
                              │
                              ▼
                       API / Services
                              │
                 ┌────────────┼─────────────┐
                 │            │             │
              Student     Attendance       Audit
              Service      Service        Service
                 │            │             │
                 └────────────┼─────────────┘
                              │
                              ▼
                    Supabase PostgreSQL
                              │
                     Database / RLS
```

Future layers connect above the existing foundation:

```text
                 Future Warden AI
                       │
                   LangGraph
                       │
                 Controlled Tools
                       │
                Existing Services
                       │
                    Database

ESP32
  ↓
MQTT
  ↓
Future IoT Service
  ↓
Existing Platform
```

The future layers must not alter the fundamental authority model of the Attendance Service.

---

# 52. Engineering Rule

The following hierarchy is authoritative:

```text
PRD
  ↓
HLD
  ↓
LLD
  ↓
Implementation
```

When implementation details are ambiguous, Cursor must not invent a conflicting architecture.

It should preserve:

* Deterministic attendance rules
* Least-privilege authorization
* Supabase PostgreSQL
* Service-layer business logic
* Database-enforced uniqueness
* Auditability
* AI as a future consumer of controlled services
* Incremental module development

The Attendance MVP must remain independently functional even if every future AI, IoT, and notification component is absent.
