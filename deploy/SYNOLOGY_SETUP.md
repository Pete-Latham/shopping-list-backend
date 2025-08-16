# Synology Auto-Deployment Setup Guide

This guide walks you through setting up automatic deployments from the `main` branch to your Synology DS224+ NAS.

## 🎯 Overview

Your Synology NAS will automatically stay updated with the latest `main` branch changes using one of three approaches:
1. **GitHub Actions with Self-Hosted Runner** (Recommended)
2. **Webhook-Based Deployment** (Moderate complexity)
3. **Polling-Based Deployment** (Simplest)

## 📋 Prerequisites

### Synology NAS Setup
1. **SSH access enabled** on your DS224+
2. **Docker installed** via Package Center
3. **Git installed** (via Package Center or SSH)
4. **Directory structure created**:
   ```bash
   mkdir -p /volume1/docker/shopping-list/{logs,monitoring}
   ```

### Infisical Setup (One-time)
1. **Sign up** at [https://eu.infisical.com](https://eu.infisical.com)
2. **Create project** named "Shopping List"
3. **Create Production environment**
4. **Add secrets** under `/backend` path:
   ```
   DB_PASSWORD=your-secure-database-password
   DB_USERNAME=postgres
   JWT_SECRET=your-super-secure-jwt-signing-key-256-bits-min
   JWT_EXPIRES_IN=24h
   AUTH_ENABLED=true
   ```
5. **Generate service token** for Production environment

---

## Option 1: GitHub Actions (Recommended)

### Benefits
✅ **Immediate deployment** on push to `main`  
✅ **Proper CI/CD pipeline** with build verification  
✅ **Container registry integration** (GHCR)  
✅ **Rollback capabilities** built-in  
✅ **Coordinated deployments** (backend first, then frontend)

### Setup Steps

#### 1. Install GitHub Actions Runner on Synology

```bash
# SSH into your Synology NAS
ssh admin@your-synology-ip

# Download and setup GitHub Actions runner
cd /volume1/docker
mkdir actions-runner && cd actions-runner

# Download the latest runner (replace with current version)
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configure the runner (you'll need a registration token from GitHub)
./config.sh --url https://github.com/your-username/shopping-list-backend \
  --token YOUR_REGISTRATION_TOKEN \
  --name synology-runner \
  --work _work

# Install as a service
sudo ./svc.sh install
sudo ./svc.sh start
```

#### 2. Set GitHub Repository Secrets

In both repositories (backend and frontend), add these secrets:
- `INFISICAL_TOKEN`: Your Infisical service token
- `INFISICAL_PROJECT_ID`: Your Infisical project ID
- `INFISICAL_ENV`: "Production"

#### 3. Create Environment File on NAS

```bash
# Create the environment file
cat > /volume1/docker/shopping-list/.env.local << EOF
INFISICAL_TOKEN=your_infisical_token_here
INFISICAL_PROJECT_ID=your_project_id_here
INFISICAL_ENV=Production
INFISICAL_SITE_URL=https://eu.infisical.com
EOF

# Secure the file
chmod 600 /volume1/docker/shopping-list/.env.local
```

#### 4. Deploy Initial Setup

```bash
cd /volume1/docker/shopping-list
curl -o docker-compose.yml https://raw.githubusercontent.com/your-username/shopping-list-frontend/main/docker-compose.synology-updated.yml

# Initial deployment
docker-compose up -d
```

#### 5. Verify Setup

- Push a change to `main` branch
- Check GitHub Actions runs successfully
- Verify services update automatically
- Monitor logs: `docker-compose logs -f`

---

## Option 2: Webhook-Based Deployment

### Benefits
✅ **Immediate deployment** on push to `main`  
✅ **No GitHub Actions runner needed**  
✅ **Simpler than self-hosted runner**  
⚠️ **Requires webhook service setup**

### Setup Steps

#### 1. Install Webhook Service

```bash
# Install webhook (lightweight HTTP server for webhooks)
sudo apt-get update && sudo apt-get install webhook

# Or use Docker-based webhook service
docker run -d --name webhook-service \
  -p 9000:9000 \
  -v /volume1/docker/shopping-list/deploy:/etc/webhook \
  -v /var/run/docker.sock:/var/run/docker.sock \
  almir/webhook -verbose -hooks=/etc/webhook/hooks.json
```

#### 2. Configure Webhook

Create `/volume1/docker/shopping-list/deploy/hooks.json`:
```json
[
  {
    "id": "deploy-shopping-list",
    "execute-command": "/volume1/docker/shopping-list/deploy/webhook-deploy.sh",
    "command-working-directory": "/volume1/docker/shopping-list",
    "pass-arguments-to-command": [],
    "trigger-rule": {
      "and": [
        {
          "match": {
            "type": "payload-hash-sha1",
            "secret": "your-webhook-secret",
            "parameter": {
              "source": "header",
              "name": "X-Hub-Signature"
            }
          }
        },
        {
          "match": {
            "type": "value",
            "value": "refs/heads/main",
            "parameter": {
              "source": "payload",
              "name": "ref"
            }
          }
        }
      ]
    }
  }
]
```

#### 3. Setup GitHub Webhooks

In both repositories:
1. Go to **Settings** → **Webhooks**
2. Add webhook: `http://your-synology-ip:9000/hooks/deploy-shopping-list`
3. Content type: `application/json`
4. Secret: Your webhook secret
5. Events: `push` events

#### 4. Make Deployment Script Executable

```bash
chmod +x /volume1/docker/shopping-list/deploy/webhook-deploy.sh
```

---

## Option 3: Polling-Based Deployment (Simplest)

### Benefits
✅ **No external dependencies**  
✅ **Simple cron job setup**  
✅ **Works with any Git hosting**  
⚠️ **Delay between push and deployment** (5-10 minutes)

### Setup Steps

#### 1. Setup Cron Job

```bash
# Edit crontab
crontab -e

# Add this line to check for updates every 10 minutes
*/10 * * * * /volume1/docker/shopping-list/deploy/poll-deploy.sh >> /volume1/docker/shopping-list/cron.log 2>&1
```

#### 2. Make Script Executable

```bash
chmod +x /volume1/docker/shopping-list/deploy/poll-deploy.sh
```

#### 3. Test Manual Run

```bash
cd /volume1/docker/shopping-list
./deploy/poll-deploy.sh
```

---

## 📊 Monitoring & Maintenance

### Health Monitoring

Access these URLs to monitor your deployment:
- **Application**: `http://your-synology-ip:8080`
- **API Health**: `http://your-synology-ip:3000/health`
- **Prometheus**: `http://your-synology-ip:9090` (if enabled)
- **Database**: `postgresql://postgres@your-synology-ip:5432/shopping_list`

### Log Management

```bash
# View deployment logs
tail -f /volume1/docker/shopping-list/deploy.log

# View application logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f shopping-list-backend
docker-compose logs -f shopping-list-frontend
```

### Backup Strategy

```bash
# Create backup script
cat > /volume1/docker/shopping-list/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/volume1/docker/shopping-list/backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup database
docker exec shopping-list-db pg_dump -U postgres shopping_list > "$BACKUP_DIR/database.sql"

# Backup docker-compose and configs
cp docker-compose.yml .env.local "$BACKUP_DIR/"

# Keep only last 7 days of backups
find /volume1/docker/shopping-list/backups/ -type d -mtime +7 -exec rm -rf {} +
EOF

chmod +x /volume1/docker/shopping-list/backup.sh

# Schedule daily backups
echo "0 2 * * * /volume1/docker/shopping-list/backup.sh" | crontab -
```

### Troubleshooting

#### Common Issues:

1. **Infisical connection fails**:
   ```bash
   # Test connection
   curl -H "Authorization: Bearer $INFISICAL_TOKEN" \
     https://eu.infisical.com/api/v3/secrets
   ```

2. **Docker build fails**:
   ```bash
   # Check Docker daemon
   docker info
   
   # Clean up space
   docker system prune -a
   ```

3. **Service won't start**:
   ```bash
   # Check health status
   docker-compose ps
   
   # View detailed logs
   docker-compose logs SERVICE_NAME
   ```

4. **Deployment script fails**:
   ```bash
   # Check script permissions
   ls -la deploy/*.sh
   
   # Run with debug mode
   bash -x deploy/webhook-deploy.sh
   ```

---

## 🔧 Customization

### Notification Setup

Add notification webhooks to your deployment scripts:

```bash
# Slack notification example
send_notification() {
    local message=$1
    curl -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\"$message\"}" \
      YOUR_SLACK_WEBHOOK_URL
}

# Usage in scripts
send_notification "✅ Shopping List deployed successfully!"
```

### Environment-Specific Configs

You can customize deployments for different environments:

```bash
# Development environment
INFISICAL_ENV=Development
COMPOSE_FILE=docker-compose.dev.yml

# Staging environment  
INFISICAL_ENV=Staging
COMPOSE_FILE=docker-compose.staging.yml

# Production environment
INFISICAL_ENV=Production
COMPOSE_FILE=docker-compose.yml
```

---

## 🎉 Success!

Once setup is complete, your Synology NAS will:

✅ **Automatically deploy** new versions when you push to `main`  
✅ **Manage secrets securely** through Infisical  
✅ **Monitor application health** with built-in checks  
✅ **Maintain logs and backups** for troubleshooting  
✅ **Handle rollbacks** if deployments fail  

Your shopping list application will always stay up-to-date with zero manual intervention!
