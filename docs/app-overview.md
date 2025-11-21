# Application Overview: AI Insights (DataViz Pro)

## 🚀 What is this App?

**AI Insights** is a client-side, AI-powered business intelligence (BI) platform. It democratizes data analysis by allowing users to upload raw data files (CSV, Excel) and instantly receive a professional, interactive dashboard without writing a single line of code or formula.

It bridges the gap between a spreadsheet and a PowerPoint presentation by offering three distinct workspaces:
1.  **Dashboard:** For exploration and monitoring.
2.  **Data Studio:** For cleaning and transformation (ETL).
3.  **Report Studio:** For narrative generation and presentation export.

---

## 👤 User Flow

The user journey is designed to be linear for onboarding, but cyclical for deep work.

### 1. The Entry (Landing & Auth)
*   **Landing Page:** Users arrive at a modern SaaS landing page explaining the value prop (Speed, AI, Privacy).
*   **Authentication:** A mock authentication flow (Login/Signup) leads them to the main application shell.

### 2. Onboarding (The "Empty State")
*   **The Hub:** New users see a "Get Started Hub".
*   **Upload:** The user drags and drops a CSV or Excel file.
*   **Processing:**
    1.  **Parsing:** A Web Worker parses the file off the main thread to keep the UI responsive.
    2.  **Validation:** The app runs a quality check (missing values, duplicates) and presents a `DataQualityReport`.
    3.  **Preview:** The user confirms the data structure in a modal before proceeding.

### 3. The "Aha!" Moment (AI Analysis)
*   Once confirmed, the app sends a *sample* of the data schema to **Google Gemini**.
*   **Gemini's Role:** It acts as a Business Analyst. It identifies:
    *   **KPIs:** Key metrics (e.g., Total Revenue, Average CSAT).
    *   **Charts:** The best visualization types for specific column relationships.
    *   **Trends:** Good/Bad directionality for metrics.
*   **Result:** The user is immediately dropped into a fully populated, interactive dashboard.

### 4. The Dashboard Workspace (Exploration)
*   **KPI Grid:** Top-level metrics with sparklines and trend indicators.
*   **Chart Grid:** A masonry-style layout of charts (Bar, Line, Pie, Scatter).
*   **Interactivity:**
    *   **Global Filters:** Users can filter by time (e.g., "Last 30 Days") or categories (e.g., "Region: North America"). These filters propagate to *all* charts instantly.
    *   **Drill Down:** Clicking a chart opens a maximized view for detailed inspection.
    *   **Edit Mode:** Users can ask AI to change a chart type or modify the layout.

### 5. Data Studio (Refinement)
*   Users switch tabs to **Data Studio** to clean their data.
*   **Actions:** Add calculated columns (using AI-generated formulas), filter rows, sort, or group data.
*   **Safety:** Transformations run in a Web Worker using a safe RPN (Reverse Polish Notation) engine, ensuring no arbitrary code execution.

### 6. Report Studio (Presentation)
*   Users switch to **Report Studio** to prepare for a meeting.
*   **AI Generation:** Users select a template (e.g., "Executive Briefing"). Gemini generates a multi-slide deck with narratives, placing charts and KPIs contextually.
*   **Drag & Drop:** A What-You-See-Is-What-You-Get (WYSIWYG) editor allows moving text blocks and charts on a grid.
*   **Export:** The final deck is exported to a native `.pptx` (PowerPoint) file.

---

## 🎨 UI/UX Design Philosophy

### Visual Language
*   **Clean & Professional:** Uses a `Slate` (gray) and `Primary` (blue) color palette to convey trust and data precision.
*   **Card-Based Layout:** Content is compartmentalized into cards with consistent padding and border radiuses (`rounded-2xl`), creating a modern, "app-like" feel.
*   **Density:** High information density without clutter. Uses whitespace effectively to separate KPIs from complex charts.

### Interaction Patterns
*   **Optimistic UI:** Interactions feel instant. Heavy tasks (parsing, filtering) show loading skeletons or spinners immediately.
*   **Contextual Controls:** Controls (Edit, Delete, Filter) appear on hover (`group-hover`) to reduce visual noise when simply viewing data.
*   **Feedback Loops:**
    *   *Success:* Toast notifications for saves.
    *   *Process:* Progress bars during file parsing.
    *   *Error:* Granular Error Boundaries prevent the whole app from crashing if one chart fails.

### Responsiveness
*   **Mobile-First Logic:** The sidebar collapses to a bottom nav or hamburger menu on mobile. Grids collapse from 4 columns to 1.
*   **Touch Targets:** Buttons and inputs are sized for touch on smaller screens.

---

## ⚙️ Technical Mechanics (How it Works)

### 1. Client-Side Processing (Privacy First)
*   **No Backend Database:** The app does *not* upload the full dataset to a cloud database.
*   **Web Workers:** `parser.worker.ts` and `calculator.worker.ts` handle heavy lifting. This ensures the UI runs at 60fps even with large datasets.
*   **AI Privacy:** Only a small, anonymized sample (top 50 rows) and schema definitions are sent to Gemini for metadata generation. The actual data aggregation happens locally in the browser.

### 2. Hybrid Persistence Strategy
*   **IndexedDB (Dexie.js):** Stores the heavy CSV/Excel blobs. LocalStorage has a 5MB limit; IndexedDB allows storing massive datasets.
*   **LocalStorage:** Stores lightweight project metadata (IDs, Names, Timestamps) for fast listing in the Sidebar.
*   **Zustand + Zundo:** Global state management with "Time Travel" (Undo/Redo) capability.

### 3. The AI Engine
*   **Prompt Engineering:** A `PromptBuilder` class constructs safe prompts, ensuring context windows aren't exceeded.
*   **Structured Output:** The app uses a resilience layer (`generateStructuredContent`) that forces Gemini to return valid JSON matching specific Zod schemas. If Gemini returns bad JSON, the app automatically auto-corrects it via a retry mechanism.

### 4. Visualization Engine
*   **Factory Pattern:** `ChartFactory.tsx` takes a generic config (e.g., `{ type: 'bar', x: 'Date', y: 'Sales' }`) and dynamically instantiates the correct Recharts component.
*   **Auto-Aggregation:** Charts automatically handle data aggregation (Sum, Average, Count) based on the granularity of the data.

---

## 📂 Key Directory Mapping

*   **`components/charts`**: The rendering engine for visualizations.
*   **`features/dashboard`**: The main analytics view logic.
*   **`features/data-studio`**: The Excel-like transformation logic.
*   **`features/report-studio`**: The PowerPoint builder logic.
*   **`services/ai`**: Interfaces with Google Gemini.
*   **`services/workers`**: Background threads for data processing.
