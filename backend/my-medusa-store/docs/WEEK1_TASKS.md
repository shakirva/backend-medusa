# Week 1 Daily Tasks - Step by Step Implementation

## Day 1: Environment Setup & Verification

### Morning Tasks (2-3 hours)

#### Task 1.1: Install Prerequisites
```powershell
# Download and install Node.js 18+ from nodejs.org
# Verify installation
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

#### Task 1.2: Install PostgreSQL
```powershell
# Download from postgresql.org/download/windows/
# During installation, remember the postgres user password
# Verify installation
psql --version  # Should show PostgreSQL 14.x or higher
```

#### Task 1.3: Install Git and VS Code
```powershell
# Install Git from git-scm.com
# Install VS Code from code.visualstudio.com
# Verify Git installation
git --version
```

### Afternoon Tasks (2 hours)

#### Task 1.4: Run Environment Check
```powershell
# Navigate to your project directory
cd "C:\Users\dulki\Desktop\v-2-medusa-ecommo"

# Run the setup script
.\scripts\setup-environment.ps1
```

#### Task 1.5: Configure VS Code Extensions
Install these essential extensions:
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- GitLens — Git supercharged
- Thunder Client (for API testing)
- PostgreSQL (for database management)

---

## Day 2: Database Setup & Git Initialization

### Morning Tasks (2 hours)

#### Task 2.1: Setup PostgreSQL Database
```powershell
# Open Command Prompt as Administrator
# Connect to PostgreSQL
psql -U postgres

# Create database user
CREATE USER marqa_user WITH PASSWORD 'marqa123';

# Create database
CREATE DATABASE marqa_souq_v2 OWNER marqa_user;

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE marqa_souq_v2 TO marqa_user;
ALTER USER marqa_user CREATEDB;

# Exit PostgreSQL
\q
```

#### Task 2.2: Test Database Connection
```powershell
# Test connection with new user
psql -U marqa_user -d marqa_souq_v2 -h localhost

# If successful, you should see the database prompt
marqa_souq_v2=>

# Exit
\q
```

### Afternoon Tasks (1-2 hours)

#### Task 2.3: Initialize Git Repository
```powershell
# Navigate to project root
cd "C:\Users\dulki\Desktop\v-2-medusa-ecommo"

# Initialize Git
git init

# Add all files
git add .

# Make initial commit
git commit -m "Initial project structure and documentation"

# Set up remote repository (optional - replace with your GitHub repo)
# git remote add origin https://github.com/yourusername/marqa-souq-ecommerce.git
# git push -u origin main
```

---

## Day 3: MedusaJS Backend Initialization

### Morning Tasks (3 hours)

#### Task 3.1: Create MedusaJS Project
```powershell
# Navigate to backend directory
cd backend

# Create MedusaJS application
npx create-medusa-app@latest . --db-url "postgres://marqa_user:marqa123@localhost:5432/marqa_souq_v2"

# This will take 5-10 minutes to complete
# Answer prompts:
# - Skip creating admin user for now
# - Choose default options
```

#### Task 3.2: Install Additional Dependencies
```powershell
# Install required plugins
npm install @medusajs/admin medusa-payment-stripe redis

# Install development dependencies
npm install --save-dev @types/node typescript ts-node nodemon
```

### Afternoon Tasks (2 hours)

#### Task 3.3: Configure Environment Variables
Create `backend/.env` file:
```env
DATABASE_URL=postgres://marqa_user:marqa123@localhost:5432/marqa_souq_v2
REDIS_URL=redis://localhost:6379
JWT_SECRET=supersecretjwttoken123456789
COOKIE_SECRET=supersecretcookietoken123456789
ADMIN_CORS=http://localhost:7001,http://localhost:7000
STORE_CORS=http://localhost:3000
NODE_ENV=development
PORT=9000
```

#### Task 3.4: Test MedusaJS Backend
```powershell
# Start the backend server
npm run dev

# You should see output like:
# Server is ready on port: 9000
# Admin is ready on port: 7001
```

Open browser and test:
- Backend API: http://localhost:9000/store/products
- Admin Dashboard: http://localhost:7001

---

## Day 4: Backend Configuration & Testing

### Morning Tasks (2-3 hours)

#### Task 4.1: Configure MedusaJS Settings
Update `backend/medusa-config.js`:
```javascript
const plugins = [
  `medusa-fulfillment-manual`,
  `medusa-payment-manual`,
  {
    resolve: `@medusajs/admin`,
    options: {
      autoRebuild: true,
      develop: {
        open: process.env.OPEN_BROWSER !== "false",
      },
    },
  },
];

const modules = {};

/** @type {import('@medusajs/medusa').ConfigModule["projectConfig"]} */
const projectConfig = {
  jwt_secret: process.env.JWT_SECRET,
  cookie_secret: process.env.COOKIE_SECRET,
  store_cors: process.env.STORE_CORS,
  database_url: process.env.DATABASE_URL,
  admin_cors: process.env.ADMIN_CORS,
  redis_url: process.env.REDIS_URL,
};

/** @type {import('@medusajs/medusa').ConfigModule} */
module.exports = {
  projectConfig,
  plugins,
  modules,
};
```

#### Task 4.2: Create Admin User
```powershell
# Create admin user
npx medusa user --email admin@marqasouq.com --password admin123456

# Start the server
npm run dev
```

### Afternoon Tasks (2 hours)

#### Task 4.3: Test Admin Dashboard
1. Open http://localhost:7001
2. Login with admin@marqasouq.com / admin123456
3. Explore the dashboard
4. Create a test product category
5. Add a sample product

#### Task 4.4: Test API Endpoints
Use Thunder Client in VS Code or browser:
```
GET http://localhost:9000/store/products
GET http://localhost:9000/store/regions
GET http://localhost:9000/admin/products
```

---

## Day 5: Frontend Project Initialization

### Morning Tasks (2-3 hours)

#### Task 5.1: Create Next.js Project
```powershell
# Navigate to frontend directory
cd ../frontend

# Create Next.js project with all modern features
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Answer prompts:
# - TypeScript: Yes
# - ESLint: Yes
# - Tailwind CSS: Yes
# - src/ directory: Yes
# - App Router: Yes
# - Import alias: Yes (@/*)
```

#### Task 5.2: Install MedusaJS Dependencies
```powershell
# Install core dependencies
npm install @medusajs/medusa-js axios @tanstack/react-query

# Install UI and form libraries
npm install react-hook-form @headlessui/react @heroicons/react

# Install additional utilities
npm install clsx tailwind-merge class-variance-authority lucide-react
```

### Afternoon Tasks (2 hours)

#### Task 5.3: Create Project Structure
```powershell
# Create component directories
mkdir src\components\common
mkdir src\components\product
mkdir src\components\cart
mkdir src\components\auth
mkdir src\lib
mkdir src\hooks
mkdir src\types
mkdir src\utils
```

#### Task 5.4: Setup Basic Configuration
Create `frontend/src/lib/medusa.ts`:
```typescript
import Medusa from "@medusajs/medusa-js"

const medusa = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000",
  maxRetries: 3,
})

export default medusa
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_STORE_NAME=Marqa Souq
```

---

## Day 6: API Integration Setup

### Morning Tasks (3 hours)

#### Task 6.1: Create API Utilities
Create `frontend/src/lib/api.ts`:
```typescript
import medusa from './medusa';

export const api = {
  // Products
  getProducts: () => medusa.products.list(),
  getProduct: (id: string) => medusa.products.retrieve(id),
  
  // Cart
  createCart: () => medusa.carts.create(),
  getCart: (cartId: string) => medusa.carts.retrieve(cartId),
  addToCart: (cartId: string, variant_id: string, quantity: number) =>
    medusa.carts.lineItems.create(cartId, { variant_id, quantity }),
    
  // Auth
  login: (email: string, password: string) =>
    medusa.auth.authenticate({ email, password }),
  register: (customer: any) => medusa.customers.create(customer),
};
```

#### Task 6.2: Setup React Query
Create `frontend/src/lib/query-client.ts`:
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
```

### Afternoon Tasks (2 hours)

#### Task 6.3: Create Custom Hooks
Create `frontend/src/hooks/useProducts.ts`:
```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: api.getProducts,
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => api.getProduct(id),
    enabled: !!id,
  });
};
```

#### Task 6.4: Test API Connection
Create a simple test page `frontend/src/app/test/page.tsx`:
```typescript
'use client';
import { useProducts } from '@/hooks/useProducts';

export default function TestPage() {
  const { data, isLoading, error } = useProducts();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div className="p-4">
      <h1>Products Test</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

---

## Day 7: Basic Layout & Component Structure

### Morning Tasks (3 hours)

#### Task 7.1: Create Layout Components
Create `frontend/src/components/common/Header.tsx`:
```typescript
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Marqa Souq
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link href="/products" className="text-gray-600 hover:text-gray-900">
              Products
            </Link>
            <Link href="/categories" className="text-gray-600 hover:text-gray-900">
              Categories
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-gray-900">
              About
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Link href="/cart" className="text-gray-600 hover:text-gray-900">
              Cart (0)
            </Link>
            <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded">
              Login
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
```

#### Task 7.2: Create Footer Component
Create `frontend/src/components/common/Footer.tsx`:
```typescript
export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Marqa Souq</h3>
            <p className="text-gray-600">Your trusted e-commerce platform for quality products.</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="/products">Products</a></li>
              <li><a href="/categories">Categories</a></li>
              <li><a href="/about">About Us</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Customer Service</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="/contact">Contact Us</a></li>
              <li><a href="/support">Support</a></li>
              <li><a href="/returns">Returns</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Follow Us</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-gray-600">Facebook</a>
              <a href="#" className="text-gray-400 hover:text-gray-600">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-gray-600">Instagram</a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
          © 2024 Marqa Souq. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
```

### Afternoon Tasks (2 hours)

#### Task 7.3: Create Main Layout
Update `frontend/src/app/layout.tsx`:
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Marqa Souq - E-Commerce Platform',
  description: 'Modern e-commerce platform built with MedusaJS and Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

#### Task 7.4: Create Homepage
Update `frontend/src/app/page.tsx`:
```typescript
import Link from 'next/link';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to Marqa Souq
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Discover amazing products at unbeatable prices. Your one-stop shop for everything you need.
            </p>
            <Link 
              href="/products" 
              className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-2xl">🚚</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Shipping</h3>
              <p className="text-gray-600">Get your orders delivered quickly and safely to your doorstep.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-2xl">🛡️</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Payment</h3>
              <p className="text-gray-600">Your transactions are protected with industry-standard security.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 text-2xl">💎</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Products</h3>
              <p className="text-gray-600">Carefully curated products that meet our high quality standards.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
```

#### Task 7.5: Test Everything
```powershell
# Start backend (Terminal 1)
cd backend
npm run dev

# Start frontend (Terminal 2)
cd frontend
npm run dev
```

Visit:
- http://localhost:3000 (Homepage)
- http://localhost:3000/test (API test page)
- http://localhost:9000/store/products (Backend API)
- http://localhost:7001 (Admin Dashboard)

### End of Day 7 Checklist
- [ ] All development servers running
- [ ] Homepage displays correctly
- [ ] API connection working
- [ ] Admin dashboard accessible
- [ ] No console errors
- [ ] Commit all changes to Git

```powershell
# Commit progress
git add .
git commit -m "Week 1 complete: Basic setup and layout implemented"
```

---

## 🎉 Week 1 Completion

**Congratulations!** You've successfully completed Week 1. You now have:

✅ **Working Development Environment**
- Node.js, PostgreSQL, Git, VS Code properly configured
- MedusaJS backend running on port 9000
- Next.js frontend running on port 3000
- Admin dashboard accessible on port 7001

✅ **Project Foundation**
- Professional project structure
- Database configured and connected
- API integration working
- Basic UI components created

✅ **Next Steps Ready**
- Backend API endpoints accessible
- Frontend can communicate with backend
- Admin dashboard for content management
- Git repository with initial commits

**You're now ready to move to Week 2: Core Backend Development!**

Continue with the tasks in `DEVELOPMENT.md` for Week 2 implementation.