# 🚀 VibeCraft - Intelligent Incident Monitoring System

🎥 **Demo Video:**  
https://drive.google.com/file/d/130mRmAjps0BirHzPkfDr7I-Pxsv09IOk/view?usp=sharing

🔗 **Live Deployments:**  
- Production UI: https://vibe-craft-eight.vercel.app/  
- Staging / Feature UI: https://vibe-craft-rho.vercel.app/

> **A comprehensive real-time monitoring and incident management platform with AI-powered anomaly detection and attack simulation capabilities**

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Components](#-components)
- [Tech Stack](#-tech-stack)
- [API Endpoints](#-api-endpoints)

---

## 🎯 Overview

**VibeCraft** is an intelligent monitoring system designed to detect, analyze, and manage incidents in real-time. It combines advanced anomaly detection, AI-powered reasoning, and attack simulation to provide a complete monitoring solution.

### Key Capabilities

- 🔍 **Real-time Anomaly Detection** - Continuously monitors system logs and detects anomalies
- 🤖 **AI-Powered Reasoning** - Uses advanced reasoning to analyze incidents and provide insights
- 🎭 **Attack Simulation** - Simulates various attack scenarios to test system resilience
- 📊 **Incident Management** - Tracks and manages incidents with severity levels and approval workflows
- 🔐 **User Authentication** - Secure login system with face capture (optional database-free mode)
- 📈 **Visual Dashboards** - Beautiful, real-time dashboards for monitoring system health

---

## ✨ Features

### 🛡️ Monitoring Backend
- **Anomaly Detection** - Vector-based similarity detection using FAISS
- **Incident Correlation** - Intelligent incident grouping and correlation
- **Memory System** - Stores and retrieves similar incidents for context
- **Reasoning Agent** - AI agent that analyzes incidents and provides recommendations
- **Log Ingestion** - Fast and efficient log processing pipeline
- **RESTful API** - Comprehensive API for all monitoring operations

### 🎨 Monitoring UI
- **Real-time Dashboard** - Live updates every 2 seconds
- **Incident Details** - Detailed view of incidents with timeline and analysis
- **Status Banners** - Visual indicators for system health status
- **Service Signals** - Monitor individual service health
- **Dark/Light Theme** - Beautiful theme switching
- **Responsive Design** - Works on all screen sizes

### 🎮 Simulator UI
- **Attack Scenarios** - Multiple pre-configured attack scenarios
- **Scenario Controls** - Start/stop/pause attack simulations
- **Real-time Status** - Monitor simulation progress
- **Traffic Visualization** - See attack patterns in real-time

### 🔐 Authentication System
- **Easy Login** - Database-free login for quick access
- **Face Capture** - Optional face verification for signup
- **JWT Tokens** - Secure token-based authentication
- **Protected Routes** - Route protection for authenticated users

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Attack Backend │────▶│ Monitoring       │────▶│  Monitoring UI  │
│  (Port 4000)    │     │  Backend         │     │  (Port 5173)    │
│                 │     │  (Port 5000)     │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │
                                │
                        ┌────────▼────────┐
                        │  Simulator UI   │
                        │  (Port 5174)    │
                        └─────────────────┘
```

### Data Flow

1. **Attack Backend** generates simulated attack logs
2. **Monitoring Backend** ingests logs and detects anomalies
3. **Anomaly Detector** identifies patterns and creates incidents
4. **Reasoning Agent** analyzes incidents and provides insights
5. **Monitoring UI** displays real-time status and incidents
6. **Simulator UI** controls attack scenarios

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16+) and **npm**
- **Python** (v3.8+)
- **PowerShell** (for Windows)

### One-Command Setup

```powershell
.\run_all.ps1
```

This script will:
- 🧹 Clean up existing processes
- 📦 Install all dependencies
- 🚀 Start all services in separate terminals

### Manual Setup

#### 1. Attack Backend
```powershell
cd attack-backend
npm install
npm start
```

#### 2. Monitoring Backend
```powershell
cd monitoring-backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 5000
```

#### 3. Monitoring UI
```powershell
cd monitoring-ui
npm install
npm run dev -- --port 5173
```

#### 4. Simulator UI
```powershell
cd simulator-ui
npm install
npm run dev -- --port 5174
```

### Access Points

- 🌐 **Monitoring UI**: http://localhost:5173
- 🎮 **Simulator UI**: http://localhost:5174
- 🔌 **Monitoring API**: http://localhost:5000
- 📡 **Attack Backend**: http://localhost:4000
- 📚 **API Docs**: http://localhost:5000/docs

---

## 🧩 Components

### 📡 Attack Backend
Simulates various attack scenarios:
- 🔐 Authentication failures
- 💾 Database exhaustion
- ⚡ Latency degradation
- 🌊 Traffic anomalies
- 🔄 Cascading failures

### 🧠 Monitoring Backend
Core monitoring intelligence:
- **Anomaly Detector** (`detection/anomaly_detector.py`) - Detects anomalies using vector similarity
- **Incident Manager** (`correlation/incident_manager.py`) - Manages incident lifecycle
- **Reasoning Agent** (`reasoning/agent.py`) - AI-powered incident analysis
- **Memory System** (`memory/vector_store.py`) - Stores and retrieves similar incidents
- **Log Repository** (`storage/log_repository.py`) - Efficient log storage and retrieval

### 🎨 Monitoring UI
React-based frontend with:
- **Incident Dashboard** - Real-time incident monitoring
- **Status Banners** - Visual health indicators
- **Timeline View** - Chronological incident view
- **Service Signals** - Individual service monitoring
- **Approval Panel** - Incident approval workflow

### 🎮 Simulator UI
Attack simulation interface:
- **Scenario Cards** - Visual scenario selection
- **Control Panel** - Start/stop/pause controls
- **Status Display** - Real-time simulation status

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **FAISS** - Vector similarity search
- **Sentence Transformers** - Text embeddings
- **Google Generative AI** - AI reasoning capabilities
- **JWT** - Token-based authentication
- **Bcrypt** - Password hashing

### Frontend
- **React** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **CSS3** - Styling with modern features

### Attack Simulation
- **Node.js** - Attack backend runtime
- **Express** - Web server framework

---

## 🔌 API Endpoints

### Authentication
- `POST /auth/login` - Login (database-free mode)
- `POST /auth/signup` - Sign up with face capture
- `GET /auth/me` - Get current user

### Monitoring
- `POST /ingest` - Ingest log entries
- `GET /anomaly/detect` - Trigger anomaly detection
- `GET /incident/current` - Get current incident
- `GET /incident/{id}` - Get incident details
- `POST /incident/{id}/approve` - Approve incident

### Debug
- `GET /debug/users` - List all users
- `GET /debug/logs` - View recent logs
- `GET /debug/memory` - Check memory system

---

## 📝 Project Structure

```
VibeCraft/
├── 📁 attack-backend/          # Attack simulation server
├── 📁 monitoring-backend/      # FastAPI monitoring backend
│   ├── 📁 api/                 # API endpoints
│   ├── 📁 detection/           # Anomaly detection logic
│   ├── 📁 correlation/         # Incident correlation
│   ├── 📁 reasoning/           # AI reasoning agent
│   ├── 📁 memory/              # Vector store for similar incidents
│   └── 📁 storage/             # Database and repositories
├── 📁 monitoring-ui/           # React monitoring dashboard
└── 📁 simulator-ui/             # React simulator interface
```

---

## 🎯 Use Cases

- 🏢 **Enterprise Monitoring** - Monitor production systems for anomalies
- 🧪 **Security Testing** - Simulate attacks and test detection capabilities
- 📊 **Incident Management** - Track and manage incidents with AI assistance
- 🔍 **Log Analysis** - Analyze system logs for patterns and issues
- 🎓 **Learning Tool** - Learn about anomaly detection and incident management

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🙏 Acknowledgments

Built with ❤️ using modern web technologies and AI-powered reasoning.

---

**Made with 🚀 by the VibeCraft Team**
