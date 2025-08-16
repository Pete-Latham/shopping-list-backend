# Disable User Registration Feature

This feature allows administrators to dynamically disable user registration through Infisical configuration management.

## Overview

The `DISABLE_USER_REGISTRATION` flag is fetched from Infisical and checked every time someone attempts to register a new user account via the `POST /auth/register` endpoint.

## Implementation Details

### Code Changes Made:
1. **InfisicalConfigService** (`src/config/infisical.config.ts`):
   - Added `disableUserRegistration: boolean` to the `AppSecrets` interface
   - Updated `getSecrets()` to fetch `DISABLE_USER_REGISTRATION` from Infisical
   - Defaults to `false` if the secret is not set

2. **AuthController** (`src/auth/auth.controller.ts`):
   - Injected `InfisicalConfigService` as a dependency
   - Modified `register()` endpoint to check the flag before allowing registration
   - Returns appropriate error message when registration is disabled

3. **AuthModule** (`src/auth/auth.module.ts`):
   - Added `InfisicalConfigService` to the providers array

4. **Frontend Integration** (`src/config/infisical.config.ts`):
   - Added `disableUserRegistration: boolean` to the `FrontendConfig` interface
   - Updated `getFrontendConfig()` to fetch the registration setting from backend secrets
   - Made the setting available to frontend via the existing `/config/frontend` endpoint

## How to Use

### 1. Configure in Infisical
1. Go to your Infisical dashboard
2. Navigate to your project → Production environment → `/backend` path
3. Add or update the secret:
   - **Key**: `DISABLE_USER_REGISTRATION`
   - **Value**: `"true"` (to disable) or `"false"` (to enable)

### 2. Behavior
- **When `DISABLE_USER_REGISTRATION=false`** (or not set): 
  - Registration works normally
  - Frontend shows registration option
- **When `DISABLE_USER_REGISTRATION=true`**: 
  - Backend: POST requests to `/auth/register` return HTTP 500 with error: `"User registration has been disabled by administrator"`
  - Frontend: Registration UI is hidden/disabled (via `/config/frontend` endpoint)

### 3. Testing
1. Start your backend with proper Infisical credentials:
   ```bash
   export INFISICAL_TOKEN="your-service-token"
   export INFISICAL_PROJECT_ID="your-project-id"
   npm run start
   ```

2. Test registration endpoint:
   ```bash
   curl -X POST http://localhost:3000/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "username": "testuser", 
       "password": "testpassword123"
     }'
   ```

3. Test frontend configuration endpoint:
   ```bash
   curl http://localhost:3000/config/frontend
   ```
   
   Expected response when registration is disabled:
   ```json
   {
     "apiUrl": "http://localhost:3000",
     "enableMockApi": false,
     "disableUserRegistration": true
   }
   ```

4. Toggle the `DISABLE_USER_REGISTRATION` flag in Infisical and test again

## Frontend Integration

The frontend can access the registration status through the existing configuration endpoint:

### Endpoint
```
GET /config/frontend
```

### Response Format
```typescript
interface FrontendConfig {
  apiUrl: string;
  enableMockApi: boolean;
  disableUserRegistration: boolean; // ← New field
}
```

### Frontend Implementation Example
```typescript
// Fetch configuration on app startup
const config = await fetch('/config/frontend').then(res => res.json());

// Conditionally render registration UI
if (config.disableUserRegistration) {
  // Hide registration button/form
  // Show message: "Registration is currently disabled"
} else {
  // Show normal registration UI
}
```

### Recommended UX
When registration is disabled, the frontend should:
1. **Hide the registration form/button** completely, OR
2. **Show the form but disable it** with a clear message
3. **Display an informative message** like:
   - "New user registration is temporarily disabled"
   - "Registration will be available again soon"
   - "Contact administrator for account access"

## Cache Behavior
- Infisical secrets are cached for 5 minutes
- Changes to the `DISABLE_USER_REGISTRATION` flag take effect within 5 minutes
- To force immediate refresh, restart the application

## Error Handling
- If Infisical is unavailable, the application will fail to start (by design)
- If the `DISABLE_USER_REGISTRATION` secret is missing, it defaults to `false` (registration enabled)

## Security Note
This feature provides an administrative control to quickly disable new user registrations without requiring code deployment, which is useful for:
- Emergency situations where you need to stop new registrations immediately
- Maintenance periods
- Limiting access during specific events
