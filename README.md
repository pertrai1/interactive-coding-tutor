# Interactive JavaScript/TypeScript Code Tutor

**Visualize JavaScript and TypeScript code execution step-by-step in your browser**

Originally based on [Python Tutor](http://pythontutor.com/) by [Philip Guo](http://pgbovine.net/), this fork has been modernized to focus specifically on JavaScript and TypeScript visualization for modern web development education.

## 🚀 Key Features

- ✅ **JavaScript ES6+ support** - Visualize modern JavaScript code execution
- ✅ **TypeScript support** - Full TypeScript code execution and visualization
- ✅ **Modern build system** - Webpack + TypeScript development workflow
- ✅ **Simplified setup** - Streamlined local development environment
- ✅ **Clean codebase** - Removed legacy multi-language complexity

## 🎯 Project Focus

This repository has been **modernized and streamlined** to focus exclusively on JavaScript and TypeScript visualization:

- **Removed**: Python, Java, C/C++, Ruby execution backends
- **Removed**: Legacy test suites and deprecated components
- **Simplified**: Backend configuration to only support JS/TS
- **Updated**: Modern development workflow and documentation

The latest development version is in [v5-unity](v5-unity/) with backend services in [v4-cokapi](v4-cokapi/).

## 📚 Documentation

- [Local Development Setup](#local-development-setup) - How to run locally
- [JavaScript/TypeScript Execution Setup](#javascripttypescript-execution-setup) - Backend configuration
- [Troubleshooting](#troubleshooting) - Common issues and solutions

## Quick Start for JavaScript/TypeScript

For modern JavaScript/TypeScript development, follow these streamlined steps:

1. **Clone and install dependencies:**

   ```bash
   git clone https://github.com/pertrai1/interactive-coding-tutor.git
   cd interactive-coding-tutor
   pip install -r requirements.txt
   cd v5-unity && npm install
   cd ../v4-cokapi && make deps
   ```

2. **Extract Node.js binary:**

   ```bash
   cd backends/javascript
   tar -xzf node-v6.0.0-darwin-x64.tar.gz  # macOS
   # tar -xf node-v6.0.0-linux-x64.tar.xz  # Linux
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
   - Enter JavaScript code and click "Visualize Execution"

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

### JavaScript/TypeScript Execution Setup

For JavaScript and TypeScript code execution, you need to run an additional backend server:

1. **Install backend dependencies:**

   ```bash
   cd v4-cokapi
   make deps
   ```

2. **Extract Node.js binary for native execution:**

   ```bash
   cd v4-cokapi/backends/javascript
   tar -xzf node-v6.0.0-darwin-x64.tar.gz
   ```

   **Note**: On Linux, use `tar -xf node-v6.0.0-linux-x64.tar.xz` instead.

3. **Start the JavaScript/TypeScript backend server** (in a third terminal):

   ```bash
   cd v4-cokapi
   jshint cokapi.js && node cokapi.js local
   ```

   This will start the backend server on `http://localhost:3000`

4. **Configure frontend to use local backend** (already done in this repo):
   The frontend is configured to use `http://localhost:3000` for JavaScript/TypeScript execution.

5. **Test JavaScript execution:**
   - Go to `http://localhost:8003/visualize.html`
   - Select "JavaScript ES6" from the language dropdown
   - Enter some JavaScript code and click "Visualize Execution"

**Important**: This setup uses native Node.js execution instead of Docker containers for simplicity in local development. The v4-cokapi backend supports both Docker-based and native execution modes.

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
  - The Node.js binary was not extracted (see step 2 in JavaScript setup)
  - Network connectivity issues between frontend and backend
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
