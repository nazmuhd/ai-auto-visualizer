# Coding Conventions & Rules

## UI & Styling Rules
1.  **Strict UI Library Usage**: Do **NOT** use raw HTML elements for interactions. Use `components/ui` atoms.
2.  **Tailwind CSS**: Use standard utility classes.
3.  **Icons**: Use `lucide-react`.

## State Management (New)
1.  **Global State**: Use `useAppStore` (Zustand) for state that needs to be accessed across features (e.g., Current Project, User Settings).
2.  **Local State**: Use `useState` for UI-only state (e.g., isModalOpen, activeTab).
3.  **Async State**: Use `TanStack Query` hooks (`useQuery`, `useMutation`) for remote data or expensive AI operations. Do not manually manage `isLoading` / `error` states for API calls if possible.

## Performance Patterns
1.  **Web Workers**: Any operation that iterates over the full dataset (Filtering, Sorting, Parsing) **must** happen in a Web Worker (`services/*.worker.ts`).
2.  **Memoization**: Use `React.memo` for grid components (Charts, KPIs) to prevent unnecessary re-renders when the parent layout changes.

## AI & Services
1.  **Prompt Building**: Use `PromptBuilder` for all LLM calls to ensure context limits are respected.
2.  **Caching**: AI calls should be wrapped in `useQuery` with `staleTime: Infinity` where appropriate (data analysis results don't change unless the data changes).
3.  **Error Boundaries**: Wrap feature widgets in `<ErrorBoundary>` so a single failure doesn't crash the app.

## Type Safety
1.  **Zod Validation**: Use Zod schemas in `dataParser.ts` to validate incoming user data structure at runtime.
2.  **No `any`**: Avoid `any`. Use defined types from `src/types/`.