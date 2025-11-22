# Project Structure

## Root Directory
*   **`src/`**: Application source code.
*   **`docs/`**: Documentation for AI and developers.

## Source Directory (`src/`)

### `components/`
*   **`ui/`**: **The Design System.** Contains atomic, reusable components like `Button.tsx`, `Input.tsx`, `Modal.tsx`, `LoadingSkeleton.tsx`. These have no business logic.
*   **`charts/`**: Reusable charting wrappers (Recharts based) like `ChartRenderer.tsx`, `RechartsLineChart.tsx`.
*   **`pages/`**: Top-level route components (e.g., `LoginPage.tsx`, `SettingsPage.tsx`).
*   **`modals/`**: App-wide complex modals (e.g., `CreateProjectModal.tsx`).

### `features/`
The core business domains. Each folder contains the main container and a `components/` subfolder for feature-specific UI.
*   **`dashboard/`**: Main analytics view.
    *   `DashboardWorkspace.tsx`: Main entry point.
    *   `components/`: `FilterBar`, `KpiGrid`, `ChartGrid`.
*   **`report-studio/`**: Presentation builder.
    *   `ReportStudio.tsx`: Main entry point.
    *   `components/`: `SlidePreview`, `ContentBlockRenderer`, `FlyoutPanel`.
*   **`data-studio/`**: Excel-like data transformation tool.
    *   `DataStudio.tsx`: Main entry point.
    *   `components/`: `DataTable`, `AppliedStepsPanel`.

### `hooks/`
Shared custom hooks for cross-cutting concerns.
*   `useGemini.ts`: AI integration.
*   `useProjects.ts`: State management & persistence.
*   `useDataProcessing.ts`: File parsing logic.
*   `useUI.ts`: UI state (sidebar toggles).

### `services/`
Pure functions and API integrations.
*   `geminiService.ts`: Direct calls to Google GenAI SDK.
*   `dataParser.ts`: SheetJS logic (runs in main thread if small).
*   `parser.worker.ts`: Web Worker for large file parsing.
*   `pptxEngine.ts`: PowerPoint generation logic using `pptxgenjs`.

### `types/`
TypeScript definitions.
*   `models.ts`: Core entities (Project, User).
*   `analysis.ts`: AI analysis shapes (KPIs, Charts).
*   `report.ts`: Presentation shapes (Slides, Blocks).
*   `transformations.ts`: Data Studio transformation types.
