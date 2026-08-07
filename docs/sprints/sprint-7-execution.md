# Sprint 7 Execution Log — Productivity Foundation

## Goal

Make ShinGiTai Language feel more like a guided learning product after login, not just a collection of disconnected language-learning features.

Sprint 7 is intentionally split into small, safe changes so the repository stays stable and every change can be reviewed, tested, and reverted independently.

## Current Sprint Order

### 7.2.1 — Rebranding Foundation

Status: Completed in first implementation pass.

Scope:

- Replace visible `LinguaVerse` branding with `ShinGiTai Language` in small batches.
- Start with safe identity surfaces: metadata, header/logo text, footer, and hero copy.
- Avoid changing auth, routing, Supabase, or dependencies.

Implemented:

- Updated landing-page metadata title and Open Graph title.
- Updated primary logo text from `LinguaVerse` to `ShinGiTai Language`.
- Updated hero copy, language-section copy, image alt text, final CTA, and footer copyright.
- Kept routing, auth, Supabase, pricing structure, dependencies, and feature layout unchanged.

Acceptance:

- Landing page no longer exposes old brand in primary UI copy.
- Build should still pass with no functional behavior changes.

Recommended local checks:

```bash
npm install
npm run lint
npm run build
```

### 7.2.2 — Continue Learning Card

Status: Completed in implementation pass.

Scope:

- Add a dashboard card that tells the user what to continue next.
- Use static/demo data first if user progress data is not ready.
- Keep it UI-only unless existing progress data is already available.

Implemented:

- Added reusable `ContinueLearningCard` component in `src/components/dashboard/continue-learning-card.tsx`.
- Component supports loading state, empty state, active course state, and a recommended next-step CTA.
- Wired the component into `src/routes/_authenticated/dashboard.tsx`.
- Reused the newest active course from the existing `courses` query instead of adding backend work.
- Updated the remaining dashboard header brand string from `LinguaVerse` to `ShinGiTai Language`.
- No backend, schema, auth, routing, or dependency changes were made.

Acceptance:

- User can instantly see the next recommended learning action.
- No backend or schema migration required.
- Dashboard keeps working for loading, empty-course, and active-course states.

Recommended local checks:

```bash
npm install
npm run lint
npm run build
```

### 7.2.3 — Today's Focus

Status: Completed in implementation pass.

Scope:

- Add a focused daily learning block.
- Include a compact plan such as lesson, flashcards, and speaking practice.
- Keep the first version deterministic and stable.

Implemented:

- Added reusable `TodaysFocusCard` component in `src/components/dashboard/todays-focus-card.tsx`.
- Added a deterministic three-step daily stack: core lesson, flashcard review, and speaking practice.
- Wired the card into the dashboard directly below `ContinueLearningCard`.
- Reused existing dashboard data: active course, daily goal minutes, current streak, and course loading state.
- Added empty-course CTA toward onboarding without backend or schema changes.

Acceptance:

- Dashboard answers: "What should I do today?"
- User sees one clear daily practice stack instead of only a feature launcher.
- No backend, schema, auth, routing, or dependency changes were made.

Recommended local checks:

```bash
npm install
npm run lint
npm run build
```

### 7.2.4 — Practice Stack

Status: Completed in implementation pass.

Scope:

- Rework scattered quick actions into an ordered practice stack.
- Prioritize learning flow: lesson → flashcards → speaking → review.
- Keep routes and backend behavior unchanged.

Implemented:

- Replaced the generic `QUICK_ACTIONS` launcher with `PRACTICE_STACK` and `SUPPORT_ACTIONS` groups.
- Main dashboard action order is now: Learn → Review → Speak → Test.
- Secondary actions are still available as support tools: Grammar, Exams, Leaderboard, Achievements, and Go Pro.
- Updated dashboard section copy from `Jump back in` to `Practice Stack` with a short learning-loop explanation.
- No routes, auth, Supabase queries, schema, dependency, or cross-repository changes were made.

Acceptance:

- Dashboard feels more like a guided system than a launcher.
- User sees the recommended order before optional support tools.
- Existing navigation destinations remain intact.

Recommended local checks:

```bash
npm install
npm run lint
npm run build
```

### 7.2.5 — UX Cleanup

Status: Completed in implementation pass.

Scope:

- Small spacing, CTA, label, and hierarchy improvements.
- No broad component rewrites.

Implemented:

- Tightened dashboard spacing on mobile and desktop with smaller top padding and responsive section spacing.
- Improved header behavior on narrow screens by preventing the brand and action icons from crowding each other.
- Added a small `Today’s mission` label to make the hero panel easier to scan.
- Improved hero copy so it points users toward the focused practice flow instead of generic streak copy.
- Improved level-progress layout on small screens with stacked text before horizontal layout on larger screens.
- Changed primary practice card CTA text from `Start` to `Continue` for better learning-product tone.
- Added visible keyboard focus rings to practice cards, support tools, and add-language buttons.
- Added helper copy under `Support tools` to clarify that those features are secondary.
- No database, auth, route, dependency, schema, or cross-repository changes were made.

Acceptance:

- Dashboard is cleaner and easier to scan.
- Primary learning path remains visually dominant.
- Secondary tools are still accessible but lower in hierarchy.
- Keyboard users get clearer focus states.

Recommended local checks:

```bash
npm install
npm run lint
npm run build
```

### 7.3.1 — Next Step Recommendation

Status: Completed in implementation pass.

Scope:

- Make the dashboard recommendation slightly smarter using existing data only.
- Avoid database changes, new queries, auth changes, route rewrites, and dependency changes.
- Keep the first recommendation logic deterministic and easy to replace later.

Implemented:

- Added `getNextStepRecommendation` inside `src/components/dashboard/continue-learning-card.tsx`.
- Recommendation now considers whether the user has an active course, course XP, current streak, and daily goal minutes.
- Recommendation states currently route to existing destinations only: onboarding, AI Teacher, flashcards, and tutor conversation.
- Wired `currentStreak` and `dailyGoalMinutes` from the dashboard into `ContinueLearningCard`.
- Reused existing dashboard data instead of adding backend, schema, or Supabase query changes.

Acceptance:

- User sees a more contextual next step instead of one static recommendation.
- New users are guided to choose a language.
- Very early learners are guided to AI Teacher.
- Low-streak or short-goal sessions are guided to flashcards.
- Users with enough base progress are guided toward speaking practice.

Recommended local checks:

```bash
npm install
npm run lint
npm run build
```

### 7.3.2 — Recommendation Copy and Empty States

Status: Completed in implementation pass.

Scope:

- Improve recommendation wording so the user understands why a step is recommended.
- Improve empty-state copy for users without an active language course.
- Keep the work UI-only and reuse existing dashboard data.

Implemented:

- Added a `reason` field to dashboard next-step recommendations.
- Added visible recommendation reasons such as `No active course yet`, `Early course progress`, `No active streak yet`, and `Ready for active practice`.
- Split streak recovery and short-session flashcard recommendations into clearer copy states.
- Improved the no-course copy in `ContinueLearningCard` so setup feels like the first guided step rather than a dead end.
- Added separate empty-state focus steps in `TodaysFocusCard`: choose language, set rhythm, unlock practice flow.
- Kept existing routes, queries, auth, schema, dependencies, and backend behavior unchanged.

Acceptance:

- Recommendation card explains both the next action and the reason behind it.
- Empty dashboard state gives the user a clear setup path.
- Active-course daily focus behavior remains unchanged except for safer copy structure.
- No backend, schema, auth, route, dependency, or cross-repository changes were made.

Recommended local checks:

```bash
npm install
npm run lint
npm run build
```

### 7.3.3 — Recommendation Visual Hierarchy

Status: Completed in implementation pass.

Scope:

- Make the recommendation card easier to scan without changing backend behavior.
- Add visual priority treatment for the recommended next step.
- Keep the implementation bounded to existing dashboard recommendation UI.

Implemented:

- Added a typed `RecommendationPriority` model for `ready`, `recommended`, and `quick-win` states.
- Added priority badges: `Ready now`, `Recommended`, and `Quick win`.
- Moved the recommendation reason into a clearer `Why this?` panel.
- Increased recommendation title prominence and upgraded the CTA to a larger button with a subtle hover lift.
- Kept existing recommendation routes and data inputs unchanged.

Acceptance:

- User can identify the priority of the next step at a glance.
- Recommendation reasoning is visible without overloading the card header.
- CTA is visually stronger while staying within the existing design system.
- No backend, schema, auth, route, dependency, or cross-repository changes were made.

Recommended local checks:

```bash
npm install
npm run lint
npm run build
```

### 7.3.4 — Recommendation Edge Cases and Safe Defaults

Status: Completed in implementation pass.

Scope:

- Harden recommendation behavior for incomplete or unexpected dashboard data.
- Keep the recommendation deterministic and frontend-only.
- Avoid new backend queries, route changes, schema changes, dependency changes, and broad UI rewrites.

Implemented:

- Added safe number helpers for positive and non-negative recommendation inputs.
- Added safe text fallback handling for course language name, flag, and level.
- Added constants for default daily goal minutes and minimum base XP threshold.
- Clamped invalid, missing, negative, or non-finite XP/streak/goal values before recommendation branching.
- Reused sanitized XP in the course summary copy so the card does not display invalid progress values.
- Kept existing destinations unchanged: onboarding, AI Teacher, flashcards, and tutor conversation.

Acceptance:

- Missing or malformed course XP no longer breaks recommendation decisions.
- Invalid daily goal values fall back to a safe 15-minute default.
- Missing course language, flag, or level falls back to safe visible copy.
- Recommendation card remains stable for loading, empty-course, early-course, no-streak, short-goal, and ready states.
- No backend, schema, auth, route, dependency, or cross-repository changes were made.

Recommended local checks:

```bash
npm install
npm run lint
npm run build
```

### 7.3.5 — Recommendation Completion Pass

Status: Completed in implementation pass.

Scope:

- Finish the first dashboard recommendation iteration with a safer loading experience.
- Prevent temporary loading data from looking like a real empty-course recommendation.
- Keep the work limited to the existing recommendation card and existing dashboard data.

Implemented:

- Added a dedicated `RecommendationLoadingState` to `ContinueLearningCard`.
- Replaced the recommendation panel with neutral skeleton UI while course data is still loading.
- Added `aria-busy` to the loading recommendation panel.
- Replaced paragraph loading copy with a skeleton line instead of rendering empty-state text too early.
- Kept all recommendation destinations, backend queries, auth, routes, schema, and dependencies unchanged.

Acceptance:

- The dashboard no longer briefly shows `Choose language` while course data is still loading.
- Loading, active-course, and empty-course states are visually distinct.
- The first recommendation system is now stable enough to move from Sprint 7 productivity work into Sprint 8 learning-experience work.
- No backend, schema, auth, route, dependency, or cross-repository changes were made.

Recommended local checks:

```bash
npm install
npm run lint
npm run build
```

## Guardrails

- One coherent objective per commit.
- No Forge, OpenAI, Hub, or unrelated repository changes.
- No large rewrites without a clear reason.
- Prefer demo/static data before backend complexity.
- Keep the app buildable after each change.

## Latest Run Summary

Finished `7.3.5 — Recommendation Completion Pass` as a bounded dashboard loading-state polish update.

Changed files:

- `src/components/dashboard/continue-learning-card.tsx`
- `docs/sprints/sprint-7-execution.md`

Implementation notes:

- The recommendation card now shows a neutral skeleton recommendation panel while course data loads instead of temporarily rendering the no-course recommendation.
- This closes the first recommendation pass without adding backend work, schema changes, routes, dependencies, or cross-repository changes.
- Sprint 7 productivity foundation is now ready to hand off into Sprint 8 learning-experience work after local validation.

Local validation still required because this run only used the GitHub connector:

```bash
npm install
npm run lint
npm run build
```

## Next Action

Start Sprint `8.1 — Learning Experience Foundation` with `8.1.1 — AI Teacher Entry UX` using existing routes and data only.
