# Final Infisical Environment Setup

This document shows the exact environment variables needed for your Shopping List application with Infisical secrets management.

## 🎯 **Your Configuration Summary**

- **Infisical Region**: EU (eu.infisical.com)
- **Project ID**: `d758ed7c-5411-42a0-aebb-4f301c7a4199`
- **Environments**: `Development`, `Staging`, `Production` (capitalized)
- **Folder Structure**: `/backend` and `/frontend`
- **Token Strategy**: One token per environment per component (4 tokens total)

## 🔑 **Required Environment Variables**

### **For Development (Local)**

**Backend Development**:
```bash
# Infisical Configuration
INFISICAL_TOKEN=your_dev_backend_token_here
INFISICAL_PROJECT_ID=d758ed7c-5411-42a0-aebb-4f301c7a4199
INFISICAL_ENV=Development
INFISICAL_SITE_URL=https://eu.infisical.com

# Non-secret config (still needed)
NODE_ENV=development
DB_HOST=postgres
DB_DATABASE=shopping_list
```

**Frontend Development**:
```bash
# Infisical Configuration  
VITE_INFISICAL_TOKEN=your_dev_frontend_token_here
VITE_INFISICAL_PROJECT_ID=d758ed7c-5411-42a0-aebb-4f301c7a4199
VITE_INFISICAL_ENV=Development
VITE_INFISICAL_SITE_URL=https://eu.infisical.com
```

### **For Production (Synology)**

**Backend Production**:
```bash
# Infisical Configuration
INFISICAL_TOKEN=your_prod_backend_token_here
INFISICAL_PROJECT_ID=d758ed7c-5411-42a0-aebb-4f301c7a4199
INFISICAL_ENV=Production
INFISICAL_SITE_URL=https://eu.infisical.com

# Non-secret config
NODE_ENV=production
DB_HOST=postgres
DB_DATABASE=shopping_list
```

**Frontend Production**:
```bash
# Infisical Configuration
VITE_INFISICAL_TOKEN=your_prod_frontend_token_here
VITE_INFISICAL_PROJECT_ID=d758ed7c-5411-42a0-aebb-4f301c7a4199
VITE_INFISICAL_ENV=Production
VITE_INFISICAL_SITE_URL=https://eu.infisical.com
```

## 🚀 **Implementation Steps**

### **1. Retrieve Your Tokens**

From your secure storage (Keychain, 1Password, etc.), get:
- Development Backend Token (scoped to `/backend`)
- Development Frontend Token (scoped to `/frontend`)  
- Production Backend Token (scoped to `/backend`)
- Production Frontend Token (scoped to `/frontend`)

### **2. Local Development Setup**

Create `.env.local` files (ignored by Git):

**Backend** (`/Users/pete/Projects/shopping-list-backend/.env.local`):
```bash
INFISICAL_TOKEN=your_dev_backend_token_here
INFISICAL_PROJECT_ID=d758ed7c-5411-42a0-aebb-4f301c7a4199
INFISICAL_ENV=Development
INFISICAL_SITE_URL=https://eu.infisical.com
```

**Frontend** (`/Users/pete/Projects/shopping-list-frontend/.env.local`):
```bash
VITE_INFISICAL_TOKEN=your_dev_frontend_token_here
VITE_INFISICAL_PROJECT_ID=d758ed7c-5411-42a0-aebb-4f301c7a4199
VITE_INFISICAL_ENV=Development
VITE_INFISICAL_SITE_URL=https://eu.infisical.com
```

### **3. Synology Production Setup**

**Option A: Container Manager Environment Variables**
Set these in Container Manager's environment variable section for each container.

**Option B: .env File on Synology**
Create `/volume1/docker/shopping-list/.env`:
```bash
# Backend Production Token
INFISICAL_TOKEN=your_prod_backend_token_here
INFISICAL_PROJECT_ID=d758ed7c-5411-42a0-aebb-4f301c7a4199
INFISICAL_ENV=Production
INFISICAL_SITE_URL=https://eu.infisical.com

# Frontend Production Token  
VITE_INFISICAL_TOKEN=your_prod_frontend_token_here
VITE_INFISICAL_PROJECT_ID=d758ed7c-5411-42a0-aebb-4f301c7a4199
VITE_INFISICAL_ENV=Production
VITE_INFISICAL_SITE_URL=https://eu.infisical.com
```

Then reference it in your `docker-compose.yml`:
```yaml
services:
  app:
    env_file:
      - .env
    # ... rest of config

  frontend:  # if running containerized frontend
    env_file:
      - .env
    # ... rest of config
```

## 🧪 **Testing the Setup**

### **Test Backend Secrets**:
```bash
# Using your dev backend token
infisical secrets --token=your_dev_backend_token \
  --projectId=d758ed7c-5411-42a0-aebb-4f301c7a4199 \
  --env=Development \
  --domain=https://eu.infisical.com/api \
  --path=/backend
```

### **Test Frontend Secrets**:
```bash
# Using your dev frontend token  
infisical secrets --token=your_dev_frontend_token \
  --projectId=d758ed7c-5411-42a0-aebb-4f301c7a4199 \
  --env=Development \
  --domain=https://eu.infisical.com/api \
  --path=/frontend
```

## 📋 **Secrets in Infisical Dashboard**

Make sure you have these secrets configured:

### **Development Environment - /backend folder**:
```
AUTH_ENABLED = true
DB_DATABASE = shopping_list
DB_HOST = postgres
DB_PASSWORD = dev_password_secure_123
DB_PORT = 5432
DB_USERNAME = postgres
JWT_EXPIRES_IN = 24h
JWT_SECRET = dev-jwt-secret-key-not-for-production
NODE_ENV = development
PORT = 3000
```

### **Development Environment - /frontend folder**:
```
VITE_API_URL = http://localhost:3000
VITE_USE_MOCK_API = false
```

### **Production Environment - /backend folder**:
```
AUTH_ENABLED = true
DB_DATABASE = shopping_list
DB_HOST = postgres
DB_PASSWORD = your_super_secure_production_password_here
DB_PORT = 5432
DB_USERNAME = postgres
JWT_EXPIRES_IN = 24h
JWT_SECRET = your-super-secret-jwt-key-change-in-production-12345-SECURE
NODE_ENV = production
PORT = 3000
```

### **Production Environment - /frontend folder**:
```
VITE_API_URL = https://your-production-api-domain.com
VITE_USE_MOCK_API = false
```

## 🔄 **Fallback Behavior**

Your applications are configured to gracefully fallback to environment variables if Infisical is unavailable:

1. **Development**: Uses Infisical if configured, otherwise falls back to `.env` files
2. **Production**: Requires Infisical, will error if tokens are missing
3. **Both**: Log warnings when falling back to environment variables

## 🎯 **Next Steps**

1. **Install Infisical SDK** in both projects:
   ```bash
   # Backend
   npm install @infisical/sdk
   
   # Frontend  
   npm install @infisical/sdk
   ```

2. **Set up environment variables** as shown above

3. **Add the InfisicalConfigService** to your app modules

4. **Test locally** with Development environment

5. **Deploy to Synology** with Production environment

Your Infisical setup is now fully configured for both EU region and your folder structure! 🎉
