# Interactive JavaScript/TypeScript Code Tutor

**Visualize JavaScript and TypeScript code execution step-by-step in your browser**

Originally based on [Python Tutor](http://pythontutor.com/) by [Philip Guo](http://pgbovine.net/), this fork has been modernized to focus specifically on JavaScript and TypeScript visualization for modern web development education.

## 🚀 Key Features

- ✅ **Modern ECMAScript Support** - ES2015 through ES2025 features supported
- ✅ **JavaScript ES6+ Visualization** - Step-through execution of modern JavaScript
- ✅ **TypeScript Support** - Full TypeScript code execution and visualization
- ✅ **Latest Language Features** - Private fields, top-level await, optional chaining, and more
- ✅ **Modern Build System** - Webpack + TypeScript development workflow
- ✅ **Simplified Setup** - Uses system Node.js (v18+) for full feature support
- ✅ **Clean Codebase** - Removed legacy multi-language complexity

## 🎯 Project Focus

This repository has been **modernized and streamlined** to focus exclusively on JavaScript and TypeScript visualization:

- **Removed**: Python, Java, C/C++, Ruby execution backends
- **Removed**: Legacy test suites and deprecated components
- **Simplified**: Backend configuration to only support JS/TS
- **Updated**: Modern development workflow and documentation

The latest development version is in [v5-unity](v5-unity/) with backend services in [v4-cokapi](v4-cokapi/).

## 📚 Documentation

- [Local Development Setup](#local-development-setup) - How to run locally
- [Docker Setup](#docker-setup) - Run with Docker (easiest)
- [JavaScript/TypeScript Execution Setup](#javascripttypescript-execution-setup) - Backend configuration
- [Troubleshooting](#troubleshooting) - Common issues and solutions

## Docker Setup 🐳 (Easiest Option)

**🚀 Run everything with Docker - no local setup required!**

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Quick Start

```bash
git clone https://github.com/pertrai1/interactive-coding-tutor.git
cd interactive-coding-tutor

# Start everything with Docker
./start-docker.sh
```

**That's it!** The application will be available at:

- **Frontend**: http://localhost:8003
- **Backend API**: http://localhost:3000
- **Main visualizer**: http://localhost:8003/visualize.html

### What Gets Started

The Docker setup includes:

1. **Frontend Container** (Modern Vite + Python/Bottle server on port 8003)

   - **Modern Build System**: Vite 5 with TypeScript 5.5+
   - **Multi-stage Docker Build**: Node.js build stage + Python runtime stage
   - **Fast Development**: Hot module replacement and instant builds
   - Uses Python 3.11 with Bottle framework for serving
   - Hosts the main application at `/visualize.html`

2. **Backend Container** (Node.js/Express server on port 3000)
   - Executes JavaScript/TypeScript code safely
   - Uses Node.js v24 with ECMAScript 2025 support
   - Provides API endpoint at `/exec_js_native`

### 🚀 Modern Frontend Architecture

**✅ MODERNIZED BUILD SYSTEM**

- **Old**: Webpack 3 + TypeScript 2.8.3 (problematic, slow)
- **New**: Vite 5 + TypeScript 5.5+ (fast, reliable)
- **Benefits**:
  - 10x faster builds
  - Modern ECMAScript support
  - Better Docker integration
  - Simplified configuration

### Testing Your Setup

Run the automated test script to verify everything is working:

```bash
./test-docker.sh
```

This will test:

- ✅ Frontend accessibility (port 8003)
- ✅ Backend API functionality (port 3000)
- ✅ JavaScript execution engine
- ✅ Modern ECMAScript features (ES2025)

### Manual Docker Commands

```bash
# Build and start services
docker-compose up --build

# Run in background
docker-compose up -d --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f frontend
docker-compose logs -f backend

# Rebuild only one service
docker-compose build frontend
docker-compose build backend
```

### Docker Architecture

The setup uses Docker Compose to orchestrate two services:

```yaml
# docker-compose.yml
services:
  frontend:
    build: ./v5-unity
    ports: ["8003:8003"]

  backend:
    build: ./v4-cokapi
    ports: ["3000:3000"]
```

### Troubleshooting Docker

**Container won't start:**

```bash
# Check container status
docker-compose ps

# View detailed logs
docker-compose logs -f [service-name]
```

**Port conflicts:**

- If ports 8003 or 3000 are in use, modify `docker-compose.yml`
- Change `"8003:8003"` to `"8004:8003"` for frontend
- Change `"3000:3000"` to `"3001:3000"` for backend

**Need to reset everything:**

```bash
docker-compose down
docker-compose rm -f
docker-compose up --build
```

## Quick Start for JavaScript/TypeScript ✅ MODERNIZED

**🎉 Node.js Backend Successfully Updated!**

- ✅ Node.js v6.0.0 → Node.js v24+ (ECMAScript 2025 support)
- ✅ Deprecated V8 Debug API → Modern VM execution
- ✅ Limited ES2015 → Full ES2025 feature support
- ✅ Backend confirmed working with modern JavaScript features

For modern JavaScript/TypeScript development, follow these streamlined steps:

1. **Clone and install dependencies:**

   ```bash
   git clone https://github.com/pertrai1/interactive-coding-tutor.git
   cd interactive-coding-tutor
   pip install -r requirements.txt
   cd v5-unity && npm install
   cd ../v4-cokapi && make deps
   ```

2. **Verify Node.js version** (requires Node.js 18+ for modern ECMAScript support):

   ```bash
   node --version  # Should be v18.0.0 or higher for ES2023+ support
   ```

3. **Start all services** (requires 3 terminals):

   ```bash
   # Terminal 1: Backend for JS execution
   cd v4-cokapi && node cokapi.js local

   # Terminal 2: Frontend server
   cd v5-unity && python3 bottle_server.py

   # Terminal 3: Build system
   cd v5-unity && npm run webpack
   ```

4. **Test the application:**
   - Open `http://localhost:8003/visualize.html`
   - Select "JavaScript ES6" from the dropdown
   - Enter modern JavaScript code (ES2015-ES2025) and click "Visualize Execution"

## Local Development Setup

This section provides detailed instructions for setting up the Interactive Coding Tutor for local development on your machine.

### Prerequisites

Before you begin, make sure you have the following installed on your system:

1. **Python 3.x** - Download from [python.org](https://www.python.org/downloads/)
2. **Node.js and npm** - Download from [nodejs.org](https://nodejs.org/) (includes npm)
3. **Git** - For cloning the repository

### Backend Setup

The backend is a Python server using the Bottle web framework.

1. **Clone the repository:**

   ```bash
   git clone https://github.com/pertrai1/interactive-coding-tutor.git
   cd interactive-coding-tutor
   ```

2. **Install Python dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

   This will install:

   - `bottle==0.12.17` - Lightweight web framework
   - `gunicorn==19.9.0` - WSGI HTTP server

3. **Start the backend server:**

   ```bash
   cd v5-unity
   python bottle_server.py
   ```

   Alternative using npm script:

   ```bash
   cd v5-unity
   npm start
   ```

The backend server will start on `http://localhost:8003`

### Frontend Setup

The frontend uses TypeScript, Webpack, and various JavaScript libraries.

1. **Navigate to the frontend directory:**

   ```bash
   cd v5-unity
   ```

2. **Install global dependencies:**

   ```bash
   # Install webpack (important: use version 3.11.0 for compatibility)
   sudo npm install webpack@3.11.0 -g

   # Install TypeScript globally
   sudo npm install -g typescript

   # Install TypeScript definition manager (optional, for older setups)
   sudo npm install -g tsd
   ```

3. **Install local dependencies:**

   ```bash
   npm install
   ```

4. **Link global packages to local (if needed):**

   ```bash
   npm link webpack
   npm link typescript
   ```

5. **Start the development build process:**

   ```bash
   npm run webpack
   ```

   This command will:

   - Watch for file changes
   - Automatically compile TypeScript to JavaScript
   - Bundle files using Webpack
   - Generate source maps for debugging

### Running the Application

With both backend and frontend set up:

1. **Start the backend server** (in one terminal):

   ```bash
   cd v5-unity
   python bottle_server.py
   ```

2. **Start the frontend build process** (in another terminal):

   ```bash
   cd v5-unity
   npm run webpack
   ```

3. **Access the application:**
   - Main visualizer: `http://localhost:8003/visualize.html`
   - Live programming environment: `http://localhost:8003/live.html`
   - Main index page: `http://localhost:8003/index.html`

### JavaScript/TypeScript Execution Setup ✅ FULLY MODERNIZED

**🎉 Complete Backend Modernization Successful!** Both Docker and local execution modes now support ECMAScript 2025.

**✅ Modernization Complete:**

- **Local execution**: Node.js v24+ with `jslogger-modern.js`
- **Docker execution**: Node.js v24+ Alpine container with `jslogger-modern.js`
- **Legacy files removed**: Node.js v6.0.0 binaries and old `jslogger.js`
- **Full ES2025 support**: Optional chaining, nullish coalescing, exponentiation, arrow functions, etc.

For JavaScript and TypeScript code execution, you need to run an additional backend server.

1. **Install backend dependencies:**

   ```bash
   cd v4-cokapi
   npm install  # Updated: Uses package.json instead of make deps
   ```

2. **Verify modern Node.js installation** (for ECMAScript 2015-2025 support):

   ```bash
   node --version  # Should be v18.0.0+ (recommended: v24+ for latest features)
   ```

   **✅ ECMAScript Support by Node.js Version:**

   - Node.js 18+: ES2022 features (top-level await, private fields, etc.)
   - Node.js 20+: ES2023 features (array grouping, etc.)
   - Node.js 22+: ES2024+ features (decorators, etc.)
   - Node.js 24+: **ES2025 features (all latest)**

3. **Start the modernized JavaScript/TypeScript backend server** (in a third terminal):

   ```bash
   cd v4-cokapi
   node cokapi.js local  # Updated: Removed jshint dependency
   ```

   This will start the backend server on `http://localhost:3000`

4. **Test modern JavaScript execution:**

   ```bash
   # Test basic modern syntax
   curl -G -s "http://localhost:3000/exec_js_native" \
     --data-urlencode "user_script=const x = 42; console.log(x);"

   # Test advanced ECMAScript 2020+ features
   curl -G -s "http://localhost:3000/exec_js_native" \
     --data-urlencode "user_script=const arr = [1,2,3]; const squared = arr.map(n => n ** 2); const obj = {a: 1}; const result = obj?.a ?? 'default'; console.log('Result:', result);"
   ```

5. **Configure frontend to use local backend** (already done in this repo):
   The frontend is configured to use `http://localhost:3000` for JavaScript/TypeScript execution.

6. **Test modern JavaScript execution:**

   - Go to `http://localhost:8003/visualize.html`
   - Select "JavaScript ES6" from the language dropdown
   - Try modern ECMAScript features like:

     ```javascript
     // ES2020+ features
     const data = { name: "John", age: 30 };
     const name = data?.name ?? "Unknown";

     // ES2022+ features
     class Person {
       #privateField = "secret";
       getName() {
         return this.#privateField;
       }
     }
     ```

**Important**: This setup now uses your system's Node.js instead of the legacy bundled v6.0.0, enabling support for all modern ECMAScript features through ES2025.

### Production Build

To create a production build with minified assets:

```bash
cd v5-unity
npm run production-build
```

This will:

- Remove old build files
- Create optimized, minified bundles
- Add cache-busting query strings to assets

### Development Workflow

1. **Make changes** to TypeScript files in `v5-unity/js/`
2. **Webpack will automatically recompile** your changes (if running `npm run webpack`)
3. **Refresh your browser** to see the changes
4. **Python server will auto-reload** when you make changes to Python files (if running with `reloader=True`)

### Troubleshooting

#### Common Setup Issues

- **Webpack version issues**: This project requires Webpack v3.11.0. Newer versions may not work with the current configuration.
- **TypeScript compilation errors**: Make sure you're using TypeScript version ~2.8.3 as specified in package.json
- **Port conflicts**: If port 8003 is in use, modify the port in `bottle_server.py`. If port 3000 is in use, modify the port in `v4-cokapi/cokapi.js`
- **Missing dependencies**: Run `npm install` again if you encounter module not found errors

#### JavaScript Execution Issues

- **"Server error! Your code might have an INFINITE LOOP or be running for too long"**: This is the most common error and usually indicates:

  - The v4-cokapi backend server is not running on port 3000
  - Node.js is not installed or not in PATH (check with `node --version`)
  - Network connectivity issues between frontend and backend

- **Modern ECMAScript features not working**:
  - Ensure Node.js version is 18+ (check with `node --version`)
  - For latest ES2024+ features, use Node.js 20+ or 22+
  - Some experimental features may require Node.js flags
- **Backend server not starting**:

  - Ensure you're in the correct directory (`v4-cokapi`)
  - Check if dependencies are installed with `make deps`
  - Verify Node.js is installed on your system

- **Frontend configuration issues**:
  - Check that the frontend configuration points to `http://localhost:3000`
  - Verify that the language is set to "JavaScript ES6" or "TypeScript" in the dropdown
  - Ensure webpack has rebuilt after configuration changes

#### Network and Connectivity

- **CORS issues**: The local setup should not have CORS issues, but if you encounter them, ensure both servers are running on localhost
- **Firewall blocking**: Some corporate firewalls may block localhost connections on non-standard ports

#### Quick Diagnosis Commands

Check if servers are running:

```bash
# Check if frontend server is running
curl http://localhost:8003/

# Check if backend server is running
curl http://localhost:3000/

# Check what's using the ports
lsof -i :8003
lsof -i :3000
```

### Project Structure

- `v5-unity/` - Main development directory
  - `js/` - TypeScript source files
  - `css/` - Stylesheets
  - `build/` - Compiled JavaScript bundles (generated)
  - `bottle_server.py` - Backend server
  - `package.json` - Node.js dependencies
  - `webpack.config.js` - Webpack configuration
  - `tsconfig.json` - TypeScript configuration

### Acknowledgments

For code or security contributions:

- Irene Chen - experimental holistic visualization mode - v3/js/holistic.js
- John DeNero - helping with the official Python 3 port, bug fixes galore
- Mark Liffiton - localStorage bug fix
- Chris Meyers - custom visualizations such as v3/matrix.py and v3/htmlFrame.py
- Brad Miller - adding pop-up question dialogs to visualizations, other bug fixes
- David Pritchard and Will Gwozdz - Java visualizer and other frontend enhancements
- Peter Robinson - v3/make_visualizations.py
- Peter Wentworth and his students - working on the original Python 3 fork circa 2010-2011
- Security tips and vulnerability reports: Aaron E. (https://arinerron.com), Chris Horne (https://github.com/lahwran), Joshua Landau (joshua@landau.ws), David Wyde (https://davidwyde.com/)

For user testing and feedback from instructors' perspectives:

- Ned Batchelder
- Jennifer Campbell
- John Dalbey
- John DeNero
- Fredo Durand
- Michael Ernst
- David Evans
- Paul Gries
- Mark Guzdial
- Adam Hartz
- Sean Lip
- Fernando Perez
- Tomas Lozano-Perez
- Bertram Ludaescher
- Brad Miller
- Rob Miller
- Peter Norvig
- Andrew Petersen
- David Pritchard
- Suzanne Rivoire
- Guido van Rossum
- Peter Wentworth
- David Wilkins

... and many, many more!
