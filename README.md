# AI Auto-Visualizer

![AI Auto-Visualizer Screenshot](https://storage.googleapis.com/aistudio-hosting/workspace-samples/screenshot.png)

Upload your data (CSV, Excel) and let our AI analyze it to automatically generate beautiful, interactive dashboards and multi-page reports in seconds.

---

## ✨ Features

-   **Instant AI Analysis**: Upload a CSV or Excel file, and Gemini will automatically analyze its structure, identify key metrics, and suggest relevant visualizations.
-   **Automated Dashboard Generation**: Generates a full dashboard with Key Performance Indicators (KPIs) and a variety of chart types (Bar, Line, Pie, Scatter, and more).
-   **Interactive & Customizable**:
    -   **Filter Data**: Apply global time-based and categorical filters to drill down into your data.
    -   **Edit Charts**: Modify chart titles, descriptions, types, colors, and data mappings on the fly.
    -   **Customize Layout**: Choose from multiple pre-defined dashboard layouts inspired by top consulting firms.
-   **AI Report Studio**:
    -   **Narrative Generation**: Generate a professional, multi-page business report in Markdown with an executive summary, key findings, and actionable recommendations using Gemini 2.5 Pro.
    -   **Drag & Drop Editor**: Customize the report layout by dragging and dropping KPIs, charts, and text blocks.
    -   **PDF Export**: Export the final report as a high-quality, multi-page PDF.
-   **Project Management**: Save your analyses as projects, which are persisted in your browser's local storage. Rename, delete, and switch between projects easily.
-   **Data Quality Validation**: Get an instant report on your data's quality, including missing values and duplicate rows, before analysis.
-   **Secure & Private**: File processing and data validation happen entirely in your browser. Only a small, anonymized sample is sent to the AI for analysis.

---

## 🚀 Tech Stack

-   **Frontend**: React, TypeScript
-   **Styling**: Tailwind CSS
-   **AI**: Google Gemini API (`@google/genai`)
    -   **Data Analysis**: `gemini-2.5-flash`
    -   **Report Generation**: `gemini-2.5-pro`
-   **Charting**: Recharts
-   **Layout**: React Grid Layout
-   **File Parsing**: SheetJS (xlsx)
-   **PDF Generation**: jsPDF, html2canvas
-   **Persistence**: Browser Local Storage

---

## 🛠️ Getting Started: Local Development

This application is designed to run directly in a browser environment that supports ES modules and provides the necessary API key.

### Prerequisites

-   A modern web browser (e.g., Chrome, Firefox, Edge).
-   A Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/app/apikey).
-   A local web server to serve the `index.html` file. You can use extensions like VS Code's "Live Server".

### Setup & Running

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ai-auto-visualizer.git
    cd ai-auto-visualizer
    ```

2.  **Set up the API Key:**
    The application expects the Google Gemini API key to be available as an environment variable named `API_KEY`. The execution environment (like Google's internal development platform) is responsible for injecting this variable. For local testing, you would need to simulate this environment or modify the code in `services/geminiService.ts` to temporarily hardcode your key (not recommended for production).

3.  **Run the application:**
    Serve the project's root directory using a local web server. For example, using the "Live Server" extension in VS Code, you can right-click `index.html` and select "Open with Live Server".

    The application will open in your browser.

---

## 🌐 Deployment

This project is a static web application and can be deployed to any static hosting service (e.g., Vercel, Netlify, GitHub Pages).

1.  **Build Step:** No build step is required as the app uses browser-native ES modules and an import map to load dependencies from a CDN.
2.  **Environment Variables**: Ensure your hosting provider is configured to provide the `API_KEY` environment variable to the application runtime.

---

## 📂 Project Structure

```
/
├── index.html            # Main HTML file, includes Tailwind CSS setup and import maps
├── index.tsx             # React application entry point
├── App.tsx               # Main component, handles routing and user state
├── types.ts              # Core TypeScript type definitions for the app
├── metadata.json         # Application metadata
│
├── components/           # Reusable React components
│   ├── Dashboard.tsx     # Main dashboard workspace logic
│   ├── Sidebar.tsx       # Project navigation sidebar
│   ├── ChartRenderer.tsx # Renders individual charts and their controls
│   ├── AIReportView.tsx  # Drag-and-drop report editor
│   ├── GetStartedHub.tsx # Initial landing/upload screen
│   └── ...               # Other UI components (modals, charts, etc.)
│
└── services/             # Business logic and external API interactions
    ├── geminiService.ts  # All interactions with the Google Gemini API
    └── dataParser.ts     # In-browser file parsing and validation logic
```
