# Infisical Service Token Setup Guide

This guide shows you exactly how to set up your Infisical project structure and service tokens for the Shopping List application.

## 🏗️ **Project Structure (Single Project + Environments)**

### **Recommended Setup:**

```
📁 Shopping List (Project)
└── 🔑 Service Tokens:
    ├── st_dev_xxx... (Development Token)
    ├── st_staging_xxx... (Staging Token - optional)
    └── st_prod_xxx... (Production Token)

└── 🌍 Environments:
    ├── development/
    │   ├── /backend/
    │   │   ├── DB_PASSWORD=dev_password_123
    │   │   ├── DB_USERNAME=postgres
    │   │   ├── JWT_SECRET=dev_jwt_secret_at_least_256_bits_long
    │   │   └── JWT_EXPIRES_IN=24h
    │   └── /frontend/
    │       ├── VITE_API_URL=http://localhost:3000
    │       └── VITE_USE_MOCK_API=false
    │
    ├── staging/ (optional)
    │   ├── /backend/
    │   │   ├── DB_PASSWORD=staging_secure_password_456
    │   │   ├── DB_USERNAME=postgres
    │   │   ├── JWT_SECRET=staging_jwt_secret_different_from_dev
    │   │   └── JWT_EXPIRES_IN=24h
    │   └── /frontend/
    │       ├── VITE_API_URL=https://staging-api.yourdomain.com
    │       └── VITE_USE_MOCK_API=false
    │
    └── production/
        ├── /backend/
        │   ├── DB_PASSWORD=super_secure_prod_password_789
        │   ├── DB_USERNAME=postgres
        │   ├── JWT_SECRET=production_jwt_secret_super_secure_512_bits
        │   └── JWT_EXPIRES_IN=24h
        └── /frontend/
            ├── VITE_API_URL=https://api.yourdomain.com
            └── VITE_USE_MOCK_API=false
```

## 🚀 **Step-by-Step Setup**

### **Step 1: Create Infisical Account & Project**

1. **Sign up** at [app.infisical.com](https://app.infisical.com)
2. **Create new project**: "Shopping List"
3. **Note your Project ID** (you'll need this later)

### **Step 2: Create Environments**

1. Go to **Project Settings > Environments**
2. **Create environments:**
   - `development` 
   - `production`
   - `staging` (optional - for future use)

### **Step 3: Add Secrets to Each Environment**

**For Development Environment:**
1. Select **development** environment
2. **Create folder**: `/backend`
3. **Add secrets** in `/backend/`:
   ```
   DB_HOST = postgres
   DB_PORT = 5432
   DB_USERNAME = postgres
   DB_PASSWORD = dev_password_secure_123
   DB_DATABASE = shopping_list
   AUTH_ENABLED = true
   JWT_SECRET = dev-jwt-secret-key-not-for-production
   JWT_EXPIRES_IN = 24h
   PORT = 3000
   NODE_ENV = development
   ```

4. **Create folder**: `/frontend`  
5. **Add secrets** in `/frontend/`:
   ```
   VITE_API_URL = http://localhost:3000
   VITE_USE_MOCK_API = false
   ```

**For Production Environment:**
1. Select **production** environment
2. **Create same folder structure** (`/backend` and `/frontend`)
3. **Add production secrets** (use secure, different values):
   ```
   # /backend/
   DB_HOST = postgres
   DB_PORT = 5432
   DB_USERNAME = postgres
   DB_PASSWORD = your_super_secure_production_password_here
   DB_DATABASE = shopping_list
   AUTH_ENABLED = true
   JWT_SECRET = your-super-secret-jwt-key-change-in-production-12345-SECURE
   JWT_EXPIRES_IN = 24h
   PORT = 3000
   NODE_ENV = production
   
   # /frontend/  
   VITE_API_URL = https://your-production-api-domain.com
   VITE_USE_MOCK_API = false
   ```

### **Step 4: Create Service Tokens**

1. Go to **Project Settings > Service Tokens**
2. **Create Development Token:**
   - Name: `Shopping List Development`
   - Environment: `development`
   - Permissions: Read all secrets
   - Expiration: 1 year (or your preference)
   - **Copy and save** the token: `st_dev_xxx...`

3. **Create Production Token:**
   - Name: `Shopping List Production`  
   - Environment: `production`
   - Permissions: Read all secrets
   - Expiration: 3-6 months (rotate regularly)
   - **Copy and save** the token: `st_prod_xxx...`

## 🔧 **Environment Variable Configuration**

### **For Your Local Development:**

Create a `.env.local` file (ignored by Git):
```bash
# Infisical Configuration (Development)
INFISICAL_TOKEN=st_dev_xxx_your_development_token_here
INFISICAL_PROJECT_ID=your-project-id-from-infisical
INFISICAL_ENV=development
INFISICAL_SITE_URL=https://app.infisical.com

# Frontend (for local development)
VITE_INFISICAL_TOKEN=st_dev_xxx_your_development_token_here  
VITE_INFISICAL_PROJECT_ID=your-project-id-from-infisical
VITE_INFISICAL_ENV=development
VITE_INFISICAL_SITE_URL=https://app.infisical.com
```

### **For Your Synology Production:**

Set these environment variables in Container Manager or via shell:

```bash
# Backend Container Environment Variables
INFISICAL_TOKEN=st_prod_xxx_your_production_token_here
INFISICAL_PROJECT_ID=your-project-id-from-infisical  
INFISICAL_ENV=production

# Frontend Container Environment Variables  
VITE_INFISICAL_TOKEN=st_prod_xxx_your_production_token_here
VITE_INFISICAL_PROJECT_ID=your-project-id-from-infisical
VITE_INFISICAL_ENV=production
```

## 📋 **Docker Compose Integration**

### **Updated docker-compose.yml** (for production):

```yaml
services:
  app:
    # ... existing config
    environment:
      NODE_ENV: production
      # Database connection (non-sensitive)
      DB_HOST: postgres
      DB_PORT: 5432
      DB_DATABASE: shopping_list
      
      # Infisical configuration
      INFISICAL_TOKEN: ${INFISICAL_TOKEN}
      INFISICAL_PROJECT_ID: ${INFISICAL_PROJECT_ID} 
      INFISICAL_ENV: ${INFISICAL_ENV:-production}
      
      # Remove these - they'll come from Infisical:
      # DB_PASSWORD: password  # ❌ Remove
      # JWT_SECRET: xxx        # ❌ Remove
```

### **For Container Manager:**

1. **Set environment variables** in Container Manager UI
2. **Or create** `.env` file on Synology:
   ```bash
   # /volume1/docker/shopping-list/.env
   INFISICAL_TOKEN=st_prod_xxx_your_token
   INFISICAL_PROJECT_ID=your-project-id
   INFISICAL_ENV=production
   ```

3. **Reference in compose file:**
   ```yaml
   env_file:
     - .env
   ```

## 🛡️ **Security Best Practices**

### **Token Management:**
- ✅ **Different tokens** for each environment
- ✅ **Rotate production tokens** every 3-6 months  
- ✅ **Never commit tokens** to Git
- ✅ **Use minimal permissions** (read-only for applications)
- ✅ **Monitor token usage** in Infisical dashboard

### **Secret Values:**
- ✅ **JWT_SECRET**: Minimum 256 bits (32+ characters)
- ✅ **DB_PASSWORD**: Strong, unique passwords per environment
- ✅ **Different values** for dev vs prod
- ✅ **Regular rotation** of critical secrets

### **Access Control:**
- ✅ **Limit team access** to production environment
- ✅ **Use service tokens** for applications
- ✅ **Use user accounts** for human access
- ✅ **Enable audit logging**

## 🔄 **Development Workflow**

### **Local Development:**
```bash
# 1. Use development environment in Infisical
INFISICAL_ENV=development

# 2. Your app fetches dev secrets automatically
# 3. Database: dev_password_123
# 4. JWT: development_jwt_secret...
# 5. API URL: http://localhost:3000
```

### **Production Deployment:**
```bash  
# 1. Set production environment variables on Synology
INFISICAL_ENV=production

# 2. Your app fetches production secrets automatically  
# 3. Database: super_secure_prod_password_789
# 4. JWT: production_jwt_secret...
# 5. API URL: https://api.yourdomain.com
```

## 📊 **Monitoring & Validation**

### **Test Your Setup:**

1. **Check secret retrieval:**
   ```bash
   # Backend health check should show secrets status
   curl http://localhost:3000/health
   ```

2. **Verify environment:**
   ```bash
   # Check container logs
   docker-compose logs app | grep -i infisical
   ```

3. **Infisical Dashboard:**
   - Monitor token usage
   - Check access logs
   - Verify secret access patterns

### **Health Check Integration:**
Your backend health endpoint will show:
```json
{
  "status": "ok",
  "secrets": "connected",  // or "fallback" if using env vars
  "timestamp": "2024-01-10T14:30:22.000Z"
}
```

## 🆘 **Troubleshooting**

### **Common Issues:**

1. **"Token not found" error:**
   - Verify token format: `st_xxx...`
   - Check token hasn't expired
   - Ensure token has access to correct environment

2. **"Secrets not loading" error:**
   - Verify project ID is correct
   - Check environment name matches (case-sensitive)
   - Ensure network connectivity to Infisical

3. **"Path not found" error:**
   - Verify folder structure: `/backend/` and `/frontend/`
   - Check secret names match exactly
   - Ensure secrets exist in the correct environment

### **Debug Commands:**

```bash
# Test token manually
curl -H "Authorization: Bearer st_your_token_here" \
     "https://app.infisical.com/api/v3/secrets?projectId=YOUR_PROJECT_ID&environment=production&secretPath=/backend"

# Check container environment
docker exec shopping-list-backend env | grep INFISICAL
```

## ✅ **Checklist**

Before deploying to production:

- [ ] Infisical project created
- [ ] Development and production environments configured  
- [ ] All secrets added to both environments with strong values
- [ ] Service tokens created for each environment
- [ ] Token permissions verified (read-only)
- [ ] Environment variables configured on Synology
- [ ] Docker Compose updated to use Infisical
- [ ] Health checks returning "connected" status
- [ ] Backup plan for service token rotation
- [ ] Team access configured appropriately

---

This setup provides a clean separation between development and production secrets while maintaining simplicity with a single project structure.
