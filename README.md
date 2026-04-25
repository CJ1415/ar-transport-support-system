Public Transport AR System
This repository contains the TRL 3 prototype foundation.

Project Structure
backend: Express API handling authentication and infrastructure data.

frontend-ar: React/Vite application for the augmented reality interface.

frontend-dashboard: Placeholder for data visualization and analytics.

security: Repository for threat models and security documentation.

Backend Configuration
The server requires environment variables to function. Copy the backend/.env.example to backend/.env and ensure the JWT_SECRET is defined. This file is excluded from version control to prevent credential leakage.

To start the service:

    cd backend
    npm install
    node server.js


Frontend Development
Both frontend applications are scaffolded using Vite. Each requires its own dependency installation.

To start the AR application:
 
    cd frontend-ar
    npm install
    npm run dev


API Specifications
Authentication
The system uses JWT for session management. Users must authenticate via POST /api/auth/login to receive a bearer token.

Data Access
Protected routes, such as GET /api/faults, require the token to be passed in the HTTP Authorization header.

Team Responsibilities:
    Software Engineering
        Implement frontend API consumers and build out the AR components within frontend-ar. Ensure global state handles the JWT returned from the backend.

    Data Pathway
        Define the database schema to replace the mocked data in backend/routes/faults.js. Utilize frontend-dashboard for infrastructure health metrics.

    Security Pathway
        Conduct a code audit of the authMiddleware.js and implement password hashing using Bcrypt. Document findings in the security directory.