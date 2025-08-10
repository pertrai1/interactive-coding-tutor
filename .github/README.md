# GitHub Actions Workflows

This directory contains automated workflows for the Interactive JavaScript/TypeScript Code Tutor project.

## 🚀 Workflow Overview

### Pull Request Workflows

#### 1. **PR Checks** (`pr-checks.yml`)

**Triggered**: On every pull request and push to main/master

**What it does**:

- ✅ **Frontend Build & Type Check** - TypeScript compilation and Vite build
- ✅ **Backend Build & Lint** - Node.js syntax check and startup test
- ✅ **Python Server Checks** - Python syntax and import validation
- ✅ **Docker Build Test** - Validates both frontend and backend Docker images
- ✅ **Security & Dependency Scan** - npm audit and Python safety checks
- ✅ **Code Quality Checks** - File size, TODO/FIXME detection, hardcoded secrets
- ✅ **Integration Test** - Full docker-compose stack test

#### 2. **Code Quality** (`code-quality.yml`)

**Triggered**: On every pull request and push to main/master

**What it does**:

- 🔍 **ESLint Check** - Linting for TypeScript and JavaScript files
- 💅 **Prettier Check** - Code formatting validation
- 📦 **Dependency Analysis** - Outdated and unused dependency detection

#### 3. **Performance & Bundle Analysis** (`performance.yml`)

**Triggered**: On pull requests

**What it does**:

- 📊 **Bundle Size Analysis** - Frontend build size monitoring
- 🚀 **Lighthouse Audit** - Performance, accessibility, SEO checks
- 🧠 **Memory Leak Detection** - Basic Node.js memory monitoring

#### 4. **Security Scan** (`security.yml`)

**Triggered**: On PRs, pushes, and weekly schedule

**What it does**:

- 🔐 **Secret Detection** - TruffleHog secret scanning
- 🛡️ **Vulnerability Assessment** - npm audit, Python safety, Bandit analysis
- 🐳 **Docker Security Scan** - Trivy container vulnerability scanning
- ⚖️ **License Compliance** - Dependency license checking

#### 5. **PR Automation** (`pr-automation.yml`)

**Triggered**: On PR events

**What it does**:

- 🤖 **Auto-merge Dependabot PRs** - Automatic dependency updates
- 🏷️ **Auto-labeling** - Labels PRs based on changed files
- 📏 **PR Size Check** - Warns about large PRs
- 📝 **Conventional Commits** - Validates commit message format

## 🏷️ Automatic Labels

The workflows automatically apply labels based on file changes:

- **`frontend`** - Changes to `v5-unity/` directory
- **`backend`** - Changes to `v4-cokapi/` directory
- **`python`** - Changes to `.py` files or Python configs
- **`docker`** - Changes to Dockerfiles or docker-compose
- **`documentation`** - Changes to `.md` files
- **`dependencies`** - Changes to package.json or requirements.txt
- **`tests`** - Changes to test files
- **`typescript`** - Changes to `.ts` files
- **`javascript`** - Changes to `.js` files
- **`security`** - Security-related changes
- **`performance`** - Performance-related changes
- **`ci-cd`** - Changes to GitHub Actions workflows

## 🔧 Configuration

### Required Secrets

No additional secrets are required - all workflows use the default `GITHUB_TOKEN`.

### Dependabot Auto-merge

Dependabot PRs are automatically merged if:

- They pass all status checks
- They have the `dependencies` label
- They are not draft PRs

### Conventional Commits

The system checks for conventional commit format:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Maintenance tasks
- `ci:` - CI/CD changes
- `perf:` - Performance improvements
- `build:` - Build system changes
- `revert:` - Reverts previous commits

## 📊 What Gets Checked

### ✅ Build & Compilation

- TypeScript type checking (`tsc --noEmit`)
- Vite frontend build (`npm run build`)
- Node.js syntax validation
- Python syntax checking
- Docker image builds

### 🔍 Code Quality

- ESLint for TypeScript/JavaScript
- Prettier formatting
- Large file detection
- TODO/FIXME tracking
- Console.log detection

### 🛡️ Security

- Secret detection with TruffleHog
- npm vulnerability scanning
- Python security analysis with Safety and Bandit
- Docker container vulnerability scanning with Trivy
- License compliance checking

### 🚀 Performance

- Bundle size analysis
- Lighthouse performance audits
- Memory leak detection
- Large asset warnings

### 🐳 Docker

- Multi-stage Docker builds
- Container security scanning
- Full stack integration testing
- Docker-compose validation

## 🚨 Status Checks

All workflows are configured as status checks that must pass before merging:

1. **Required Checks** (blocking):

   - Frontend Build & Type Check
   - Backend Build & Lint
   - Python Server Checks
   - Docker Build Test
   - Integration Test

2. **Advisory Checks** (non-blocking):
   - Code Quality (warnings only)
   - Performance Analysis
   - Security Scans
   - Dependency Analysis

## 🔄 Workflow Triggers

- **Pull Requests**: All workflows run on PR creation and updates
- **Push to main/master**: Core workflows run on direct pushes
- **Weekly Schedule**: Security scans run automatically on Sundays
- **Manual Dispatch**: Some workflows can be triggered manually

## 📈 Monitoring & Reports

Workflows generate various reports and artifacts:

- Build artifacts (retained for 7 days)
- Security scan results (retained for 30 days)
- License compliance reports
- Bundle size analysis
- Performance audit results

These are available in the Actions tab of the GitHub repository.

## 🛠️ Customization

To modify workflow behavior:

1. **Add new checks**: Create additional job steps in existing workflows
2. **Modify thresholds**: Update warning/error thresholds in workflow files
3. **Add labels**: Update `.github/labeler.yml` with new label rules
4. **Change triggers**: Modify `on:` conditions in workflow files
5. **Add secrets**: Configure in repository settings if needed

## 🚀 Best Practices

- Keep PR sizes reasonable (< 500 lines changed)
- Use conventional commit messages
- Address security warnings promptly
- Monitor bundle size growth
- Review dependency updates regularly
- Run tests locally before pushing
