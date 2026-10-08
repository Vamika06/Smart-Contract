# SmartAudit — AI-Powered Smart Contract Vulnerability Scanner

A production-ready, full-stack application for detecting security vulnerabilities in Solidity smart contracts using static analysis and AI-powered explanations.

## Features

- **AI-Powered Analysis**: Azure OpenAI GPT-4 / OpenAI / Ollama fallback
- **13+ Vulnerability Types**: Reentrancy, Integer Overflow, tx.origin, Timestamp Dependency, Delegatecall, Selfdestruct, Front-Running, Weak Randomness, Access Control, Unchecked Calls, DoS, Uninitialized Storage, Gas Optimization
- **Monaco Editor**: Syntax-highlighted Solidity code editor with drag-and-drop file upload
- **Security Scoring**: 0–100 score with animated gauge and risk classification
- **PDF Reports**: Professional downloadable security reports
- **Dashboard Analytics**: Charts, trends, and vulnerability distribution
- **Admin Panel**: User management, audit logs, API usage monitoring
- **Dark/Light Mode**: System-aware theme with toggle
- **JWT Authentication**: Register, login, forgot/reset password, profile management

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Code Editor | Monaco Editor |
| Charts | Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcrypt |
| AI | Azure OpenAI / OpenAI / Ollama |
| PDF | PDFKit |
| File Upload | Multer |

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Optional: OpenAI or Azure OpenAI API key, or Ollama

### 1. Clone and Install

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install
```

### 2. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your settings

# Frontend (optional)
cp .env.example .env.local
```

### 3. Start Development Servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev   # nodemon server.js on port 5000
```

**Terminal 2 — Frontend:**
```bash
npm run dev   # Vite on port 5173
```

Open http://localhost:5173

### 4. Create First Admin User

Register via the UI, then in MongoDB:
```js
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

## Docker Deployment

```bash
# Copy and configure env
cp backend/.env.example backend/.env

# Start all services
docker-compose up -d
```

Services:
- Frontend: http://localhost
- Backend: http://localhost:5000
- MongoDB: localhost:27017

## Production Deployment

### Frontend → Vercel
```bash
npm run build
# Deploy dist/ to Vercel
# Set VITE_API_URL env var if using separate domain
```

### Backend → Render
1. Connect your GitHub repo
2. Set root directory to `backend/`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variables from `backend/.env.example`

### Database → MongoDB Atlas
1. Create cluster at cloud.mongodb.com
2. Get connection string
3. Set `MONGODB_URI` in backend environment variables

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Sign in |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/profile | Update profile |
| PUT | /api/auth/change-password | Change password |
| POST | /api/auth/forgot-password | Request reset link |
| POST | /api/auth/reset-password | Reset password |

### Contracts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/contracts/scan | Start contract scan |
| GET | /api/contracts/history | List scan history |
| GET | /api/contracts/:id | Get scan details |
| GET | /api/contracts/:id/status | Poll scan status |
| DELETE | /api/contracts/:id | Delete scan |
| PATCH | /api/contracts/:id/notes | Update notes/tags |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/reports/:id/pdf | Download PDF report |

## Vulnerability Detection

| Vulnerability | CWE | OWASP |
|---------------|-----|-------|
| Reentrancy Attack | CWE-841 | SC-01 |
| Integer Overflow/Underflow | CWE-190 | SC-02 |
| tx.origin Authentication | CWE-284 | SC-03 |
| Timestamp Dependency | CWE-330 | SC-04 |
| Delegatecall Misuse | CWE-829 | SC-05 |
| Selfdestruct Misuse | CWE-693 | SC-06 |
| Unchecked External Call | CWE-252 | SC-07 |
| Weak Randomness | CWE-338 | SC-08 |
| Missing Access Control | CWE-284 | SC-09 |
| Front-Running | CWE-362 | SC-10 |
| Denial of Service | CWE-400 | SC-11 |
| Uninitialized Storage | CWE-824 | SC-12 |
| Gas Optimization | CWE-405 | SC-13 |

## Security Score

| Score | Classification |
|-------|---------------|
| 90–100 | Excellent |
| 75–89 | Good |
| 60–74 | Moderate Risk |
| 40–59 | High Risk |
| 0–39 | Critical Risk |

## Project Structure

```
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   │   ├── analysisService.js   # Static vulnerability scanner
│   │   └── aiService.js         # AI explanation engine
│   └── server.js
├── src/
│   ├── components/
│   │   ├── common/
│   │   └── layout/
│   ├── context/
│   ├── pages/
│   └── services/api.js
└── docker-compose.yml
```

## License

MIT
