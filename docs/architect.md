# Architecture Overview

## Core Philosophy
This application follows a **Feature-Based Architecture** (inspired by Feature-Sliced Design). We decouple complex business logic from UI rendering and enforce a strict unidirectional data flow.

## Key Concepts

### 1. Feature Slices
Logic is grouped by **domain** rather than by file type.
*   **`features/dashboard/`**: Analytics, KPI grids, Filtering.
*   **`features/report-studio/`**: Presentation builder, Drag-and-drop canvas.
*   **`features/data-studio/`**: Data transformation, Table views.

### 2. Container/View Pattern
*   **Containers (Pages/Workspaces)**: Responsible for fetching data, managing state, and orchestrating sub-components.
    *   *Example:* `DashboardWorkspace.tsx`, `ReportStudio.tsx`.
*   **Views (Components)**: Pure UI components that receive data via props and emit events via callbacks. They contain little to no side-effect logic.
    *   *Example:* `KpiGrid.tsx`, `FilterBar.tsx`.

### 3. Logic Extraction (Custom Hooks)
We avoid writing complex `useEffect` or state logic inside UI components.
*   **`hooks/useGemini.ts`**: Manages AI API calls, loading states, and progress simulation.
*   **`hooks/useProjects.ts`**: Manages CRUD operations and LocalStorage persistence.
*   **`hooks/useDataProcessing.ts`**: Handles file uploads and Web Worker communication.

### 4. Shared UI Library (`components/ui`)
Low-level "dumb" components (Atoms) that ensure visual consistency.
*   **Rule**: Never use raw HTML `<button>`, `<input>`, or `<select>`. Always import `Button`, `Input`, `Select`, `Modal` from `@/components/ui`.

## Data Flow

1.  **Input**: User uploads a CSV/Excel file.
2.  **Processing**: `services/dataParser.ts` (via Web Worker) parses, validates, and samples the data.
3.  **Storage**: `hooks/useProjects` creates a Project object and persists it to `localStorage`.
4.  **Analysis**: `services/geminiService.ts` sends the data sample to Google Gemini to generate a JSON configuration for Charts and KPIs.
5.  **Rendering**: The `DashboardWorkspace` container reads the Project state and passes data down to `ChartGrid`, `KpiGrid`, etc.
6.  **Reporting**: The `ReportStudio` feature allows users to remix these insights into slides, stored within the Project object.