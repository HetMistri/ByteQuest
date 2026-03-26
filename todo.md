# ByteQuest V1 Backend Delivery Plan

## Phase 1 - Event Core
Build:
- Event persistence model with status lifecycle (`scheduled`, `running`, `paused`, `ended`)
- Coordinator APIs: create event, start, pause, end
- Participant API: list scheduled events, event details

Success criteria:
- Coordinator can create and control event state through APIs
- Participants only see scheduled events in listing
- Event details endpoint is available for authenticated users

## Phase 2 - Participant Join Flow
Build:
- Participant model with event enrollment state (`currentQuestion`, `score`, `flags`)
- Participant join API with optional event password check
- Shared participants list API
- Coordinator kick API

Success criteria:
- Participant can join only scheduled events
- Duplicate joins are prevented
- Coordinators can list and kick participants

## Phase 3 - Problem System
Build:
- Problem model with ordered question progression (`orderIndex`)
- Coordinator API to add event questions
- Event details response includes current unlocked question for joined participants

Success criteria:
- Coordinator can attach ordered markdown questions to events
- Participant receives only currently unlocked question
- Correct answer stays backend-only and never leaks in API responses

## Phase 4 - Submission + Progression Lock
Build:
- Submission model to track answer attempts
- Participant submit API with backend answer validation
- Progression lock enforcement (`Q1 -> Q2 -> Q3 ...`)

Success criteria:
- Submissions accepted only when event is running
- Participant cannot skip ahead of current question
- Correct submission unlocks next question

## Phase 5 - Basic Scoring
Build:
- Time-based scoring on first correct solve
- Participant score updates and persistence

Success criteria:
- First correct solve awards points based on elapsed event time
- Score is updated in backend only

## Phase 6 - Leaderboard (Non-Realtime)
Build:
- Event leaderboard API sorted by score
- Include solved progress metadata for ranking visibility

Success criteria:
- Leaderboard endpoint returns deterministic ranking
- Output reflects current score/progression from database
- Foundation is ready for future realtime push updates
