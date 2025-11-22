# Tech Stack

## Core
-   **Framework**: React 18+ (Vite)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS

## AI & Data
-   **AI SDK**: Google GenAI SDK (`@google/genai`)
    -   *Models*: `gemini-2.5-flash` (Analysis), `gemini-2.5-pro` (Report Generation)
-   **File Parsing**: SheetJS (`xlsx`)
-   **PDF/PPTX Export**: `pptxgenjs`, `jspdf`, `html2canvas`

## Visualization
-   **Charts**: Recharts (built on top of D3 concepts but React-native)
-   **Grid Layout**: `react-grid-layout` (for Report Studio drag-and-drop)

## State Management
-   **Local State**: React `useState`, `useReducer`
-   **Global/Persisted State**: Custom `useProjects` hook wrapping `localStorage`.
-   **Async State**: Managed via custom hooks with loading/error states (simulating React Query patterns).

## Icons
-   **Library**: `lucide-react`
