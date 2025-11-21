
# Project Structure

## Root Directory
*   **`src/`**: Application source code.
*   **`docs/`**: Documentation for AI and developers.

## Source Directory (`src/`)

### `stores/`
*   **`useAppStore.ts`**: Global Zustand store with Zundo middleware.

### `db/`
*   **`db.ts`**: Dexie.js database configuration for IndexedDB.

### `components/`
*   **`ui/`**: **The Design System.** Contains atomic, reusable components like `Button.tsx`, `Input.tsx`, `Modal.tsx`, `Popover.tsx`, `ErrorBoundary.tsx`.
*   **`charts/`**: Recharts wrappers.
    *   `ChartFactory.tsx`: Switching logic for chart types.
    *   `ChartRenderer.tsx`: Container for charts with toolbar controls.
*   **`pages/`**: Top-level route components.

### `features/`
The core business domains.
*   **`dashboard/`**: Main analytics view.
*   **`report-studio/`**: Presentation builder.
*   **`data-studio/`**: Excel-like data transformation tool.

### `hooks/`
Shared custom hooks.
*   `useGemini.ts`: AI integration with TanStack Query wrappers.
*   `useProjects.ts`: Facade hook for the Zustand store (legacy compatibility).
*   `useDataProcessing.ts`: File parsing logic.

### `lib/`
Utility libraries and configurations.
*   `query-client.ts`: TanStack Query client configuration.
*   `prompt-builder.ts`: Helper class for constructing safe AI prompts.

### `services/`
Pure functions and API integrations.
*   **`ai/`**: Granular AI services.
    *   `client.ts`: Gemini client instance.
    *   `analysisService.ts`: Dashboard analysis logic.
    *   `presentationService.ts`: Report generation logic.
    *   `queryService.ts`: Natural language data querying.
*   `storageAdapter.ts`: Abstraction layer for Hybrid Storage (LocalStorage + IndexedDB).
*   `dataParser.ts`: Main thread parsing logic.
*   `parser.worker.ts`: Web Worker for file parsing.
*   `calculator.worker.ts`: Web Worker for data transformation (Filter, Sort, Group By) and **secure formula evaluation (RPN)**.
*   `pptxEngine.ts`: PowerPoint generation logic.

### `types/`
TypeScript definitions.
*   `models.ts`: Core entities (Project, ProjectMetadata).
*   `analysis.ts`: AI analysis shapes.
*   `report.ts`: Presentation shapes.
*   `transformations.ts`: Data transformation types.
