# Infisical Secrets Management Setup

This guide walks you through setting up Infisical for secure secrets management in your Shopping List application.

## 🎯 Why Infisical?

- **Enhanced Security**: Secrets stored centrally, encrypted at rest
- **Audit Trails**: Track who accessed which secrets when
- **Secret Rotation**: Easily rotate secrets without code changes
- **Environment Management**: Different secrets for dev/staging/prod
- **Team Collaboration**: Secure sharing of secrets across team members
- **Backup & Recovery**: Centralized backup of all secrets

## 🚀 Quick Start

### 1. Infisical Cloud Setup

1. **Sign up** at [https://app.infisical.com](https://app.infisical.com)
2. **Create a project** called "Shopping List"
3. **Create environments**: `development`, `staging`, `production`
4. **Create service tokens** for each environment

### 2. Add Secrets to Infisical

For **Backend** (path: `/backend`):
```
DB_PASSWORD=your-secure-database-password
DB_USERNAME=postgres
JWT_SECRET=your-super-secure-jwt-signing-key-256-bits-min
JWT_EXPIRES_IN=24h
```

For **Frontend** (path: `/frontend`):
```
VITE_API_URL=https://your-backend-api-url.com
VITE_USE_MOCK_API=false
```

### 3. Implementation Options

Choose one of these approaches:

## Option A: SDK Integration (Recommended)

### Backend Setup

1. **Install Infisical SDK**:
   ```bash
   npm install @infisical/sdk
   ```

2. **Update your app.module.ts**:
   ```typescript
   // Add to your existing imports
   import { InfisicalConfigService } from './config/infisical.config';
   
   @Module({
     imports: [
       // ... existing imports
     ],
     providers: [
       AppService,
       InfisicalConfigService, // Add this
     ],
   })
   export class AppModule {}
   ```

3. **Update TypeORM configuration**:
   ```typescript
   // In app.module.ts
   TypeOrmModule.forRootAsync({
     inject: [InfisicalConfigService],
     useFactory: async (infisicalConfig: InfisicalConfigService) => {
       const secrets = await infisicalConfig.getSecrets();
       return {
         type: 'postgres',
         host: process.env.DB_HOST || '127.0.0.1',
         port: parseInt(process.env.DB_PORT || '5432'),
         username: secrets.dbUsername,
         password: secrets.dbPassword,
         database: process.env.DB_DATABASE || 'shopping_list',
         autoLoadEntities: true,
         synchronize: false,
       };
     },
   }),
   ```

4. **Update JWT module**:
   ```typescript
   // In auth.module.ts
   JwtModule.registerAsync({
     inject: [InfisicalConfigService],
     useFactory: async (infisicalConfig: InfisicalConfigService) => {
       const secrets = await infisicalConfig.getSecrets();
       return {
         secret: secrets.jwtSecret,
         signOptions: { expiresIn: secrets.jwtExpiresIn },
       };
     },
   }),
   ```

### Frontend Setup

1. **Install Infisical SDK**:
   ```bash
   npm install @infisical/sdk
   ```

2. **Update your API client**:
   ```typescript
   // In src/api/client.ts
   import { infisicalConfig } from '../config/infisical.config';
   
   // Replace the current API_URL logic with:
   const getApiUrl = async () => {
     const secrets = await infisicalConfig.getSecrets();
     return secrets.apiUrl;
   };
   
   export const createApiClient = async () => {
     const apiUrl = await getApiUrl();
     return axios.create({
       baseURL: apiUrl,
       timeout: 10000,
     });
   };
   ```

### Environment Variables

Set these on your host system (Synology):

**Backend**:
```bash
# Required for production
INFISICAL_TOKEN=st_xxx_your_service_token_here
INFISICAL_PROJECT_ID=your-project-id
INFISICAL_ENV=production

# Optional
INFISICAL_SITE_URL=https://app.infisical.com
```

**Frontend**:
```bash
# Required for production  
VITE_INFISICAL_TOKEN=st_xxx_your_service_token_here
VITE_INFISICAL_PROJECT_ID=your-project-id
VITE_INFISICAL_ENV=production

# Optional
VITE_INFISICAL_SITE_URL=https://app.infisical.com
```

## Option B: Infisical Agent (Container-based)

### 1. Update Docker Compose

Use the provided `docker-compose.infisical.yml` file:

```bash
# Start with Infisical agent
docker-compose -f docker-compose.yml -f docker-compose.infisical.yml up -d
```

### 2. Agent Templates

Create template files:

**infisical/backend-env.tpl**:
```bash
DB_PASSWORD={{ .DB_PASSWORD }}
DB_USERNAME={{ .DB_USERNAME }}
JWT_SECRET={{ .JWT_SECRET }}
JWT_EXPIRES_IN={{ .JWT_EXPIRES_IN }}
```

**infisical/frontend-env.tpl**:
```bash
VITE_API_URL={{ .VITE_API_URL }}
VITE_USE_MOCK_API={{ .VITE_USE_MOCK_API }}
```

### 3. Container Entrypoints

Create custom entrypoint scripts that source secrets from Infisical agent before starting your applications.

## 🔧 Development vs Production

### Development
- Can use regular `.env` files
- Infisical optional (graceful fallback)
- Local secrets for convenience

### Production
- **Must use Infisical** for critical secrets
- Service tokens required
- Automatic secret rotation capability

## 🛡️ Security Best Practices

### 1. Service Token Management
- **Different tokens** for each environment
- **Rotate tokens** regularly (quarterly)
- **Minimal permissions** per token
- **Audit token usage** monthly

### 2. Secret Organization
```
/shopping-list/
├── DB_PASSWORD
├── DB_USERNAME
├── JWT_SECRET
└── JWT_EXPIRES_IN

/shopping-list-frontend/
├── VITE_API_URL
└── VITE_USE_MOCK_API
```

### 3. Access Control
- **Limit team access** to production secrets
- **Use environment-specific** service tokens
- **Enable audit logging** for all secret access
- **Set up alerts** for suspicious activity

## 📊 Monitoring & Alerts

### 1. Infisical Dashboard
- Monitor secret access patterns
- Track service token usage
- Review audit logs regularly

### 2. Application Monitoring
```typescript
// Add to your health check
@Get('health')
async getHealth() {
  const secretsHealthy = await this.infisicalConfig.getSecrets()
    .then(() => true)
    .catch(() => false);
    
  return {
    status: 'ok',
    secrets: secretsHealthy ? 'connected' : 'fallback',
    timestamp: new Date().toISOString(),
  };
}
```

### 3. Alerting
Set up alerts for:
- Failed secret retrievals
- Service token expiration
- Unusual access patterns
- Fallback to environment variables

## 🔄 Migration Strategy

### Phase 1: Preparation
1. Set up Infisical project and environments
2. Add secrets to Infisical (copy from current `.env` files)
3. Create service tokens for each environment

### Phase 2: Development Integration
1. Add Infisical SDK to both projects
2. Implement configuration services with fallbacks
3. Test locally with both Infisical and env var fallbacks

### Phase 3: Production Deployment
1. Deploy with Infisical integration enabled
2. Monitor logs for successful secret retrieval
3. Gradually remove hardcoded secrets from Docker Compose

### Phase 4: Hardening
1. Remove fallback environment variables
2. Implement secret rotation procedures
3. Set up comprehensive monitoring and alerting

## 🆘 Troubleshooting

### Common Issues

1. **Service token not working**:
   ```bash
   # Test token manually
   curl -H "Authorization: Bearer st_your_token" \
        https://app.infisical.com/api/v3/secrets
   ```

2. **Secrets not updating**:
   ```bash
   # Clear cache and restart
   docker-compose restart app
   ```

3. **Container can't reach Infisical**:
   - Check network connectivity
   - Verify firewall rules
   - Test DNS resolution

### Debug Mode
Enable debug logging:
```typescript
// In infisical.config.ts
logLevel: LogLevel.Debug,
```

### Health Checks
```bash
# Check if secrets are loading
curl http://localhost:3000/health

# Check container logs
docker-compose logs app | grep -i infisical
```

## 📈 Benefits Achieved

After full implementation:

✅ **No more hardcoded secrets** in Docker Compose files  
✅ **Centralized secret management** across all environments  
✅ **Audit trail** of all secret access  
✅ **Easy secret rotation** without code changes  
✅ **Team collaboration** with proper access controls  
✅ **Backup and recovery** of all secrets  
✅ **Compliance ready** with enterprise-grade security  

## 🔗 Additional Resources

- [Infisical Documentation](https://infisical.com/docs)
- [Infisical SDK for Node.js](https://infisical.com/docs/sdks/languages/node)
- [Docker Integration Guide](https://infisical.com/docs/integrations/platforms/docker)
- [Best Practices Guide](https://infisical.com/docs/internals/security)

---

This setup provides enterprise-level secrets management while maintaining the flexibility to fall back to environment variables during development or emergencies.
