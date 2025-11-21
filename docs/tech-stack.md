# Tech Stack

## Core
-   **Framework**: React 18+ (Vite)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS

## State & Data
-   **State Management**: Zustand
-   **Undo/Redo**: Zundo (Temporal Middleware)
-   **Async State/Caching**: TanStack Query (React Query)
-   **Persistence**:
    -   **Dexie.js**: IndexedDB wrapper for large datasets.
    -   **LocalStorage**: For metadata and preferences.

## AI & Processing
-   **AI SDK**: Google GenAI SDK (`@google/genai`)
    -   *Models*: `gemini-2.5-flash`, `gemini-2.5-pro`
-   **Parsing**: SheetJS (`xlsx`)
-   **Validation**: Zod
-   **Workers**: Native Web Workers for off-main-thread processing.

## Visualization
-   **Charts**: Recharts
-   **Grid Layout**: `react-grid-layout`
-   **Export**: `pptxgenjs`, `html2canvas`

## Icons
-   **Library**: `lucide-react`