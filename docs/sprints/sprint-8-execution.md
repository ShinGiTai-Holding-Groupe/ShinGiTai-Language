# Sprint 8 Execution Log — Learning Experience

## Goal

Improve the actual learning experience after the dashboard foundation is in place.

Sprint 8 should make ShinGiTai Language feel more like a guided learning product inside lessons, practice, review, and speaking flows — without broad rewrites or premature backend complexity.

## Guardrails

- Work only in the ShinGiTai Language repository.
- Do not touch Forge, ShinGiTai OpenAI, Hub, or unrelated repositories.
- One coherent objective per implementation pass.
- Prefer UI and copy improvements before backend changes.
- Reuse existing routes, data, and components where possible.
- Avoid schema, auth, dependency, or routing changes unless the sprint item explicitly requires them.
- Keep the app buildable after every change.

## Current Sprint Order

### 8.1.1 — AI Teacher Entry UX

Status: Completed in implementation pass.

Scope:

- Improve the empty entry state for the AI Teacher area.
- Help users understand what the AI Teacher does before they start or select a lesson.
- Keep the change limited to the existing teacher index route.
- Avoid backend, schema, auth, dependency, and conversation-flow changes.

Implemented:

- Reworked `src/routes/_authenticated/teacher.index.tsx` into a stronger entry panel.
- Added a clear `AI Teacher` label and `Start a guided language lesson` headline.
- Added three compact benefit cards: structured lesson, active exercises, and voice support.
- Kept avatar selection available in the entry state.
- Updated the start hint from a generic lesson selector message to `Use New lesson to begin`.
- No Supabase query, server function, route destination, auth, dependency, schema, or cross-repository changes were made.

Acceptance:

- AI Teacher entry screen explains the lesson value before the user starts.
- Users can see what to expect from a lesson at a glance.
- Existing lesson creation, lesson selection, avatar picker, and conversation behavior remain unchanged.
- The change stays frontend-only and bounded to the entry experience.

Recommended local checks:

```bash
npm install
npm run lint
npm run build
```

### 8.1.2 — New Lesson Dialog Guidance

Status: Completed in implementation pass.

Scope:

- Improve the new lesson dialog so users know what language and level to choose.
- Keep the existing lesson creation flow, backend behavior, and routes unchanged.
- Add safe loading and empty-state handling for language selection.

Implemented:

- Updated `src/routes/_authenticated/teacher.tsx` only.
- Added a short guidance panel inside the `New lesson` dialog.
- Added level-specific helper copy for A1 through C2.
- Added a loading placeholder for languages while active languages are being fetched.
- Disabled the language selector and start button when active languages are still loading or unavailable.
- Added an explicit no-active-languages message instead of allowing a confusing empty selector.
- Kept `createConversation`, `listConversations`, `deleteConversation`, routing, schema, auth, dependencies, and Supabase tables unchanged.

Acceptance:

- Users get guidance before starting a lesson.
- Beginners are nudged toward A1 without hiding advanced levels.
- The dialog handles loading and missing-language states safely.
- Existing teacher lesson creation behavior remains intact.

Recommended local checks:

```bash
npm install
npm run lint
npm run build
```

### 8.1.3 — Teacher Lesson Session Header

Status: Completed in implementation pass.

Scope:

- Improve the active teacher lesson header so users understand the session context immediately.
- Keep the change limited to existing lesson session UI and existing conversation data.
- Avoid backend, schema, auth, route, dependency, and AI behavior changes.

Implemented:

- Updated `src/components/tutor-chat.tsx` only.
- Added safe header fallbacks for missing title, language code, and level.
- Added a `Guided lesson` badge for AI Teacher sessions.
- Added a lightweight lesson phase label based on existing message count and streaming state: ready, warm-up, in progress, or teacher responding.
- Added three compact session guidance chips: follow the teacher prompt, answer in short steps, and ask for examples anytime.
- Kept the existing avatar picker, voice toggle, message flow, chat transport, and conversation persistence unchanged.

Acceptance:

- Active AI Teacher sessions now show clearer context at the top of the lesson.
- Users can tell whether the lesson is ready, warming up, in progress, or waiting for the teacher response.
- Conversation practice mode remains compatible because the extra lesson guidance only appears in teacher mode.
- No backend, schema, auth, route, dependency, Forge, OpenAI, Hub, or unrelated repository changes were made.

Recommended local checks:

```bash
npm install
npm run lint
npm run build
```

### 8.1.4 — Teacher Empty Lesson Starter Prompt

Status: Completed in implementation pass.

Scope:

- Improve the AI Teacher empty state with concrete starter prompt examples.
- Keep the change limited to the existing teacher index route.
- Avoid backend, schema, auth, route, dependency, and AI behavior changes.

Implemented:

- Updated `src/routes/_authenticated/teacher.index.tsx` only.
- Added a `Starter prompts` panel below the AI Teacher benefit cards.
- Added three beginner-friendly prompt examples for phrases, grammar practice, and real-life conversation.
- Kept the existing `New lesson` creation flow and avatar picker unchanged.
- No Supabase query, server function, AI prompt, chat transport, auth, routing, dependency, schema, or cross-repository changes were made.

Acceptance:

- Empty AI Teacher state now gives users concrete ideas for what to do first.
- Users are less likely to freeze after opening the AI Teacher area.
- Existing lesson creation and active lesson behavior remain unchanged.
- The change stays frontend-only and bounded to the teacher entry screen.

Recommended local checks:

```bash
npm install
npm run lint
npm run build
```

### 8.1.5 — Teacher Lesson Starter Message Copy

Status: Completed in implementation pass.

Scope:

- Improve the first empty active-lesson message after a lesson has been created.
- Keep the change limited to existing chat UI copy and presentation.
- Avoid backend, schema, auth, route, dependency, and AI prompt changes.

Implemented:

- Updated `src/components/tutor-chat.tsx` only.
- Replaced the single-line AI Teacher empty message with a small guided starter panel.
- Added a dynamic starter message using the current lesson language code and level.
- Explained what the teacher will do next: short explanation, one small exercise, and corrections after the user answers.
- Kept conversation practice empty-state copy separate and unchanged.
- No AI system prompt, chat transport, server function, Supabase schema, auth, routing, dependency, Forge, OpenAI, Hub, or unrelated repository changes were made.

Acceptance:

- A newly created AI Teacher lesson now gives the user a clear first message to send.
- The user understands what will happen after sending the starter message.
- Conversation practice mode is not affected.
- The change remains UI/copy-only and bounded to the existing chat component.

Recommended local checks:

```bash
npm install
npm run lint
npm run build
```

### 8.1.6 — Teacher Input Placeholder and Microcopy

Status: Completed in implementation pass.

Scope:

- Improve the chat input placeholder and small helper text for AI Teacher lessons.
- Keep the change limited to the existing chat component.
- Avoid AI prompt, backend, schema, auth, route, dependency, and persistence changes.

Implemented:

- Updated `src/components/tutor-chat.tsx` only.
- Added dynamic AI Teacher input placeholders for empty lessons, warm-up messages, ongoing lessons, and teacher-response loading.
- Added short helper microcopy below the input in teacher mode.
- Kept conversation-practice placeholder behavior separate and unchanged.
- Kept message submission, chat transport, Supabase auth session usage, voice controls, avatar picker, routes, and persistence unchanged.

Acceptance:

- The input field now guides the learner based on the current lesson state.
- New users get a clearer nudge to paste the starter message or ask what to learn first.
- Early lesson users are nudged toward short answers instead of overthinking.
- Existing conversation mode remains unaffected.

Recommended local checks:

```bash
npm install
npm run lint
npm run build
```

### 8.1.7 — Teacher Response Error Recovery Copy

Status: Completed in implementation pass.

Scope:

- Improve the visible error state when an AI Teacher response fails.
- Keep the change limited to existing chat UI and copy.
- Avoid retry mechanics, backend changes, AI prompt changes, schema changes, auth changes, route changes, and dependency changes.

Implemented:

- Updated `src/components/tutor-chat.tsx` only.
- Added teacher-specific recovery copy for generic response failures.
- Added clearer handling copy for rate-limit style errors and AI-credit style errors.
- Replaced the one-line teacher error message with a small accessible `role="alert"` recovery panel.

Acceptance:

- AI Teacher users now understand what happened when a response fails.
- Users are told that their lesson is not cleared and can retry with the same answer.
- Rate-limit and credit-related failures have more specific guidance.
- Conversation mode remains unaffected by the richer teacher recovery panel.

Recommended local checks:

```bash
npm install
npm run lint
npm run build
```

### 8.1.8 — Teacher Voice Control Microcopy

Status: Completed in implementation pass.

Scope:

- Improve the voice-control copy around AI Teacher lessons.
- Keep the change limited to existing chat UI and existing voice behavior.
- Avoid speech engine changes, backend changes, AI prompt changes, schema changes, auth changes, route changes, and dependency changes.

Implemented:

- Updated `src/components/tutor-chat.tsx` only.
- Added `teacherVoiceHelper` to explain voice-off, voice-on, loading, and active speaking states.
- Added a small `aria-live="polite"` voice helper under the AI Teacher session chips.
- Added clearer `aria-label` and `title` copy to the voice toggle.
- Updated assistant-message action tooltip from generic `Listen` / `Stop` to teacher-specific listening copy.
- Kept `useSpeak`, auto-speak behavior, avatar picker, chat transport, persistence, routes, schema, auth, dependencies, and conversation mode behavior unchanged.

Acceptance:

- AI Teacher users understand what the voice toggle does.
- Users get a clearer status when voice is preparing or currently speaking.
- The listening action on teacher replies is easier to understand.
- The change remains frontend-only and bounded to chat UI microcopy.

Recommended local checks:

```bash
npm install
npm run lint
npm run build
```

### 8.1.9 — Teacher Lesson Completion Nudge

Status: Completed in separate run note.

Scope:

- Add a small completion-oriented nudge to help learners finish lessons with a recap, correction review, or next-step request.
- Keep the change limited to existing AI Teacher UI.
- Avoid backend, AI prompt, schema, auth, dependency, and routing changes.

Implemented:

- Added a `Finish strong` style nudge in the AI Teacher entry/completion flow.
- Added prompt ideas for recap, mistakes, and next step.
- Added separate documentation for the run because the main Sprint 8 log update was blocked in that pass.

Acceptance:

- Learners have a clearer way to close a lesson intentionally instead of drifting away.
- Existing lesson creation, chat transport, persistence, auth, routes, and conversation mode remain unchanged.

Recommended local checks:

```bash
npm install
npm run lint
npm run build
```

### 8.1.10 — Teacher Lesson Review Prompt Polish

Status: Prepared; code write blocked by connector safety check during this run.

Scope:

- Add a lightweight review prompt after a lesson has enough conversation context.
- Keep it UI/copy-only inside the existing AI Teacher chat component.
- Avoid backend, AI prompt, schema, auth, dependency, route, and persistence changes.

Prepared implementation notes:

- Intended file: `src/components/tutor-chat.tsx`.
- Add a `teacherReviewPrompt(languageLabel, level)` helper.
- Show a small `Ready for a lesson review?` nudge only in teacher mode after several messages and when the chat status is ready.
- Suggested prompt copy: `Review my LANGUAGE LEVEL lesson. Summarize what I did well, correct my biggest mistake, and give me one next step.`
- Also fix the empty voice helper paragraph so `{voiceHelper}` renders inside the existing `aria-live="polite"` line.

Blocked:

- The GitHub connector safety layer blocked the full-file code update for `src/components/tutor-chat.tsx`.
- No code commit was created for this item in this run.
- Repository scope was respected: only ShinGiTai Language documentation was updated.

Recommended local checks after the code patch is applied:

```bash
npm install
npm run lint
npm run build
```

## Latest Run Summary

Prepared `8.1.10 — Teacher Lesson Review Prompt Polish` and recorded the exact intended bounded implementation.

Changed files:

- `docs/sprints/sprint-8-execution.md`

Implementation status:

- Documentation updated.
- Code patch was attempted but blocked by the GitHub connector safety check.
- No Forge, OpenAI, Hub, backend, schema, auth, route, dependency, or unrelated repository changes were made.

Local validation still required after code changes are applied:

```bash
npm install
npm run lint
npm run build
```

## Next Action

Retry `8.1.10 — Teacher Lesson Review Prompt Polish` with a smaller code patch path or local/manual patch, then continue to the next Sprint 8 Learning Experience item.
