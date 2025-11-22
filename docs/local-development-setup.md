# Local Development & Migration Guide

This document outlines the necessary steps to migrate the current "CDN/Single-File" architecture to a standard local development environment using **Vite**, **React Router**, and **Node.js**.

## 1. Environment Initialization

### A. Scaffold Project
Do not use the existing `index.html` as the entry point. Initialize a new Vite project:

```bash
npm create vite@latest ai-visualizer -- --template react-ts
cd ai-visualizer
```

### B. Install Dependencies
Replace the HTML `<script type="importmap">` dependencies with actual NPM packages.

```bash
# Core Runtime
npm install react-router-dom @google/genai recharts xlsx react-grid-layout lucide-react uuid jspdf html2canvas pptxgenjs clsx tailwind-merge

# Dev Dependencies
npm install -D tailwindcss postcss autoprefixer @types/uuid @types/react-grid-layout
```

### C. Tailwind CSS Setup
1. Initialize Tailwind:
   ```bash
   npx tailwindcss init -p
   ```
2. Update `tailwind.config.js`:
   ```javascript
   export default {
     content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
     theme: {
       extend: {
         colors: {
           primary: {
             50: '#f0f9ff',
             100: '#e0f2fe',
             200: '#bae6fd',
             300: '#7dd3fc',
             400: '#38bdf8',
             500: '#0ea5e9',
             600: '#0284c7',
             700: '#0369a1',
             800: '#075985',
             900: '#0c4a6e',
           }
         }
       },
     },
     plugins: [],
   }
   ```
3. Add directives to `src/index.css`:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

---

## 2. Architecture Changes

### A. Routing (`App.tsx`)
**Goal:** Replace "Conditional Rendering" (state-based) with "Declarative Routing" (URL-based).

**Action Items:**
1.  Remove `useState<Page>('landing')`.
2.  Remove `handleNavigate`, `renderPage`, and the `switch` statement.
3.  Implement `react-router-dom`:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Wrapper for protected routes
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const user = localStorage.getItem('userEmail'); // Or context
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
```

### B. Component Refactoring
**Goal:** Remove prop-drilling of navigation handlers.

**Action Items:**
1.  **Search & Replace:** Find all interfaces defining `onNavigate: (page: Page) => void`. Remove this prop.
2.  **Update Logic:** Inside components (`LandingPage`, `Header`, `LoginPage`), replace the `onNavigate` call with the `useNavigate` hook.

**Example:**
*Before:*
```tsx
<button onClick={() => onNavigate('login')}>Login</button>
```
*After:*
```tsx
import { useNavigate } from 'react-router-dom';
// ...
const navigate = useNavigate();
<button onClick={() => navigate('/login')}>Login</button>
// OR preferably:
import { Link } from 'react-router-dom';
<Link to="/login">Login</Link>
```

---

## 3. Data Processing & Workers

### A. Web Worker (`services/parser.worker.ts`)
Vite handles workers differently than raw HTML imports.

**Action Items:**
1.  Remove `importScripts(...)`.
2.  Use standard ES import: `import * as XLSX from 'xlsx';`.
3.  In `services/dataParser.ts`, initialize the worker using the Vite syntax:
    ```typescript
    const worker = new Worker(new URL('./parser.worker.ts', import.meta.url), { type: 'module' });
    ```

---

## 4. API & Security

### A. Environment Variables
Vite does not use `process.env` by default for browser variables.

**Action Items:**
1.  Create a `.env` file in the project root (add to `.gitignore`).
2.  Add your key:
    ```
    VITE_API_KEY=your_google_api_key
    ```
3.  Update `services/geminiService.ts` (and `ai/client.ts`):
    *   Change: `apiKey: process.env.API_KEY`
    *   To: `apiKey: import.meta.env.VITE_API_KEY`

### B. Security Note
Since this is a Client-Side Rendered (CSR) app, the API key in `.env` will be bundled into the JavaScript.
*   **Local:** This is acceptable for development.
*   **Production:** You must deploy a backend proxy (Node/Express or Next.js API Routes) to hide the key. The React app should request the backend, which then requests Gemini.

---

## 5. File Structure Alignment

Move the provided files into the standard Vite structure:

```
/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── charts/
│   │   ├── modals/
│   │   ├── pages/
│   │   └── ui/
│   ├── features/
│   │   ├── dashboard/
│   │   ├── data-studio/
│   │   └── report-studio/
│   ├── hooks/
│   ├── services/
│   │   ├── ai/
│   │   └── parser.worker.ts
│   ├── types/
│   ├── App.tsx
│   ├── main.tsx  <-- (Replaces index.tsx)
│   └── index.css
├── index.html    <-- (Entry point pointing to /src/main.tsx)
├── package.json
├── tsconfig.json
└── vite.config.ts
```
