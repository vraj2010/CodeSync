# CodeSync - Real-time Collaborative Code Editor

A real-time collaborative code editor that allows multiple users to code together in the same room with synchronized editing, language selection, and code execution.

## Features

- 🔄 **Real-time Collaboration**: Multiple users can edit code simultaneously
- 🎨 **Syntax Highlighting**: Support for multiple programming languages
- ⚡ **Live Code Execution**: Execute code using Piston API
- 🔗 **Room-based Sessions**: Create or join rooms with unique IDs
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React, CodeMirror, Socket.io-client
- **Backend**: Node.js, Express, Socket.io
- **Code Execution**: Piston API

## Local Development

### Prerequisites

- Node.js >= 18.0.0
- npm

### Setup

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd code-sync
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from example:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your values:
   ```env
   REACT_APP_BACKEND_URL=http://localhost:5000
   GENERATE_SOURCEMAP=false
   ```

5. Start development servers:

   **Terminal 1 - Backend:**
   ```bash
   npm run server:dev
   ```

   **Terminal 2 - Frontend:**
   ```bash
   npm run start:front
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Deployment on Render

### Method 1: Deploy via Render Dashboard

1. **Push your code to GitHub**

2. **Create a new Web Service on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Web Service"
   - Connect your GitHub repository

3. **Configure the service:**
   | Setting | Value |
   |---------|-------|
   | **Name** | code-sync (or your preferred name) |
   | **Region** | Choose nearest to your users |
   | **Branch** | main |
   | **Runtime** | Node |
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `npm run server:prod` |
   | **Health Check Path** | `/health` |

4. **Set Environment Variables:**
   - `NODE_ENV` = `production`
   - `JUDGE0_API_URL` = `https://judge0-ce.p.rapidapi.com` (optional)
   - `JUDGE0_API_KEY` = `your-api-key` (optional, for code execution)

5. Click **Create Web Service**

### Method 2: Deploy via render.yaml (Blueprint)

1. Push your code with `render.yaml` to GitHub
2. Go to Render Dashboard → "Blueprints"
3. Connect your repository
4. Render will automatically detect the `render.yaml` and configure your service

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` for deployment |
| `PORT` | No | Port number (auto-set by Render) |
| `RENDER_EXTERNAL_URL` | No | Auto-populated by Render |
| `JUDGE0_API_URL` | No | Judge0 API URL for code execution |
| `JUDGE0_API_KEY` | No | Your Judge0 API key |
| `REACT_APP_BACKEND_URL` | Dev only | Backend URL for local development |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check endpoint |
| `/api/execute` | POST | Execute code via Piston API |

## WebSocket Events

| Event | Description |
|-------|-------------|
| `join` | Join a room |
| `joined` | User joined notification |
| `disconnected` | User disconnected |
| `code-change` | Code content changed |
| `language-change` | Language selection changed |
| `code-output` | Code execution output |

## Troubleshooting

### WebSocket Connection Issues on Render

If you experience WebSocket connection issues:

1. Ensure your Render service allows WebSocket connections (enabled by default)
2. The app automatically falls back to polling if WebSocket fails
3. Check the browser console for connection errors

### Build Failures

1. Ensure Node.js version >= 18.0.0
2. Check if all dependencies are listed in `package.json`
3. Review Render build logs for specific errors

### Health Check Failures

1. Verify the `/health` endpoint is accessible
2. Check if the server is binding to `0.0.0.0`
3. Ensure `PORT` environment variable is being used

## License

MIT
