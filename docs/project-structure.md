# Project Structure

## Root Directory
*   **`src/`**: Application source code.
*   **`docs/`**: Documentation for AI and developers.

## Source Directory (`src/`)

### `store/`
Global state management (Zustand).
*   `projectStore.ts`: Core data, persistence, undo/redo logic.
*   `uiStore.ts`: Modals, sidebar, and transient UI state.

### `lib/`
Static configuration and libraries.
*   `prompts.ts`: Centralized repository for all AI/LLM prompts.

### `utils/`
Pure utility functions.
*   `validation.ts`: Zod schemas for runtime data validation.
*   `sampling.ts`: LTTB algorithm for chart data optimization.

### `components/`
*   **`ui/`**: **The Design System.** Contains atomic, reusable components like `Button.tsx`, `Input.tsx`, `Modal.tsx`.
*   **`modals/`**:
    *   `ModalManager.tsx`: Central entry point for rendering active modals.
    *   `*Modal.tsx`: Individual modal implementations.
*   **`charts/`**: Reusable charting wrappers (Recharts based).

### `features/`
The core business domains.
*   **`dashboard/`**: Main analytics view.
*   **`report-studio/`**: Presentation builder.
*   **`data-studio/`**: Data transformation tool.

### `hooks/`
Shared custom hooks.
*   `useGemini.ts`: Manages AI loading states and progress simulation.
*   `useDataProcessing.ts`: Handles file uploads and Web Worker communication.

### `services/`
API integrations and business logic.
*   **`ai/`**: Specialized AI services (`analysisService`, `presentationService`, `queryService`).
*   `dataParser.ts`: SheetJS logic.
*   `parser.worker.ts`: Web Worker for large file parsing.
*   `pptxEngine.ts`: PowerPoint generation logic.

### `types/`
TypeScript definitions.
*   `models.ts`: Core entities (Project, User).
*   `analysis.ts`: AI analysis shapes.
*   `report.ts`: Presentation shapes.
*   `transformations.ts`: Data transformation types.
