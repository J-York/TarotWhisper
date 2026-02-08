# History Feature Implementation Plan

## Context

### Original Request
The user wants to add a full history feature to the Tarot app:
1. Save readings to localStorage
2. View history list (`/history`)
3. View reading details
4. Batch delete functionality
5. "Mystical Glassmorphism" UI style

### Metis Review Summary
**Identified Gaps**:
- **Quota Management**: No limit defined. *Decision: Cap at 50 readings.*
- **Storage Strategy**: Date object serialization issues. *Decision: Use ISO strings, deserialize on load.*
- **Save Trigger**: When to save? *Decision: Auto-save on successful interpretation completion.*
- **Error Handling**: Private browsing/quota issues. *Decision: Silent fail or user feedback, no crash.*

**Scope Boundaries**:
- **IN**: `/history` list, `/history/[id]` details, batch delete, auto-save.
- **OUT**: Sync/Cloud, Search, Export, Edit, Favorites.

## Task Dependency Graph

| Task | Depends On | Reason |
|------|------------|--------|
| **Task 1: Storage Lib** | None | Foundation for all data persistence |
| **Task 2: Hook Integration** | Task 1 | Needs storage methods to save readings |
| **Task 3: History List UI** | Task 1 | Needs `getReadings` to display data |
| **Task 4: Details UI** | Task 3 | Linked from list items; needs `getReadingById` |
| **Task 5: Batch Delete** | Task 3 | Operates on the list selection state |
| **Task 6: Navigation** | Task 3 | Links to the new page |

## Parallel Execution Graph

**Wave 1 (Foundation):**
├── Task 1: Create `lib/storage.ts` (Storage Utility)
└── Task 6: Add Navigation Links (can be done early, link will 404 until page exists)

**Wave 2 (Integration & UI):**
├── Task 2: Integrate `useReading` with Storage (Auto-save)
└── Task 3: Create `/history/page.tsx` (List View)

**Wave 3 (Advanced Features):**
├── Task 4: Create `/history/[id]/page.tsx` (Detail View)
└── Task 5: Implement Batch Delete Logic (in History Page)

**Critical Path**: Task 1 → Task 3 → Task 4

## Tasks

### Task 1: Create Storage Utility (`lib/storage.ts`)

**Description**:
Implement a type-safe wrapper for `localStorage` to manage `Reading` objects.
- Key: `mystic-tarot-readings-v1`
- Max items: 50 (FIFO eviction)
- Handle Date serialization (JSON stringify/parse)
- Methods: `saveReading`, `getReadings`, `getReadingById`, `deleteReadings`, `clearAll`

**Delegation Recommendation**:
- Category: `typescript-programmer` - Pure logic, type safety critical.
- Skills: [`typescript-programmer`] - Strong typing needed.

**Skills Evaluation**:
- INCLUDED `typescript-programmer`: Core requirement.
- OMITTED `frontend-ui-ux`: No UI work here.

**Depends On**: None

**Acceptance Criteria**:
- [ ] `saveReading` adds item to beginning of list
- [ ] FIFO eviction works when > 50 items
- [ ] `getReadings` returns array with correct `Date` objects
- [ ] `deleteReadings` removes specified IDs
- [ ] Handles `quotaExceededError` gracefully
- [ ] Handles SSR (window check)

### Task 2: Integrate Auto-Save in `useReading`

**Description**:
Modify `hooks/useReading.ts` to automatically save the reading when interpretation completes.
- In `startInterpretation` stream completion: call `storage.saveReading`
- Ensure complete reading object (Question, Spread, Cards, Interpretation) is saved
- Add `id` generation (UUID or timestamp) to `Reading` type if missing

**Delegation Recommendation**:
- Category: `typescript-programmer` - Logic modification.
- Skills: [`typescript-programmer`] - Hook state management.

**Skills Evaluation**:
- INCLUDED `typescript-programmer`: React hook logic.

**Depends On**: Task 1

**Acceptance Criteria**:
- [ ] Reading saved to localStorage after AI stream finishes
- [ ] Unique ID assigned to each reading
- [ ] No duplicate saves if user re-interprets (update existing? or new? -> *Decision: New entry*)

### Task 3: Create History List Page (`app/history/page.tsx`)

**Description**:
Implement the history listing page with "Mystical Glassmorphism" style.
- Layout: Grid of cards (like `SpreadSelector`)
- Item content: Date, Question snippet, Spread name, keywords
- Selection mode: Checkboxes for batch delete
- Empty state: "The void is empty..." message

**Delegation Recommendation**:
- Category: `visual-engineering` - UI heavy, needs to match existing style.
- Skills: [`frontend-ui-ux`, `typescript-programmer`] - Styling and logic.

**Skills Evaluation**:
- INCLUDED `frontend-ui-ux`: Essential for "Mystical" vibe.
- INCLUDED `typescript-programmer`: React component logic.

**Depends On**: Task 1

**Acceptance Criteria**:
- [ ] Displays list of readings from localStorage
- [ ] Formatted dates (e.g., "YYYY/MM/DD HH:mm")
- [ ] "Select" button toggles selection mode
- [ ] Empty state displayed when no history
- [ ] Responsive grid layout

### Task 4: Create Reading Detail Page (`app/history/[id]/page.tsx`)

**Description**:
View full details of a past reading.
- Reuse `Interpretation` component for content
- Reuse `TarotCardComponent` for drawn cards (mini view)
- Display Question and Spread info clearly
- Back button to `/history`

**Delegation Recommendation**:
- Category: `visual-engineering` - Reusing UI components.
- Skills: [`frontend-ui-ux`, `typescript-programmer`] - Component composition.

**Skills Evaluation**:
- INCLUDED `frontend-ui-ux`: Visual consistency.

**Depends On**: Task 3 (Route structure)

**Acceptance Criteria**:
- [ ] URL `/history/[id]` loads correct reading
- [ ] 404/Redirect if ID not found
- [ ] Displays all reading data (Question, Cards, AI Text)
- [ ] "Back to History" navigation works

### Task 5: Implement Batch Delete Functionality

**Description**:
Add interaction logic to `app/history/page.tsx` for deleting items.
- "Select" button -> Show checkboxes
- Select items -> "Delete (N)" button appears
- "Delete All" button
- Confirmation modal (browser native or custom)

**Delegation Recommendation**:
- Category: `visual-engineering` - Interactive UI state.
- Skills: [`frontend-ui-ux`, `typescript-programmer`] - State management + UI.

**Skills Evaluation**:
- INCLUDED `frontend-ui-ux`: Interaction design.

**Depends On**: Task 3

**Acceptance Criteria**:
- [ ] Multi-select works
- [ ] Delete removes items from UI and localStorage
- [ ] "Delete All" clears everything
- [ ] Confirmation step exists (prevent accidental delete)

### Task 6: Add Navigation Links

**Description**:
Add "History" access points in:
- `app/page.tsx` (Home): Main menu button
- `app/reading/page.tsx` (Navbar): Icon or menu item
- `app/layout.tsx` (if global nav exists - check first)

**Delegation Recommendation**:
- Category: `quick` - Simple UI additions.
- Skills: [`frontend-ui-ux`] - placement and styling.

**Skills Evaluation**:
- INCLUDED `frontend-ui-ux`: Integration with existing design.

**Depends On**: Task 3 (needs target route)

**Acceptance Criteria**:
- [ ] "History" button visible on Home
- [ ] Navigation works correctly
- [ ] Styling matches context (glass button, etc.)

## Commit Strategy

- **feat(storage):** Add storage utility (Task 1)
- **feat(history):** Add history hooks and basic list page (Tasks 2 & 3)
- **feat(details):** Add detail view and navigation (Tasks 4 & 6)
- **feat(cleanup):** Add batch delete and polish (Task 5)

## Success Criteria

1. **Persistence**: Readings persist after page reload.
2. **Quota**: Oldest readings removed when > 50.
3. **UI Consistency**: History pages look like part of the "Sanctuary".
4. **Usability**: Clear delete flow, easy navigation back/forth.
5. **Robustness**: No crashes on empty storage or invalid JSON.
