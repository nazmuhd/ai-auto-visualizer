# Coding Conventions & Rules

## State Management
1.  **Global State**: Use **Zustand** for shared state (`src/store`). Do not create complex Context providers unless absolutely necessary.
2.  **Immutability**: Always use **Immer** (via middleware) when updating complex state objects in the store.
    *   *Example*: `set(state => { state.projects[0].name = 'New Name' })` instead of spread operators.
3.  **Selectors**: Components should select only the specific slice of state they need to prevent unnecessary re-renders.

## UI & Styling Rules
1.  **Strict UI Library Usage**: Do **NOT** use raw HTML elements for interactions.
    *   ✅ `<Button variant="primary">` (Import from `components/ui`)
2.  **Tailwind CSS**: Use standard Tailwind utility classes. Avoid arbitrary values (e.g., `w-[357px]`).
3.  **Modals**: Do not render Modals directly in components. Use `useUIStore.getState().openModal(...)`.

## AI & Services
1.  **Service Isolation**: Components must **never** import `@google/genai` directly. They must use `services/ai/*.ts` or `hooks/useGemini`.
2.  **Prompt Engineering**: Do **NOT** write prompt strings inside service files. All prompts must be stored in `src/lib/prompts.ts` and imported.
3.  **Data Validation**: All JSON responses from AI must be parsed and validated using **Zod** schemas defined in `src/utils/validation.ts` before being used in the app.
4.  **Web Workers**: File parsing > 5MB must be offloaded to `services/parser.worker.ts`.

## Performance
1.  **Large Lists**: Use `react-window` for rendering lists or tables with more than 100 items.
2.  **Charts**: Use the `lttb` utility to downsample chart data if the dataset exceeds 500 points.

## Type Safety
1.  **No `any`**: Avoid `any`. Use defined types from `src/types/`.
2.  **Generics**: Use Generics for data grids and chart components.
