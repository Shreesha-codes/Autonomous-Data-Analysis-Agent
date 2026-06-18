# Autonomous Data Analysis Agent

An advanced MERN stack application designed for automated data ingestion, statistical profiling, and interactive data querying. Translate natural language questions into sandboxed Python execution runs with automatic self-correction loops.

---

## Key Features

### 📊 Automated Ingestion & Data Profiling
- **Multi-Format Ingestion**: Supports drag-and-drop uploads of CSV, XLSX, and JSON datasets.
- **Auto-Profiling**: Computes types (numeric, date, string, boolean), completeness metrics, unique value counts, and descriptive statistics (min, max, mean, median).
- **Outlier Detection**: Employs the **Interquartile Range (IQR)** method to highlight numerical anomalies and flags structural mixed-format string fields.

### 🐍 Conversational Multi-Turn Sandbox
- **Natural Language Translator**: Translates business questions directly into functional Python Pandas scripts using the Gemini API.
- **Isolated Execution Sandbox**: Spawns python runtime environments safely with automatic timeout guards (10s) and temp-script cleanups.
- **Iterative Self-Correction**: Automatically catches execution exceptions/failures and prompts the LLM to patch the code iteratively (up to 3 retries).
- **Session Memory**: Injects previous questions, generated code, and results directly into LLM prompts for multi-turn follow-up queries.

### 🎨 Premium Visual Dashboard
- **Recharts Visualization**: Dynamically renders Bar, Line, or Scatter plots based on the structural configuration returned by the AI.
- **Visual Terminal Logger**: Visualizes sandbox execution progress, correction loops, and compilation statuses in real-time.
- **Findings Narratives**: Structures summary reports containing Key Insights, Uncertainties & Limitations, and Next Steps.

---

## Directory Structure

```
Autonomous-Data-Analysis-Agent/
├── backend/
│   ├── src/
│   │   ├── config/db.ts         # Mongoose DB connector with Memory Fallbacks
│   │   ├── middlewares/         # JSON error handlers
│   │   ├── models/Session.ts    # Session and interaction MongoDB models
│   │   ├── routes/sessionRoutes.ts # Upload profiling & Stepper sandbox endpoints
│   │   ├── utils/llm.ts         # Gemini Prompting & Simulation layer
│   │   ├── utils/sandbox.ts     # Python isolated execution child processes
│   │   └── index.ts             # Express entry point
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.tsx      # Chronological session lists
    │   │   ├── MainContent.tsx  # Workspace area & chat timeline
    │   │   ├── UploadZone.tsx   # Drag & drop upload files
    │   │   ├── ProfileDashboard.tsx # Expandable data schemas & stats
    │   │   ├── Visualizer.tsx   # Dynamic Recharts visualization card
    │   │   └── ExecutionStepper.tsx # Visual terminal stepper logs
    │   ├── context/SessionContext.tsx # Global session state & API operations
    │   └── main.tsx
    ├── tailwind.config.js       # Tailwind CSS v4 styling rules
    ├── postcss.config.js
    └── package.json
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python 3](https://www.python.org/) (with `pandas` installed: `pip install pandas`)

### Setup Configuration

Create a `.env` file inside the `backend` directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/data_analysis_agent
GEMINI_API_KEY=your_gemini_api_key_here
CORS_ORIGIN=http://localhost:5173
```
*Note: If MongoDB is not running locally, the server automatically falls back to an in-memory data store for seamless testing.*

### Installation & Launch

1. **Install backend dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Install frontend dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

3. **Launch the backend server**:
   ```bash
   cd ../backend
   npm run dev
   ```

4. **Launch the frontend client**:
   ```bash
   cd ../frontend
   npm run dev
   ```

Open [http://localhost:5173](http://localhost:5173) in your browser to begin analyzing your datasets!
