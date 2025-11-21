
# Architecture Overview

## Core Philosophy
This application follows a **Feature-Based Architecture** (inspired by Feature-Sliced Design). We decouple complex business logic from UI rendering and enforce a strict unidirectional data flow.

## Key Concepts

### 1. Feature Slices
Logic is grouped by **domain** rather than by file type.
*   **`features/dashboard/`**: Analytics, KPI grids, Filtering.
*   **`features/report-studio/`**: Presentation builder, Drag-and-drop canvas.
*   **`features/data-studio/`**: Data transformation, Table views.

### 2. State Management (Zustand)
We use **Zustand** for global application state, specifically for Project management.
*   **`stores/useAppStore.ts`**: The single source of truth for the active project, project list, and UI state.
*   **Temporal State (Undo/Redo)**: We use `zundo` middleware to track state changes in the active project, enabling "Time Travel" for user actions.

### 3. Data Engine & Persistence
*   **Hybrid Storage**:
    *   **LocalStorage**: Stores lightweight Project Metadata (ID, Name, Last Modified) for fast listing.
    *   **IndexedDB (Dexie.js)**: Stores heavy dataset blobs (Parsed CSV rows). This avoids the 5MB LocalStorage limit and prevents UI blocking during save/load.
*   **Web Workers**: Heavy computational tasks are offloaded to background threads to keep the main thread responsive (60fps).
    *   `parser.worker.ts`: Parsing Excel/CSV files.
    *   `calculator.worker.ts`: Sorting, filtering, aggregating, and **secure formula evaluation**.

### 4. AI & Caching (TanStack Query)
*   **Caching**: AI responses (Analysis, Presentation Generation) are cached using **TanStack Query**. If a user requests the same analysis for the same data snapshot, it returns instantly without costing tokens.
*   **Prompt Engineering**: A `PromptBuilder` class constructs prompts and manages token budgets, intelligently truncating data contexts to fit within model limits.

### 5. Component Architecture
*   **Error Boundaries**: Granular error boundaries wrap widgets. If one chart fails, the rest of the dashboard remains functional.
*   **Factories**: We use the Factory Pattern (e.g., `ChartFactory`) to decouple the decision logic of *what* to render from the implementation details of *how* to render it.

### 6. Security Architecture
*   **Client-Side Processing**: All file parsing and data transformation happen locally in the browser via Web Workers. Raw data is never uploaded to a server, preserving user privacy.
*   **Secure Formula Engine**: The application uses a custom **Reverse Polish Notation (RPN)** tokenizer and parser (in `calculator.worker.ts`) to evaluate user-defined formulas.
    *   **No `eval()`**: We strictly prohibit the use of `eval()` or `new Function()` for expression evaluation.
    *   **Attack Vector Mitigation**: This architecture eliminates Arbitrary Code Execution (ACE) vulnerabilities that could arise from malicious CSV headers or shared project files containing executable JavaScript code.

## Data Flow

1.  **Input**: User uploads a CSV/Excel file.
2.  **Processing**: `parser.worker.ts` parses and validates the file off-main-thread.
3.  **Storage**: `StorageAdapter` saves the raw data to IndexedDB and metadata to LocalStorage.
4.  **State Update**: `useAppStore` updates to reflect the new active project.
5.  **Analysis**: `useGemini` (via TanStack Query) checks the cache or calls Google Gemini to generate insights.
6.  **Rendering**: `DashboardWorkspace` subscribes to the store and passes data to `ChartRenderer` (wrapped in `ErrorBoundary`).
7.  **Transformation**: User actions in Data Studio trigger `calculator.worker.ts` to compute a new dataset view via the safe RPN engine without freezing the UI.
