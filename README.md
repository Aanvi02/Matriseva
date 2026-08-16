<div align="center">

# 🌸 Matriseva

**AI-Powered Maternal Healthcare Platform for Rural India**

Bridging the last-mile healthcare gap for expecting mothers through real-time risk prediction, multilingual AI support, and coordinated care between ASHA workers, doctors, and patients.

[![Live Demo](https://img.shields.io/badge/Live-Demo-B9A7FF?style=for-the-badge)](#)
[![GitHub](https://img.shields.io/badge/View-Code-2d2b45?style=for-the-badge&logo=github)](#)

</div>

---

## The Problem

In rural India, maternal health monitoring is fragmented — ASHA workers track patient vitals on paper, doctors have limited visibility into at-risk pregnancies, and patients often lack access to timely guidance in their own language. High-risk pregnancies frequently go undetected until it's too late.

**Matriseva** connects all three stakeholders — ASHA workers, doctors, and patients — on a single platform, using a trained ML model to flag risk in real time and a multilingual AI assistant to make guidance accessible.

---

## Features

### 🏥 Multi-Role Platform
Dedicated, role-based dashboards for **ASHA Workers**, **Doctors**, and **Patients** — each seeing exactly what they need.

### 🤖 AI Risk Prediction
A Random Forest classifier trained on 1,000+ maternal health records, served via a live `/predict` API endpoint, flags pregnancies as **Low / Moderate / High risk** with 83% accuracy — visible instantly on both the ASHA portal and the patient dashboard.

### 🌐 Multilingual AI Assistant
Gemini-powered assistant that communicates in **Hindi, English, and Hinglish**, making health guidance accessible regardless of literacy or language barriers.

### 📅 Appointments & Records
End-to-end appointment scheduling and structured patient record management across roles.

### 🔐 Secure Auth
JWT-based authentication with role-aware access control.

---

## Screenshots

**ASHA Worker — Patient Management**
Track and register patients by risk level, view scores at a glance, and manage doctor assignments.


**Patient — Health Overview**
Real-time AI risk assessment alongside vitals (blood pressure, hemoglobin, weight, blood sugar) and week-by-week pregnancy guidance.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Backend | FastAPI (object-oriented architecture) |
| Database | Supabase |
| ML Model | Scikit-learn (Random Forest) |
| AI Assistant | Google Gemini API |
| Auth | JWT |

---

## Architecture

Patient / ASHA Worker
│
▼
React Frontend
│
▼
FastAPI Backend ──────► Random Forest Model (/predict)
│
▼
Supabase


1. ASHA workers log patient vitals through the portal
2. Data is sent to the FastAPI backend and routed to the `/predict` endpoint
3. The Random Forest model returns a real-time risk classification
4. High-risk cases surface to doctors; patients see AI-driven guidance instantly
5. The Gemini assistant is available throughout for multilingual support

---

## Model Performance

| Metric | Value |
|---|---|
| Algorithm | Random Forest Classifier |
| Training data | 1,000+ maternal health records |
| Accuracy | 83% |
| Task | Pregnancy risk stratification (Low / Moderate / High) |
| Serving | FastAPI `/predict` endpoint |

---

## Getting Started

### Prerequisites
- Node.js
- Python 3.9+
- Supabase project + Gemini API key

### Backend

```bash
cd matriseva-backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd matriseva-frontend
npm install
npm run dev
```

### Environment Variables

Create a `.env` file in `matriseva-backend/`:

```env
SUPABASE_URL=
SUPABASE_KEY=
GEMINI_API_KEY=
JWT_SECRET=
```

---


<div align="center">

(https://github.com/Aanvi02)**

</div>
