# Coding Conventions & Rules

## UI & Styling Rules
1.  **Strict UI Library Usage**: Do **NOT** use raw HTML elements for interactions.
    *   ❌ `<button className="...">`
    *   ✅ `<Button variant="primary">` (Import from `components/ui`)
    *   ❌ `<input type="text">`
    *   ✅ `<Input ... />` (Import from `components/ui`)
    *   ❌ `<select>`
    *   ✅ `<Select ... />` (Import from `components/ui`)
2.  **Tailwind CSS**: Use standard Tailwind utility classes. Avoid arbitrary values (e.g., `w-[357px]`) unless absolutely necessary.
3.  **Icons**: Use `lucide-react` for all iconography.

## React Patterns
1.  **Hooks**: Logic that involves `useEffect`, `useState` for complex flows, or API calls must be extracted into a custom hook. Keep components focused on rendering.
2.  **Barrel Files**: Always import from the `index.ts` of a directory if it exists.
    *   *Example:* `import { Button } from '../components/ui';`
3.  **Functional Components**: Use `React.FC<Props>` or standard function declarations.
4.  **Prop Drilling**: Avoid passing props more than 2 levels deep. Use the specific Feature Context or Composition if needed.

## AI & Services
1.  **Gemini Integration**: All calls to `@google/genai` must be encapsulated in `services/geminiService.ts`. Components should not call the AI SDK directly.
2.  **Web Workers**: Heavy data processing (parsing files > 5MB) is offloaded to `services/parser.worker.ts`.
3.  **Error Handling**: AI services must fail gracefully and return readable error messages to the UI (e.g., "The AI model is currently overloaded").

## Type Safety
1.  **No `any`**: Avoid `any` whenever possible. Use defined types from `src/types/`.
2.  **Generics**: Use Generics for data grids and chart components to ensure type safety across different datasets.
