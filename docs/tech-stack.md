# Tech Stack

## Core
-   **Framework**: React 18+ (Vite)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS

## State Management
-   **Global Store**: Zustand
-   **Immutability**: Immer
-   **Persistence**: `zustand/middleware/persist` (LocalStorage)

## AI & Data
-   **AI SDK**: Google GenAI SDK (`@google/genai`)
    -   *Models*: `gemini-2.5-flash` (Analysis), `gemini-2.5-pro` (Report Generation)
-   **Validation**: Zod (Runtime schema validation for AI responses)
-   **File Parsing**: SheetJS (`xlsx`)
-   **PDF/PPTX Export**: `pptxgenjs`, `jspdf`, `html2canvas`

## Visualization & Performance
-   **Charts**: Recharts (Optimized with LTTB downsampling)
-   **Grid Layout**: `react-grid-layout` (Drag-and-drop canvas)
-   **Virtualization**: `react-window` (High-performance table rendering)

## Icons
-   **Library**: `lucide-react`
