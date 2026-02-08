# Localization Plan: Chinese (Simplified)

## TL;DR

> **Quick Summary**: Localize all user-facing text in the main app flow to Simplified Chinese (zh-CN).
>
> **Deliverables**:
> - Fully localized `app/page.tsx` (Landing)
> - Fully localized `app/reading/page.tsx` (Reading Flow)
> - Fully localized `components/Interpretation.tsx` (Results)
> - Fully localized `components/SpreadSelector.tsx` (Selection)
> - Refined localization for `components/TarotCard.tsx` and `ApiSettings.tsx`
>
> **Estimated Effort**: Short (Text replacement only)
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Landing → Reading Flow → Components

---

## Context

### Original Request
Localize the Tarot app to Chinese (Simplified) with a mystical tone for content and standard tone for functional elements.

### Interview Summary
**Key Decisions**:
- **Tone Strategy**: Hybrid
  - **Content/Headings**: Mystical, Elegant ("Oracle" → "神谕", "Sanctuary" → "圣殿")
  - **Functional Elements**: Standard, Clear ("Start" → "开始", "Settings" → "设置")
- **Data Source**: Use `nameCn` from `lib/tarot` data files where available.
- **Method**: Direct text replacement in TSX (no i18n library overhead).

### Metis Review (Self-Correction)
**Identified Gaps**:
- `ApiSettings.tsx` and `TarotCard.tsx` were already partially localized. The plan must explicitly check and standardize them to match the agreed tone (e.g., ensure "API Key" vs "API密钥" consistency).
- `app/layout.tsx` metadata (title/description) should also be updated.

---

## Work Objectives

### Core Objective
Transform the English interface into a native-feeling Chinese experience that balances mystical immersion with functional clarity.

### Concrete Deliverables
- [ ] `app/page.tsx` in Chinese
- [ ] `app/reading/page.tsx` in Chinese
- [ ] `components/Interpretation.tsx` in Chinese
- [ ] `components/SpreadSelector.tsx` in Chinese
- [ ] `components/TarotCard.tsx` refined
- [ ] `components/ApiSettings.tsx` refined

### Definition of Done
- [ ] All visible text is in Chinese
- [ ] No layout breakages due to text length changes
- [ ] Tooltips and titles are localized

### Must Have
- "Mystical" tone for: Headings, flavor text, descriptions.
- "Standard" tone for: Buttons, error messages, settings labels.

### Must NOT Have (Guardrails)
- Do not change the `id`s or logic of components.
- Do not translate variable names or internal keys.

---

## Verification Strategy

> **Verification**: Manual UI Inspection (Agent-Executable)
> Since these are visual text changes, automated tests are less effective than visual verification.

**Automated Verification (Agent)**:
- Use `grep` to ensure no English placeholder text remains in target files.
- Use `playwright` (if available) or `read` to verify file content updates.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Components):
├── Task 1: Refine `ApiSettings.tsx` & `TarotCard.tsx`
├── Task 2: Localize `SpreadSelector.tsx`
└── Task 3: Localize `Interpretation.tsx`

Wave 2 (Pages - depends on components):
├── Task 4: Localize `app/page.tsx` (Landing)
└── Task 5: Localize `app/reading/page.tsx` (Reading Flow)
```

---

## TODOs

- [ ] 1. Localize Components Group A (Settings & Cards)

  **What to do**:
  - `components/ApiSettings.tsx`: Ensure all labels are Chinese.
    - "API Settings" -> "API 设置"
    - "Cancel" -> "取消", "Save" -> "保存"
  - `components/TarotCard.tsx`:
    - Verify "Reversed" -> "逆位" (Already done, check consistency)
    - Verify "Upright" -> "正位"

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `frontend-ui-ux`

  **References**:
  - `components/ApiSettings.tsx`
  - `components/TarotCard.tsx`

- [ ] 2. Localize SpreadSelector

  **What to do**:
  - `components/SpreadSelector.tsx`:
    - "Choose Your Spread" -> "选择牌阵"
    - "Cards" badge -> "张牌"
    - Ensure `spread.nameCn` is used for titles.
    - "Description" logic is dynamic, ensure fallback text is localized if any.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `frontend-ui-ux`

  **References**:
  - `components/SpreadSelector.tsx`

- [ ] 3. Localize Interpretation Component

  **What to do**:
  - `components/Interpretation.tsx`:
    - "The Connection was Severed" -> "连接已断开" (Standard tone for error)
    - "The Oracle Speaks" -> "神谕降临" (Mystical tone)
    - "Divining the Stars..." -> "正在以此星辰占卜..."
    - "Awaiting the cards..." -> "等待翻牌..."

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `frontend-ui-ux`

  **References**:
  - `components/Interpretation.tsx`

- [ ] 4. Localize Landing Page

  **What to do**:
  - `app/page.tsx`:
    - "Mystic Tarot" -> "神秘塔罗"
    - "Unveil the secrets..." -> "揭开宇宙的奥秘..."
    - "Start Divination" -> "开始占卜" (Standard button)
    - "Setup API key..." -> "设置 API 密钥以启用 AI 解读"
    - Feature grid titles and descriptions to Chinese.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-ui-ux`

  **References**:
  - `app/page.tsx`

- [ ] 5. Localize Reading Page

  **What to do**:
  - `app/reading/page.tsx`:
    - Header: "Sanctuary" -> "圣殿", "Leave Sanctuary" -> "离开圣殿"
    - Steps: "Inquiry"->"提问", "Spread"->"牌阵", "Shuffle"->"洗牌", "Reveal"->"揭示", "Insight"->"解读"
    - Phase "Question": "What do you seek?" -> "你所求为何？", "Focus on your question..." -> "专注于你的问题，让它在心中显现。"
    - Phase "Shuffle": "Channel Your Energy" -> "注入意念"
    - Phase "Draw": "The Cards Await" -> "牌灵已至"
    - Buttons: "Reveal All" -> "全部翻开", "Restart" -> "重新开始", "Consult the Oracle" -> "请求解读"

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-ui-ux`

  **References**:
  - `app/reading/page.tsx`

---

## Success Criteria

### Verification Commands
```bash
# Check for remaining English in key areas
grep -r "Start Divination" app/
grep -r "The Oracle Speaks" components/
```

### Final Checklist
- [ ] `app/page.tsx` is fully Chinese
- [ ] `app/reading/page.tsx` is fully Chinese
- [ ] No visual regressions in layout
