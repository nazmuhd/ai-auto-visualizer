# Architecture Overview

## Core Philosophy
This application follows a **Feature-Based Architecture** (inspired by Feature-Sliced Design). We decouple complex business logic from UI rendering and enforce a strict unidirectional data flow via a Global Store.

## Key Concepts

### 1. Feature Slices
Logic is grouped by **domain** rather than by file type.
*   **`features/dashboard/`**: Analytics, KPI grids, Filtering.
*   **`features/report-studio/`**: Presentation builder, Drag-and-drop canvas.
*   **`features/data-studio/`**: Data transformation, Virtualized tables.

### 2. Global State Management (Zustand)
Instead of prop-drilling or scattered Context providers, we use **Zustand** for global state.
*   **`store/projectStore.ts`**: Manages the core application data (Projects, Data Sources, Analysis results). Uses **Immer** for immutable updates and handles **Undo/Redo** history stacks.
*   **`store/uiStore.ts`**: Manages transient UI state like active modals, sidebars, and global filters.

### 3. Global Modal Manager
We avoid cluttering component trees with dozens of Modal instances.
*   **Pattern**: A central `<ModalManager />` component sits at the root (`App.tsx`).
*   **Trigger**: Components trigger modals via `useUIStore.getState().openModal('modalName', props)`.
*   **Benefit**: Decouples UI logic from complex modal implementations and reduces initial bundle load.

### 4. AI Service Layer & Prompt Abstraction
*   **`services/ai/`**: Specialized services for Analysis, Querying, and Presentation generation.
*   **`lib/prompts.ts`**: **Single Source of Truth** for all LLM prompts. We do not hardcode prompt strings inside service logic. This allows for easier versioning and A/B testing of prompts.
*   **Validation**: All AI outputs are parsed and validated using **Zod** schemas (`utils/validation.ts`) before reaching the UI to prevent crashes from malformed JSON.

## Performance Optimizations

1.  **Data Downsampling (LTTB)**: Large datasets (>500 points) are downsampled using the Largest-Triangle-Three-Buckets algorithm (`utils/sampling.ts`) before being passed to charts. This keeps the DOM light.
2.  **Virtualization**: The Data Studio table uses `react-window` to render only the visible rows, allowing the app to handle 100k+ rows smoothly.
3.  **Web Workers**: Heavy file parsing (Excel/CSV) is offloaded to a background worker (`services/parser.worker.ts`) to keep the main thread responsive.

## Data Flow

1.  **Input**: User uploads a CSV/Excel file.
2.  **Processing**: `services/dataParser.ts` (via Web Worker) parses, validates, and samples the data.
3.  **Action**: `projectStore.createProject` is called.
4.  **Analysis**: `services/ai/analysisService.ts` sends the data sample to Google Gemini. The response is validated via Zod.
5.  **Update**: The store is updated with the AI results via Immer.
6.  **Rendering**: Feature components (`DashboardWorkspace`) subscribe to the store and render the UI.
