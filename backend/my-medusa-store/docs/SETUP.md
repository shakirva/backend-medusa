# Development Setup Instructions

## Prerequisites Installation

### 1. Install Node.js (Required)
1. Visit [Node.js official website](https://nodejs.org/)
2. Download and install Node.js 18+ LTS version
3. Verify installation: `node --version` and `npm --version`

### 2. Install PostgreSQL (Required)
1. Visit [PostgreSQL official website](https://www.postgresql.org/download/windows/)
2. Download and install PostgreSQL 14+
3. During installation, set password for 'postgres' user
4. Verify installation: `psql --version`

### 3. Install Git (Required)
1. Visit [Git official website](https://git-scm.com/download/win)
2. Download and install Git for Windows
3. Verify installation: `git --version`

### 4. Install VS Code (Recommended)
1. Visit [VS Code official website](https://code.visualstudio.com/)
2. Download and install VS Code
3. Install recommended extensions:
   - ES7+ React/Redux/React-Native snippets
   - Prettier - Code formatter
   - GitLens
   - Thunder Client (for API testing)

## Project Setup

### Step 1: Environment Verification
Run the setup script to verify your environment:
```powershell
cd v-2-medusa-ecommo
.\scripts\setup-environment.ps1
```

### Step 2: Database Setup
1. Open Command Prompt or PowerShell as Administrator
2. Create PostgreSQL user and database:
```sql
# Connect to PostgreSQL
psql -U postgres

# Create user
CREATE USER marqa_user WITH PASSWORD 'marqa123';

# Create database
CREATE DATABASE marqa_souq_v2 OWNER marqa_user;

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE marqa_souq_v2 TO marqa_user;

# Exit PostgreSQL
\q
```

### Step 3: Initialize MedusaJS Backend
```powershell
# Navigate to backend directory
cd backend

# Create MedusaJS application
npx create-medusa-app@latest . --db-url "postgres://marqa_user:marqa123@localhost:5432/marqa_souq_v2"

# Install additional dependencies
npm install @medusajs/admin medusa-payment-stripe redis
```

### Step 4: Initialize Next.js Frontend
```powershell
# Navigate to frontend directory
cd ../frontend

# Create Next.js application
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install MedusaJS SDK and additional packages
npm install @medusajs/medusa-js axios react-query react-hook-form @headlessui/react @heroicons/react
```

### Step 5: Environment Configuration

#### Backend Environment (.env)
Create `backend/.env`:
```env
DATABASE_URL=postgres://marqa_user:marqa123@localhost:5432/marqa_souq_v2
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-here
COOKIE_SECRET=your-cookie-secret-here
STRIPE_API_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
ADMIN_CORS=http://localhost:7001
STORE_CORS=http://localhost:3000
```

#### Frontend Environment (.env.local)
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

### Step 6: Start Development Servers

#### Terminal 1 - Backend
```powershell
cd backend
npm run dev
```

#### Terminal 2 - Frontend
```powershell
cd frontend
npm run dev
```

#### Terminal 3 - Admin Dashboard (Optional)
```powershell
cd backend
npx @medusajs/admin dev
```

## Access URLs
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:9000
- **Admin Dashboard:** http://localhost:7001

## Troubleshooting

### Common Issues

#### PostgreSQL Connection Issues
1. Ensure PostgreSQL service is running
2. Check username/password in DATABASE_URL
3. Verify database exists: `psql -U marqa_user -d marqa_souq_v2`

#### Port Already in Use
1. Check if other applications are using ports 3000, 9000, or 7001
2. Kill processes: `netstat -ano | findstr :3000`
3. Use different ports if needed

#### Node.js Version Issues
1. Use Node Version Manager (nvm) for Windows
2. Install and use Node.js 18+: `nvm install 18` then `nvm use 18`

#### Permission Issues
1. Run PowerShell as Administrator
2. Enable script execution: `Set-ExecutionPolicy RemoteSigned`

## Next Steps
Once setup is complete, follow the daily tasks in `PROJECT_PLAN.md` starting with Day 1 activities.