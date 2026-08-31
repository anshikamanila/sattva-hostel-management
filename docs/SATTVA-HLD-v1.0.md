# High-Level Design (HLD)

## SATTVA — Intelligent Hostel Management Platform

**Module:** Attendance MVP
**Version:** 1.1
**Date:** 31 August 2026
**Status:** Draft — derived from PRD v1.2
**Supersedes:** HLD v1.0 (terminology/scope-labeling alignment with PRD v1.2 — no architectural changes)
**Scope:** Attendance MVP only

---

# 1. Purpose

This document defines the high-level technical architecture for SATTVA's Attendance MVP.

The HLD translates the PRD into major system components, responsibilities, interactions, security boundaries, and deployment structure.

It does **not** define detailed classes, individual API payloads, database column definitions, or implementation code. Those belong in the LLD and subsequent engineering documents.

Per PRD v1.2 §0: Sections 15–18 (AI, IoT, and Notification architecture) describe architectural context for later phases. They are not implementation requirements for this MVP — the runtime delivered in this phase is fully described by Section 29 alone.

---

# 2. Architectural Goals

The architecture must:

1. Support the Attendance MVP with minimal unnecessary complexity.
2. Securely separate warden and student capabilities.
3. Ensure attendance state is determined by deterministic application logic.
4. Keep the future AI agent outside the core attendance logic.
5. Provide clean service/API boundaries that can later become AI tools.
6. Allow future modules to be added without replacing the core foundation.
7. Support database-level authorization.
8. Keep the frontend independent from direct privileged database access.
9. Be deployable at low cost using the selected technology direction.
10. Remain understandable and maintainable for a student development team.

---

# 3. System Scope

## 3.1 Current MVP

```text
Authentication
    ↓
Student Management
    ↓
Attendance
    ↓
Warden Dashboard
    ↓
Student Dashboard
```

## 3.2 Future systems

The architecture leaves extension points for:

```text
AI Agent
IoT
Notifications
Complaints
Leave
Deliveries
Cleaning
Movement / Entry-Exit
Analytics
```

These are not implemented in the Attendance MVP.

---

# 4. High-Level Architecture

```text
                         SATTVA
                           │
            ┌──────────────┴──────────────┐
            │                             │
            ▼                             ▼
     Warden Web App                Student Web App
       React/TS                     React/TS
            │                             │
            └──────────────┬──────────────┘
                           │
                           ▼
                 Application/API Layer
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
          Auth         Attendance      Student
         Service        Service        Service
             │             │             │
             └─────────────┼─────────────┘
                           │
                           ▼
                  Supabase PostgreSQL
                           │
                           ▼
                 Database-level Security
                     / Row-Level Security
```

The future architecture extends this without changing the fundamental foundation:

```text
                    Existing Platform
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
         AI Agent        IoT Layer    Notification
         LangGraph       ESP32/MQTT      Layer
             │
             ▼
      Controlled Tools
             │
             ▼
       Application Services
```

---

# 5. Major Components

## 5.1 Web Frontend

**Technology:** React + Vite + TypeScript + Tailwind CSS

The frontend provides separate experiences based on authenticated user role.

### Warden interface

Responsible for:

* Authentication UI
* Attendance dashboard
* Student search
* Attendance history
* Statistics
* Administrative attendance operations

### Student interface

Responsible for:

* Authentication UI
* Attendance submission
* Current attendance status
* Personal attendance history

The frontend must never be trusted as the authorization boundary.

---

# 6. Application/API Layer

The application layer sits between the frontend and data layer.

Its responsibilities include:

* Request validation
* Business rules
* Attendance logic
* Authorization checks
* Student-related operations
* Attendance queries
* Administrative corrections
* Audit handling
* Providing stable service boundaries for future modules

Conceptually:

```text
Frontend
   ↓
Application/API
   ↓
Business Services
   ↓
Database
```

The frontend should not contain authoritative business rules.

---

# 7. Core Services

The MVP should be organized around modular services.

## 7.1 Authentication Service

Responsible for:

* Login
* Session management
* Identity
* Role association
* Authentication state

Authentication is delegated to Supabase Auth.

---

## 7.2 Student Service

Responsible for:

* Student records
* Student lookup
* Active/inactive state
* Student-to-user association

---

## 7.3 Attendance Service

This is the core domain service.

Responsible for:

* Attendance submission
* Attendance validation
* Duplicate prevention
* Attendance retrieval
* Missing-attendance calculation
* Attendance history
* Attendance statistics
* Warden administrative corrections

The Attendance Service owns the authoritative attendance rules.

---

## 7.4 Audit Service

Responsible for recording significant administrative changes.

At MVP level, it primarily supports:

* Attendance corrections
* Actor identity
* Timestamp
* Changed record
* Relevant before/after information

A broader platform-wide audit system may be introduced later.

---

# 8. Database

**Technology:** PostgreSQL through Supabase

The database is the persistent source of truth for the MVP.

Conceptually:

```text
Supabase
│
├── Authentication
│
└── PostgreSQL
     │
     ├── Users / roles
     ├── Students
     ├── Attendance
     └── Audit records
```

The detailed schema will be defined separately in:

**LLD → Database Schema**

---

# 9. Authorization Architecture

Authorization must be enforced in multiple layers.

```text
                  Request
                     │
                     ▼
               Authentication
                     │
                     ▼
                Role Check
                     │
                     ▼
             Application Rules
                     │
                     ▼
              Database Policy
```

### Warden

Can access all attendance data and permitted administrative functions.

### Student

Can access only their own attendance data and permitted student functionality.

### Security

No application credentials or permissions exist in the MVP.

---

# 10. Row-Level Security

Where appropriate, PostgreSQL Row-Level Security should enforce data boundaries.

Conceptually:

```text
Student A
    ↓
Can READ/WRITE only Student A's permitted records

Student B
    ↓
Can READ/WRITE only Student B's permitted records

Warden
    ↓
Can access all attendance records
```

This ensures that a malicious or incorrectly modified frontend cannot simply expose another student's information.

Detailed policies belong in the LLD/security specification.

---

# 11. Attendance Data Flow

## 11.1 Student Submission

```text
Student
   │
   │ Submit attendance
   ▼
React Frontend
   │
   ▼
Application/API
   │
   ├── Authenticate user
   ├── Validate request
   ├── Confirm session
   ├── Prevent duplicate
   └── Apply attendance rules
          │
          ▼
     PostgreSQL
          │
          ▼
     Confirmation
          │
          ▼
       Student
```

---

# 12. Missing Attendance Calculation

Missing attendance must be deterministic.

```text
Active Students
      +
Attendance Session
      +
Attendance Records
      │
      ▼
Deterministic Attendance Service
      │
      ▼
Submitted / Missing / Other valid state
```

The LLM is never responsible for deciding attendance status.

For example:

```text
Student exists
AND
Student is active
AND
Student has no valid attendance record for session
=
Missing attendance
```

The exact business rules will be defined in the LLD.

---

# 13. Warden Dashboard Data Flow

```text
Warden
  │
  ▼
Dashboard
  │
  ▼
Attendance API
  │
  ▼
Attendance Service
  │
  ├── Today's totals
  ├── Missing students
  ├── Submission percentage
  ├── History
  └── Statistics
  │
  ▼
PostgreSQL
```

The dashboard should receive **prepared business data**, rather than implementing attendance calculations independently in the browser.

This ensures the dashboard and future AI tools use the same underlying logic.

---

# 14. Student Dashboard Data Flow

```text
Student
   │
   ▼
Student Dashboard
   │
   ├── Current attendance
   ├── Submission action
   └── Personal history
          │
          ▼
    Attendance Service
          │
          ▼
      PostgreSQL
```

The student dashboard receives only data permitted by authorization rules.

---

# 15. Future AI Architecture *(Product/architectural context — not an MVP implementation requirement)*

The AI agent is not part of the MVP runtime.

**AI-readiness clarification** (PRD v1.2 §10): "AI-ready" means the Attendance Service exposes clean, well-defined functions (Section 16) that can later be wrapped as LangGraph tools — it does not mean an agent runs against them in this phase.

However, the architecture should allow a future LangGraph agent to call controlled application services.

```text
                 Warden
                    │
                    ▼
                AI Agent
               LangGraph
                    │
                 LLM
                    │
                    ▼
              Agent Tool
                    │
                    ▼
          Application Service
                    │
                    ▼
                Database
```

Example:

```text
Warden:
"Who hasn't submitted attendance?"

       ↓

AI Agent

       ↓

get_missing_attendance()

       ↓

Attendance Service

       ↓

Deterministic result

       ↓

AI formats response
```

The AI does not calculate attendance independently.

---

# 16. AI Tool Boundary *(Product/architectural context — not an MVP implementation requirement)*

Future tools should map onto existing application services.

Example:

```text
get_today_attendance()
        ↓
Attendance Service

get_missing_attendance()
        ↓
Attendance Service

get_student_attendance()
        ↓
Attendance Service

get_attendance_statistics()
        ↓
Attendance Service
```

This prevents duplicate business logic between the normal application and the AI system.

---

# 17. Future IoT Boundary *(Product/architectural context — not an MVP implementation requirement)*

IoT is completely separated from the MVP.

Future architecture:

```text
ESP32
  │
  ▼
MQTT
  │
  ▼
IoT Service
  │
  ▼
Application/API
  │
  ▼
Database
  │
  ├── Dashboard
  │
  └── AI Agent
```

The Attendance MVP does not depend on MQTT, ESP32, or IoT availability.

---

# 18. Future Notification Boundary *(Product/architectural context — not an MVP implementation requirement)*

Notifications should eventually sit behind a provider-agnostic abstraction. Per PRD v1.2 §15/§20, WhatsApp is deferred to the future notification phase — no specific provider (personal WhatsApp vs. WhatsApp Business Cloud API) is decided here.

```text
Application / Agent
        │
        ▼
Notification Service
        │
   ┌────┴─────┐
   ▼          ▼
Provider A  Provider B
```

The actual provider is intentionally undecided until the notification phase.

---

# 19. Frontend Architecture

Conceptually:

```text
src/
│
├── pages/
├── components/
├── features/
│   └── attendance/
├── services/
├── hooks/
├── types/
├── auth/
└── utilities/
```

Feature-specific code should remain modular.

Attendance functionality should not be scattered across unrelated UI components.

Detailed frontend structure belongs in LLD.

---

# 20. Backend Architecture

Conceptually:

```text
API / Routes
      │
      ▼
Controllers / Handlers
      │
      ▼
Services
      │
      ▼
Data Access
      │
      ▼
Supabase / PostgreSQL
```

Example:

```text
Attendance Request
       ↓
Attendance Handler
       ↓
Attendance Service
       ↓
Attendance Data Access
       ↓
PostgreSQL
```

This separation ensures that business logic is reusable by:

* Web UI
* Future AI tools
* Future automation
* Potential future mobile clients

---

# 21. Error Handling

Errors should be handled in layers.

```text
Frontend
   ↓
User-friendly error
   ↑
API error response
   ↑
Service/business error
   ↑
Database error
```

The system should distinguish between:

* Authentication failure
* Authorization failure
* Invalid input
* Duplicate attendance
* Invalid attendance session
* Not found
* Database/system failure

Exact API error contracts will be defined later.

---

# 22. Reliability and Idempotency

Attendance submission must tolerate accidental retries.

For example:

```text
Student clicks Submit
       ↓
Request sent
       ↓
Network retry
       ↓
Second request
```

The system must not create unintended duplicate attendance records.

The database and application layer should work together to enforce this.

The exact uniqueness constraint belongs in the database design.

---

# 23. Audit Architecture

Administrative attendance changes should be auditable.

Conceptually:

```text
Warden
  ↓
Attendance Correction
  ↓
Attendance Service
  ├──────────► Attendance Record
  │
  └──────────► Audit Record
```

The audit record should identify the actor and relevant change information.

---

# 24. Deployment Architecture

Initial deployment:

```text
               Internet
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
      Vercel              Supabase
        │                   │
        ▼                   ▼
 React Application    Auth + PostgreSQL
```

The frontend is deployed separately from the managed backend/database services.

This keeps the initial infrastructure simple and low-cost.

---

# 25. Environment Separation

The project should support at least:

```text
Development
     ↓
Testing
     ↓
Production / Demo
```

Environment-specific values such as:

* Supabase project URL
* Public configuration
* Server secrets

must not be hardcoded into source files.

Secrets must never be committed to GitHub.

---

# 26. Extensibility Model

Future modules should connect to the same platform foundation.

```text
                  SATTVA CORE
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
   Attendance    Complaints     Leave
        │            │            │
        └────────────┼────────────┘
                     │
                 Shared Auth
                     │
                 Shared DB
                     │
                Shared API
                     │
          ┌──────────┴─────────┐
          ▼                    ▼
       AI Agent              IoT
```

Core infrastructure should be reused rather than recreated per module.

---

# 27. Architecture Principles

### Principle 1 — Single Source of Truth

PostgreSQL is the authoritative persistent source for attendance.

### Principle 2 — Business Logic Centralization

Attendance rules belong in the application/service layer, not in multiple clients.

### Principle 3 — Least Privilege

Users receive only the access required by their role.

### Principle 4 — AI Is an Interface, Not the Authority

The AI can query and interpret application data but does not become the authoritative source of attendance state.

### Principle 5 — IoT Is Decoupled

IoT must not be required for the Attendance MVP.

### Principle 6 — Future Modules Reuse the Core

Authentication, authorization, database, APIs, and deployment foundations should be reusable.

### Principle 7 — Incremental Development

Only the Attendance MVP is implemented now. Future architecture must not become future implementation scope by accident.

---

# 28. Key Architecture Decisions

| Area            | Decision                         |
| --------------- | -------------------------------- |
| Frontend        | React + Vite + TypeScript        |
| UI              | Tailwind CSS                     |
| Database        | PostgreSQL via Supabase          |
| Authentication  | Supabase Auth                    |
| Authorization   | Backend rules + PostgreSQL RLS   |
| Core domain     | Attendance Service               |
| AI              | Future LangGraph integration (context only, Section 15) |
| LLM             | TBD — provider/model not yet chosen; kept swappable, not tied to one vendor |
| AI access       | Controlled application tools     |
| IoT             | Future ESP32 + MQTT (context only, Section 17) |
| Notifications   | Future provider-agnostic service (deferred, Section 18) |
| Source control  | GitHub                           |
| Deployment      | Vercel + Supabase                |
| Current users   | Warden + Student                 |
| Security access | None in MVP                      |

---

# 29. MVP Runtime Architecture

The actual system delivered in this phase is:

```text
             ┌─────────────────┐
             │     WARDEN      │
             └────────┬────────┘
                      │
                      ▼
             ┌─────────────────┐
             │  Warden Web UI  │
             └────────┬────────┘
                      │
                      │
             ┌────────▼────────┐
             │                 │
             │ Application/API │
             │                 │
             └───┬─────────┬───┘
                 │         │
                 ▼         ▼
          Attendance     Student
           Service       Service
                 │         │
                 └────┬────┘
                      ▼
                Supabase
                PostgreSQL
                      ▲
                      │
             ┌────────┴────────┐
             │                 │
      Student Web UI      Supabase Auth
             │
             └──────────────────────►
```

The future AI and IoT layers are **not active components of this MVP runtime**.

---

# 30. HLD → LLD Boundaries

The following are intentionally deferred to LLD and supporting engineering documents:

* Detailed database tables and relationships
* Exact PostgreSQL columns and constraints
* RLS policies
* API endpoints
* Request/response schemas
* Error codes
* Class diagrams
* Sequence diagrams
* Service interfaces
* Frontend component hierarchy
* Authentication implementation details
* Agent tool schemas
* IoT message schemas

These must be derived from this HLD and PRD rather than invented independently.

---

# 31. Next Engineering Documents

The engineering sequence is:

```text
PRD v1.2
    ↓
HLD v1.1
    ↓
LLD v1.1
    ↓
Database Schema
    ↓
API Contracts
    ↓
Authentication / RLS Design
    ↓
Attendance Sequence Diagrams
    ↓
AI Tool Interface Specification
    ↓
Implementation
```

The **current implementation target remains only the Attendance MVP**.
