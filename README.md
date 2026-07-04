# Symmetry — AI-Powered Posture & Movement Assessment

<p align="center">
  <strong>Analyze posture • Track movement patterns • Get exercise recommendations</strong><br>
  <em>100% local. Zero cloud. Complete privacy.</em>
</p>

---

## What is Symmetry?

Symmetry is a browser-based application that uses your webcam and [MediaPipe Pose Landmarker](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker) to analyze human posture and movement in real time. It identifies common postural deviations using a deterministic rules engine and recommends corrective exercises from a structured knowledge base.

**This is NOT a medical device.** It reports observable movement characteristics and suggests general improvements.

### Key Features

- **Live Pose Detection** — 33-point skeleton overlay at 20–30 FPS
- **5 Movement Tests** — Standing Posture, Squat, Overhead Reach, Single-Leg Balance, Forward Bend
- **12 Biomechanical Metrics** — Forward head angle, shoulder symmetry, pelvic tilt, knee valgus, trunk lean, and more
- **Deterministic Assessment** — Rules-based engine with severity levels (no AI image classification)
- **Exercise Recommendations** — Matched to findings from a structured knowledge base
- **Session History** — Stored locally in IndexedDB with JSON/CSV export
- **Premium Dark UI** — Glassmorphism design inspired by sports science dashboards
- **Complete Privacy** — No cloud, no analytics, no telemetry, no uploads

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm
- A modern browser (Chrome, Edge, Firefox) with webcam access
- Internet connection for the **first load only** (downloads MediaPipe model ~5MB)

### Installation

```bash
# Clone or navigate to the project
cd Symmetry

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open **http://localhost:5173** in your browser.

### Production Build

```bash
npm run build
npm run preview
```

---

## Usage

### Assessment Flow
To run an assessment and get recommendations:
1. **Select a Movement Test** from the left sidebar.
2. **Start Camera** (or load a pre-recorded video).
3. **Click "Begin Assessment"** (or "Check My Form") on the left panel.
4. **Hold your position** (the app waits for you to be ready and stable).
5. **Wait for the countdown** and perform the movement while it records for 5 seconds.
6. **Review the AI Summary & Recommendations** at the bottom of the screen.

### Local AI Coach (LM Studio)
Symmetry supports generating natural language summaries and form feedback using a local LLM.
To enable the AI Coach:
1. Download and open [LM Studio](https://lmstudio.ai/).
2. Load a model (e.g., `gpt-oss-20b`, `llama-3-8b-instruct`, etc.).
3. Go to the **Local Server** tab in LM Studio.
4. Ensure the port is set to **`1234`**.
5. **Enable CORS** in the server settings (required for the web app to connect).
6. Click **Start Server**.

*If LM Studio is not running, Symmetry will skip the AI summary but still provide rules-based measurements and findings.*

---

## Architecture

```
src/
├── camera/           # Webcam access, stream management, CameraView component
├── pose/             # MediaPipe PoseLandmarker integration, skeleton rendering
├── measurements/     # Angle calculations, posture & movement metric computation
├── assessment/       # Deterministic rules engine, assessment runner
│   └── rules/        # Rule definitions per test type
├── knowledge/        # Exercise knowledge base, recommendation engine
├── storage/          # IndexedDB session storage, JSON/CSV export
├── stores/           # Zustand state management (camera, pose, assessment, session)
├── hooks/            # Custom hooks (pose detection loop)
├── types/            # TypeScript type definitions
├── ui/               # React UI components
│   ├── components/   # Reusable components (scores, metrics, cards, etc.)
│   └── views/        # Page-level views (Live, History, Settings)
├── App.tsx           # Root component with view routing
├── main.tsx          # Entry point
└── index.css         # Design system (dark theme, glassmorphism, animations)
```

### Data Flow

```
Webcam → MediaPipe PoseLandmarker → 33 Landmarks
    → Measurement Engine → Biomechanical Metrics
        → Rules Engine → Assessment Findings
            → Knowledge Base → Exercise Recommendations
                → Dashboard UI
                → IndexedDB (on save)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 6 |
| Build | Vite 8 |
| Styling | TailwindCSS v4 |
| Pose Detection | MediaPipe Pose Landmarker |
| State Management | Zustand 5 |
| Charts | Recharts 3 |
| Local Storage | IndexedDB (via idb) |

---

## Movement Tests

| Test | What It Measures |
|------|-----------------|
| **Standing Posture** | Head position, shoulder symmetry, pelvic alignment, knee angles, weight distribution |
| **Squat** | Depth, knee tracking, hip shift, trunk lean, heel lift, L/R asymmetry |
| **Overhead Reach** | Shoulder mobility, trunk compensation, elbow extension |
| **Single-Leg Balance** | Hip stability, pelvic drop, trunk sway |
| **Forward Bend** | Spinal flexion, hip hinge, symmetry |

---

## Privacy

- ✅ All processing runs in your browser
- ✅ No video or images are ever transmitted
- ✅ No cloud APIs or external services
- ✅ No user accounts required
- ✅ No analytics or telemetry
- ✅ Session data stored locally in IndexedDB
- ✅ Works offline after initial model download

---

## Disclaimer

This application does **not** provide medical diagnoses. It reports observable movement characteristics and suggests general movement improvements. Always consult a qualified healthcare professional if you experience pain or have concerns about your posture or movement.

---

## License

MIT
