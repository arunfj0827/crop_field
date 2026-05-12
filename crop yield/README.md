# Crop Yield Prediction System

This project is a full-stack application that handles user inputs for crop yield prediction, processes data through a Spring Boot backend, and uses a Python-based ML service for prediction and SHAP analysis.

## 🚀 Components

### 1. ML Service (Python/FastAPI)
Located in `/ml-service`.
- **Run**: 
  ```bash
  cd ml-service
  python main.py
  ```
- **Port**: 8000

### 2. Backend (Spring Boot/Java)
Located in `/backend`.
- **Requirements**: JDK 17, PostgreSQL (running on port 5432).
- **Setup**: Update `application.properties` with your PostgreSQL credentials.
- **Run**:
  ```bash
  cd backend
  ./mvnw spring-boot:run
  ```
- **Port**: 8080

### 3. Frontend (React/TypeScript)
Located in `/frontend`.
- **Run**:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
- **Port**: 5173 (usually)

## 📊 System Flow
1. **Input**: User enters Region, Crop, Season, and environmental parameters (Temp, Rain).
2. **Backend**: Spring Boot receives the request and calls the ML Service.
3. **AI Core**: FastAPI processes the heuristic model and generates SHAP explanations.
4. **Dashboard**: Results are displayed with interactive charts and AI-driven recommendations.

## 🛠️ Tech Stack
- **Frontend**: React, Tailwind CSS, Recharts, Lucide Icons.
- **Backend**: Spring Boot, Spring Data JPA, PostgreSQL.
- **ML**: Python, FastAPI, NumPy, Pandas (simulated models).
