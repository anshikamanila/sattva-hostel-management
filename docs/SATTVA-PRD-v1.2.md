# Product Requirements Document (PRD)

## SATTVA — Intelligent Hostel Management Platform

**Module:** Attendance MVP (Module 1 of the larger platform)
**Version:** 1.2 (corrected canonical draft)
**Date:** 31 August 2026
**Status:** Draft — baseline for HLD & LLD
**Supersedes:** PRD v1.1, Draft PRD "Intelligent Hostel Management System" v1.0, and Draft PRD "Intelligent Hostel Management Platform" v1.0

---

## 0. How to Use This Document

This is the single source of truth for the Attendance MVP. Where the two earlier drafts disagreed, this version states one resolved answer plus the reasoning, and **Section 20 (Future-Phase Decisions)** lists the remaining items that are not yet decided but also do not block this MVP.

Sections 10 (AI Agent), 11 (IoT), the "Future messaging" row in Section 15, and Section 19 (Future Roadmap) describe architectural and product context for later phases. They are not implementation requirements for the current Attendance MVP — the MVP is complete without any of them being built (see Section 16).

Any AI tool or engineer building a part of this system should treat this document — not either earlier draft — as authoritative.

---

## 1. Product Overview

SATTVA is a web-based platform that digitizes and gradually automates hostel operations, starting with a girls' hostel currently run through physical registers (attendance, entry/exit, complaints, cleaning, deliveries, leave).

The initial MVP covers **student attendance management only**: a centralized attendance workflow for students and the warden, built on a foundation designed to support future modules without a rewrite.

The long-term platform will incorporate complaints, leave, outings, deliveries, cleaning, physical inside/outside tracking, notifications, and IoT-based monitoring — none of which are part of this MVP. An AI agent will eventually retrieve and analyze hostel information and execute approved actions through controlled tools; in this phase, AI is limited to attendance use cases and is not required for the system to function.

---

## 2. Problem Statement

The hostel currently runs on physical registers: an attendance book, a going-out/entry-exit book, a complaint book, a room-cleaning book, a delivery book, and a leave-note book. The warden manages two blocks with the help of one security staff member, and student numbers have grown to the point where manual tracking is no longer sustainable.

**For the warden**, this means:
- Chasing attendance manually every night (e.g. sending a WhatsApp message listing dozens of pending room numbers and following up individually)
- No visibility into who hasn't responded without cross-checking a book
- Security having to walk all four floors room-to-room around 10:30–11:00 PM, sometimes entering without knocking, to manually verify presence
- Difficulty spotting attendance trends or problem cases over time
- No centralized, auditable record

**For students**, submission is inconvenient and they often don't know whether it was recorded.

**System-level**, manual/paper records can't be searched, analyzed, or connected to future automation or IoT.

SATTVA's attendance module aims to be the single digital source of truth for attendance, eliminating the nightly room-to-room check and the manual follow-up cycle, while laying groundwork for the rest of the platform.

---

## 3. Product Vision

> Build a calm, premium hostel operating system that lets a warden with minimal computer experience manage hostel operations without becoming a software expert — evolving from a simple digital attendance system into an intelligent, partially autonomous hostel-management platform combining software, AI agents, controlled automation, and IoT.

**Manual records → Digital records → Intelligent insights → Automated actions → IoT-connected hostel**

The system must feel like it is quietly taking work off the warden's plate, never like a new system she has to learn and manage. See Section 8 (Warden Experience Requirements) for how this constrains design, not just function.

---

## 4. Goals

### 4.1 MVP Goals

1. Students can authenticate securely and submit attendance.
2. The warden can view today's attendance and identify who has not submitted.
3. Attendance history is persisted and queryable.
4. Unauthorized users cannot access attendance data.
5. The warden dashboard is clean, calm, and immediately understandable to a non-technical user (see Section 8).
6. The backend/API structure supports future modules without rework.
7. The data model and service layer provide a foundation for an attendance-focused AI agent, without requiring one to function.
8. Attendance determination itself is deterministic (rules against the database), never inferred by an LLM (see Section 9.4).

### 4.2 Long-Term Goals

- Automate repetitive hostel workflows (starting with attendance reminders sent from the warden's own WhatsApp).
- Provide a natural-language interface for the warden.
- Connect AI agents to controlled application tools, with human approval before consequential actions.
- Incorporate IoT data from hostel infrastructure.
- Provide useful analytics and anomaly detection.
- Replace the remaining physical registers with digital equivalents (Section 19).

---

## 5. Out of Scope for This MVP

Explicitly **not** part of the current implementation:

- Security-staff dashboard or login *(see Section 20 — this is a scope note for attendance-MVP sequencing, not a statement that security never gets application access; the original product concept does include a restricted security role for entry/exit and deliveries in a later module)*
- Inside/outside movement tracking, IoT-based entry/exit tracking
- Complaints, leave, outings, deliveries, room-cleaning, laundry, visitor management
- WhatsApp integration (real send) and any automated reminders
- Fully autonomous agent actions, multi-agent architecture, complex predictive AI
- Physical access-control systems

All of the above are planned for later modules (Section 19), not abandoned.

---

## 6. Target Users & Roles

### 6.1 Warden — primary administrative user, highest privilege in this MVP
Can: view all attendance, identify missing attendance, search/filter, view history and statistics, use the future AI assistant, perform permitted corrections.

### 6.2 Student — primary operational user, limited to own data
Can: log in, submit attendance, view own status and history. Cannot view or affect any other student's data.

### 6.3 Security — no application access in this MVP
Security is excluded from the software at this stage by design, not by omission. The room-to-room verification problem this creates is intended to be solved later — either through a restricted security role (entry/exit, deliveries) or IoT-based presence detection, decided when that module is scoped (Section 20).

### 6.4 Permission Matrix

| Capability | Warden | Student | Security |
|---|---|---|---|
| Login | Yes | Yes | No |
| View own attendance | Yes | Yes | No |
| View all attendance | Yes | No | No |
| Submit attendance | Administrative override only | Yes | No |
| Modify attendance | Yes | No | No |
| View attendance history | Yes (all) | Own only | No |
| Search / filter attendance | Yes | No | No |
| Use AI attendance assistant | Yes | No (not initially) | No |
| Application access | Full | Limited | None |

Authorization must be enforced at the backend/database level (e.g. Postgres row-level security or equivalent) — the frontend is never treated as a security boundary.

---

## 7. Core User Stories

### Warden
- **US-W01**: View today's attendance status at a glance.
- **US-W02**: See which students have not submitted, so I can follow up.
- **US-W03**: Search for a specific student and view their attendance.
- **US-W04**: View historical attendance to understand patterns over time.
- **US-W05**: See basic attendance statistics without manually tallying anything.
- **US-W06**: Ask the AI agent attendance questions in natural language once available (e.g. "who hasn't submitted attendance?").

### Student
- **US-S01**: Log in securely so only I can access my account.
- **US-S02**: Submit my attendance so my presence is recorded.
- **US-S03**: See confirmation that my attendance was recorded.
- **US-S04**: View my own attendance history to verify my records.

---

## 8. Warden Experience Requirements

This section formalizes design constraints established during earlier product work, so implementers don't rebuild a generic admin dashboard.

- The warden has very little computer experience; every screen should answer its purpose within a few seconds, with no exploration required.
- The dashboard's job is exactly four things: how many students are in the hostel, today's attendance status, whether anything needs her attention, and whether automation is working.
- Visual tone: calm, premium, restrained — not a generic SaaS template, health tracker, fintech dashboard, AI chatbot, or magazine/editorial layout. Modern sans-serif type (not serif/editorial headings). No glowing "AI" iconography, no unnecessary charts or fake metrics.
- Attendance is the hero feature: a prominent verified/total number with a simple horizontal progress indicator — not circular rings or donut charts.
- "Needs attention" should read as an exception to resolve, not an alarm.
- Automation status should read as a quiet background assistant ("Monitoring normally / last action / next action"), never as a chatbot panel.
- A working reference implementation of this dashboard already exists (React + Tailwind, mock data) and should be treated as the visual and structural baseline for the real, database-backed warden dashboard build in this MVP.

---

## 9. Functional Requirements

### 9.1 Authentication (FR-01)
- Secure login for warden and student roles (Supabase Auth or equivalent).
- Role determined after authentication; sessions maintained; unauthorized requests rejected.

### 9.2 Role-Based Access Control (FR-02)
- Enforced per Section 6.4, at the backend/database layer, not just the frontend.

### 9.3 Student Management (FR-03)
Minimum student record: student ID, name, email/login identifier, hostel/block, room, active/inactive status, role. Exact schema finalized at LLD.

### 9.4 Attendance (FR-04, FR-06, FR-09)
- Create attendance records associated with a specific student and a date/session; record submission timestamp.
- Prevent duplicate or invalid submissions for a given session.
- Deterministically compute, from stored data, which students have and have not submitted — **this logic must never be delegated to an LLM**. The pipeline is:

  ```
  Database → deterministic attendance rules → (later) agent → approved action
  ```

  An LLM may eventually phrase a reminder message or summarize results, but never decides whether a student is present.
- Preserve full historical records; allow warden-side administrative correction with an audit trail (Section 9.7).
- A student cannot submit as another student; a student cannot view another student's attendance.

### 9.5 Warden Dashboard (FR-05)
Per Section 8, plus concretely:
- Today's attendance count, total expected students, completion percentage
- List of students who have submitted / not submitted
- Attendance history and basic trends
- Prioritizes what needs the warden's attention over raw data density

### 9.6 Student Dashboard
- Attendance submission interface, current status, personal history, basic summary.

### 9.7 Attendance History, Search & Auditability (FR-07, FR-08, FR-10)
- Warden: view/search/filter history by student name, ID, room, status, or date; view any student's individual history.
- Student: own history only.
- Every record retains who submitted it, which session it belongs to, and when — sufficient for a future broader audit-log system.

---

## 10. AI Agent Requirements *(Product/architectural context — not an MVP implementation requirement)*

AI is **not required** for the first functioning attendance version; the application must work correctly without it, and will be added once the core workflow is stable.

**AI-readiness clarification**: the Attendance MVP does not include a production AI agent. "AI-ready" means the backend/service layer (Section 9) exposes clean, well-defined functions/APIs — the tools listed in Section 10.2 — that can later be wrapped as LangGraph agent tools. Building those functions well is an MVP requirement; running an agent against them is not.

### 10.1 Initial Capabilities (query-only)
The agent should understand requests such as:
- "How many students submitted attendance today?"
- "Who hasn't submitted attendance?"
- "Show today's attendance" / "Show attendance for [student]"
- "Summarize attendance for today"
- "Which students have poor attendance?"

### 10.2 Tool Model
The LLM must never receive unrestricted database access. It calls controlled application tools only:

```
get_students()
get_attendance() / get_today_attendance()
get_missing_attendance()
get_student_attendance()
get_attendance_summary() / get_attendance_statistics()
```

Additional action tools (e.g. sending a reminder) are introduced in later versions, not this MVP.

### 10.3 Human Approval
Any action with an external or consequential effect requires warden approval before execution:

```
Warden: "Remind everyone who hasn't submitted attendance."
   ↓
AI Agent → get_missing_attendance()
   ↓
Generate reminder (draft)
   ↓
Warden approval
   ↓
Notification service (provider-agnostic interface — deferred to future notification phase)
```

Fully autonomous external actions are out of scope for this MVP and for the first AI-assistance version that follows it.

---

## 11. IoT Requirements (Future-Ready, Not in MVP) *(Product/architectural context — not an MVP implementation requirement)*

IoT is not part of the attendance MVP and the MVP must not depend on it being available. Documented here only so the architecture doesn't block it later:

- Potential uses: inside/outside presence detection (replacing the manual room-to-room check), laundry/environment/utility monitoring, infrastructure fault detection.
- Direction: ESP32 devices → MQTT → IoT service → backend → database → AI agent/dashboard, loosely coupled to the core platform.
- Principle: IoT is added to solve a specific physical-monitoring problem, not for its own sake.

---

## 12. Security Requirements

- Authenticate all users; enforce server-side, role-based authorization (frontend is never a sufficient boundary).
- Restrict students to their own data; restrict administrative operations to the warden.
- No database credentials in the frontend; all requests validated server-side.
- Database-level access controls enforced where the chosen database supports them (e.g. Postgres RLS).
- Auditable record of administrative attendance changes.
- Security personnel receive no application credentials or permissions in this MVP (Section 6.3).

---

## 13. Non-Functional Requirements

- **Performance**: common attendance queries return quickly at hostel/college scale.
- **Reliability**: attendance records are never lost to a frontend refresh, navigation, or retry; successful submissions return clear confirmation.
- **Usability**: understandable to a non-technical warden (Section 8) and to students with no onboarding.
- **Scalability**: new modules (complaints, leave, deliveries, cleaning, IoT, AI automation) can be added without rebuilding auth, database, or frontend foundations.
- **Maintainability**: modular components, typed data structures, documented architecture, clear API contracts.
- **Testability**: core attendance behavior covered by automated tests.

---

## 14. Data Requirements (MVP Minimum)

### User
`user_id`, authentication identity, role

### Student
`student_id`, name, room, block, user association, active/inactive status

### Attendance
`attendance_id`, `student_id`, session/date, status, submission timestamp

Final relational structure is defined at LLD/DB-schema stage. Note for that stage: the broader product concept anticipates attendance statuses beyond simple present/absent — `PRESENT`, `PENDING`, `ON_LEAVE`, `OUTSIDE` — because "not yet submitted" and "on approved leave" are different states the dashboard needs to distinguish (see the Needs Attention vs. On Leave distinction in Section 8's reference dashboard). The schema should accommodate this even though leave management itself is a later module.

---

## 15. Technology Direction

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript |
| UI | Tailwind CSS |
| Database | PostgreSQL via Supabase, from day one |
| Authentication | Supabase Auth |
| Authorization | Application rules + database-level access controls |
| AI orchestration | LangGraph |
| LLM | TBD — provider/model not yet chosen; agent architecture (Section 10.2) must keep the LLM swappable rather than tied to one vendor/model |
| Agent tools | Controlled application functions/APIs (Section 10.2) |
| Future IoT hardware | ESP32 |
| Future IoT protocol | MQTT |
| Source control | GitHub |
| Development automation | Cursor |
| Future messaging | Deferred to the future notification phase; implemented behind a provider-agnostic notification interface (specific provider — e.g. warden's personal WhatsApp vs. WhatsApp Business Cloud API — decided at that phase, see Section 20) |
| Deployment | Vercel + Supabase |

---

## 16. MVP Acceptance Criteria

**Authentication**: student and warden can each log in; unauthorized users cannot reach protected functionality.

**Student attendance**: submission works, is correctly associated with student + session, duplicates/invalid submissions are handled, own history is viewable.

**Warden attendance**: current attendance viewable; missing students identifiable; history viewable; dashboard counts/percentages are accurate.

**Security**: a student cannot reach another student's data or warden functionality; security personnel have no application access.

**Quality**: core functionality has automated tests; the application builds successfully; documentation is sufficient to begin HLD/LLD.

---

## 17. MVP User Flows

**Student attendance flow**
```
Login → Student Dashboard → Attendance → Submit → Backend validation
→ Database → Recorded → Confirmation
```

**Warden monitoring flow**
```
Login → Warden Dashboard → Today's Attendance → View: Submitted / Missing / Statistics
```

**Future AI flow**
```
Warden natural-language request → AI Agent → select approved tool
→ retrieve attendance data → return result
```

---

## 18. Success Metrics

A warden should be able to answer **"Who hasn't submitted attendance today?"** without manually checking any individual record. Beyond that: reliable submission, accurate missing-attendance detection, correct history retention, and zero cross-student data leakage.

---

## 19. Future Roadmap *(Product context only — not an MVP implementation requirement)*

```
V1  Attendance          Auth → Student mgmt → Attendance → Warden dashboard
V2  AI Assistance       Natural-language queries → attendance insights
V3  AI Automation       Agent → tools → approved actions → notifications
V4  IoT                 ESP32 → MQTT → IoT data → hostel platform
V5  Expanded Hostel Ops Complaints, leave, deliveries, cleaning, laundry,
                        movement tracking, entry/exit, restricted security role
V6  Integrated Platform Students + Warden + IoT, unified under one AI agent
                        producing data, insights, and approved actions
```

---

## 20. Future-Phase Decisions

The database decision is now resolved (Section 15) and no longer blocks HLD. The following items remain genuinely undecided, but none of them block this MVP — each is settled when its relevant future phase is scoped:

1. **LLM provider/model**: intentionally left TBD (Section 15) so the agent architecture stays swappable; pick a specific provider/model when the AI-assistance phase (V2) begins.
2. **WhatsApp mechanism**: sending from the warden's own personal WhatsApp account vs. WhatsApp Business Cloud API — the two are not interchangeable (different UX, approval, and integration paths). Decide when the future notification phase is scoped; until then, the notification interface (Section 10.3) stays provider-agnostic.
3. **Security role's long-term shape**: excluded from the MVP either way, but not yet decided whether the eventual solution is a restricted security app role (entry/exit, deliveries) or purely IoT-based presence detection, or both. Decide when that module (V5) is scoped.

---

## 21. Product Principles

1. **Build incrementally** — each module ships independent value; don't force future modules into this MVP.
2. **Architect for expansion** — simple now, but auth/DB/frontend foundations must not block AI or IoT later.
3. **Minimum necessary access** — every role gets only what its function requires; security gets none until a real need is scoped.
4. **AI uses controlled tools only** — never unrestricted database access; attendance state is always deterministic, never LLM-inferred.
5. **Automation stays controllable** — consequential actions require human approval.
6. **IoT solves physical problems** — added when it's the better tool for a specific problem, not for its own sake.
7. **Reduce the warden's work, not her learning curve** — every screen should make her feel she has less to do, never that she has a new system to manage.

---

## 22. Next Engineering Documents

```
PRD (this document)
  → HLD
  → LLD
  → Database Schema
  → API Contracts
  → Authentication / RBAC Design
  → AI Agent Architecture
  → IoT Architecture
```

Implementation begins only once these are sufficiently defined. Section 20's future-phase decisions do not block this sequence — they're settled as their respective phases are scoped.
