# Production Deployment Guide

## Overview
This guide provides comprehensive instructions for deploying the LLM Chat application to production with zero errors and optimal performance.

## Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Copy `.env.production` to `.env.local`
- [ ] Set production API keys in `.env.local`
- [ ] Verify all environment variables are set correctly
- [ ] Test API connectivity

### 2. Code Quality Checks
```bash
# Run all quality checks
npm run test

# Type checking
npm run type-check

# Linting
npm run lint:fix

# Build test
npm run build:prod
```

### 3. Security Audit
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Force fix if needed (use with caution)
npm audit fix --force
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
vercel --prod
```

3. **Environment Variables**
- Set in Vercel Dashboard > Settings > Environment Variables
- Add all variables from `.env.production`

### Option 2: Docker Deployment

1. **Create Dockerfile**
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build:prod

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

2. **Build and Run**
```bash
docker build -t llm-chat-app .
docker run -p 3000:3000 --env-file .env.local llm-chat-app
```

### Option 3: Traditional VPS

1. **Server Setup**
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Clone repository
git clone <your-repo-url>
cd llm-chat-app

# Install dependencies
npm ci --production

# Build application
npm run build:prod
```

2. **PM2 Configuration**
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'llm-chat-app',
    script: 'npm',
    args: 'start:prod',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

3. **Start Application**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Performance Optimization

### 1. CDN Setup (Cloudflare)
- Enable Cloudflare proxy
- Set up page rules for caching
- Enable Auto Minify for HTML, CSS, JS
- Enable Brotli compression

### 2. Database Optimization
- If using external storage, implement connection pooling
- Set up Redis for session management
- Implement caching strategies

### 3. Monitoring Setup

#### Application Monitoring
```bash
# Install monitoring dependencies
npm install @sentry/nextjs
```

Create `sentry.client.config.js`:
```javascript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

#### Server Monitoring
- Set up Datadog, New Relic, or similar
- Configure alerts for:
  - High CPU usage (>80%)
  - High memory usage (>90%)
  - Error rate spikes
  - Response time degradation

## Security Best Practices

### 1. API Security
- [ ] Rate limiting implemented
- [ ] API keys rotated regularly
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (if applicable)

### 2. Frontend Security
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] Content Security Policy configured
- [ ] Sensitive data not exposed in client

### 3. Infrastructure Security
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Regular security updates
- [ ] Firewall rules configured
- [ ] DDoS protection enabled

## Post-Deployment Verification

### 1. Functional Testing
```bash
# Health check
curl https://your-domain.com/api/health

# Test chat functionality
# Test code execution
# Test file upload
# Test preview panel
```

### 2. Performance Testing
```bash
# Load testing with k6
k6 run load-test.js

# Lighthouse audit
lighthouse https://your-domain.com --output html --view
```

### 3. Error Monitoring
- Check Sentry/error tracking dashboard
- Review server logs
- Monitor API error rates
- Check browser console for client errors

## Rollback Plan

### Immediate Rollback
```bash
# Vercel
vercel rollback

# PM2
pm2 reload ecosystem.config.js --update-env

# Docker
docker stop llm-chat-app
docker run -p 3000:3000 llm-chat-app:previous
```

### Database Rollback
- Keep database backups before deployment
- Have migration rollback scripts ready

## Maintenance Mode

Create `maintenance.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <title>Maintenance</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 50px;
    }
  </style>
</head>
<body>
  <h1>Under Maintenance</h1>
  <p>We'll be back shortly!</p>
</body>
</html>
```

Enable maintenance:
```bash
# Nginx
location / {
  return 503;
  error_page 503 @maintenance;
}
location @maintenance {
  root /path/to/maintenance;
  rewrite ^.*$ /maintenance.html break;
}
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Clear cache: `npm run clean`
   - Delete node_modules: `rm -rf node_modules && npm install`
   - Check Node version: `node --version` (must be 18+)

2. **Runtime Errors**
   - Check environment variables
   - Review error logs
   - Verify API connectivity
   - Check memory usage

3. **Performance Issues**
   - Enable production mode
   - Check for memory leaks
   - Review bundle size
   - Optimize images

## Support

For deployment issues:
1. Check error logs in `/logs` directory
2. Review Sentry dashboard for errors
3. Check GitHub issues
4. Contact support team

## Deployment Checklist Summary

- [ ] Environment variables configured
- [ ] Build successful
- [ ] Tests passing
- [ ] Security audit complete
- [ ] Monitoring configured
- [ ] Backup plan ready
- [ ] Rollback plan tested
- [ ] Documentation updated
- [ ] Team notified

## Success Metrics

Monitor these KPIs post-deployment:
- Page load time < 3s
- API response time < 500ms
- Error rate < 1%
- Uptime > 99.9%
- User satisfaction score > 4.5/5

---

Last Updated: November 2024
Version: 1.0.0