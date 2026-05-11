# Public Transport AR System

This repository contains the TRL 3 prototype foundation for the Tunnel Inspection Console and AR Fault Management System.

## Project Structure

* **backend**: Express API handling authentication, SQLite database operations, and Groq-powered AI image analysis.
* **frontend**: React/Vite application integrating both the data visualization dashboard and the augmented reality (AR) scanner interface.
* **security**: Repository for threat models and security documentation.

## Backend Configuration & Dependencies

The backend service relies on Node.js, Express, `better-sqlite3` for local relational data storage, and the `groq-sdk` for computer vision processing.

The server requires environment variables to function. Copy the `backend/.env.example` to `backend/.env` and ensure the following keys are defined:
* `PORT` (e.g., 3000)
* `JWT_SECRET` (Required for session management)
* `GROQ_API_KEY` (Required for AR fault detection routing)

*This file is excluded from version control to prevent credential leakage.*

### Database Initialization
Before running the server for the first time, you must build the SQLite database schema and seed the initial data.


cd backend
npm install
node init.js   # Creates tables and fixed users/tools
node seed.js   # Populates random test faults and session data


node server.js
Note: The backend payload limits have been expanded to 50MB and CORS is fully configured to accept cross-origin requests from the frontend development server.

Frontend Development
The frontend application is scaffolded using Vite and utilizes Recharts for the analytics dashboard. It requires its own dependency installation.

To start the AR application:


cd frontend
npm install
npm run dev
AR Scanner Architecture & Optimizations
The system utilizes the meta-llama/llama-4-scout-17b-16e-instruct model via the Groq API for structural fault detection.

To comply with Groq's strict hardware-bound payload limits (~4MB) while maintaining high pixel detail for the computer vision model to detect structural faults (dents, cracks, rust), the frontend implements a native HTML5 Canvas compression algorithm. Uploaded images are proportionally resized to a 1024px maximum width and converted to 85% quality JPEGs prior to Base64 encoding and transmission.

API Specifications
Authentication
The system uses JWT for session management. Users must authenticate via POST /api/auth/login to receive a bearer token.
(For prototype testing, use the hardcoded credentials: engineer / Password1).

Data Access
Protected routes, such as GET /api/faults, GET /api/analytics/*, and POST /api/faults/detect, require the token to be passed in the HTTP Authorization header.

Team Responsibilities
Software Engineering
Implement frontend API consumers and build out the AR components within the frontend app. Ensure global state handles the JWT returned from the backend and maintain the client-side image compression pipeline.

Data Pathway
Manage the SQLite schema (schema.sql) and better-sqlite3 integration to replace mocked data. Utilize the frontend dashboard for infrastructure health metrics.

Security Pathway
Conduct a code audit of auth.js / authMiddleware.js and implement password hashing using bcryptjs. Document findings in the security directory.