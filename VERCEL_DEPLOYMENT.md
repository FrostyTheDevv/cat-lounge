# 🚀 Cat Lounge - Vercel Deployment Guide

## ✅ Prerequisites

1. **Vercel Account** - Sign up at https://vercel.com (free tier is fine)
2. **GitHub Account** - Push your code to GitHub
3. **Discord Bot Running** - Keep your bot on your home PC for quiz API polling

---

## 📋 Step 1: Prepare Your Repository

### 1.1 Create `.gitignore` (if not exists)
Make sure these are in your `.gitignore`:
```
node_modules/
.next/
.env
.env.local
*.db
*.db-shm
*.db-wal
.DS_Store
```

### 1.2 Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit - Cat Lounge website"
git remote add origin https://github.com/YOUR_USERNAME/cat-lounge.git
git push -u origin main
```

---

## 🗄️ Step 2: Database Setup (Choose One Option)

### **Option A: Turso (Recommended - Free)**

**Why Turso?**
- LibSQL (SQLite-compatible) database
- Works seamlessly with Vercel serverless
- Free tier: 9GB storage, 1 billion row reads/month
- Edge-distributed for low latency

**Setup:**
```bash
# Install Turso CLI
npm install -g @turso/turso-cli

# Login
turso auth login

# Create database
turso db create catlounge

# Get connection URL
turso db show catlounge

# Create auth token
turso db tokens create catlounge
```

**Update `lib/database.ts`:**
```typescript
import { createClient } from '@libsql/client';

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// Then update all db.exec() to db.execute()
// And db.prepare() to db.prepare()
```

**Required package:**
```bash
npm install @libsql/client
```

---

### **Option B: Vercel Postgres (Paid - $20/month)**

Good if you want to migrate from SQLite to Postgres.

---

### **Option C: PlanetScale (MySQL - Free Tier)**

Another option but requires more migration work.

---

## 🔐 Step 3: Configure Environment Variables in Vercel

### 3.1 Go to Vercel Dashboard
1. Import your GitHub repository
2. Go to **Settings** → **Environment Variables**

### 3.2 Add ALL Environment Variables
Copy from your `.env` file:

```bash
# JWT Secrets
JWT_SECRET=your-generated-secret
JWT_REFRESH_SECRET=your-generated-secret
CSRF_SECRET=your-generated-secret

# Discord Bot
DISCORD_BOT_TOKEN=your-bot-token
DISCORD_GUILD_ID=your-guild-id
DISCORD_MEMBER_ROLE_ID=your-member-role-id

# Discord OAuth2
DISCORD_CLIENT_ID=your-client-id
DISCORD_CLIENT_SECRET=your-client-secret
DISCORD_REDIRECT_URI=https://your-vercel-domain.vercel.app/api/auth/discord/callback

# Database (if using Turso)
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-turso-token

# Quiz Role IDs
QUIZ_ROLE_SOFT_CUDDLY=role-id
QUIZ_ROLE_CHAOS_GOBLIN=role-id
QUIZ_ROLE_ROYAL_FANCY=role-id
QUIZ_ROLE_COOL_ALLEY=role-id
QUIZ_ROLE_WISE_OLD=role-id
QUIZ_ROLE_ADVENTUROUS_HUNTER=role-id

# Environment
NODE_ENV=production
```

### 3.3 Update Discord OAuth Redirect URI
In **Discord Developer Portal**:
1. Go to your OAuth2 application
2. Add redirect URI: `https://your-domain.vercel.app/api/auth/discord/callback`

---

## 🎯 Step 4: Deploy to Vercel

### Option A: Via GitHub (Recommended)
1. Connect repository in Vercel dashboard
2. Click **Deploy**
3. Vercel auto-detects Next.js and builds

### Option B: Via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 🤖 Step 5: Connect Discord Bot

Your bot stays on your **home PC** and polls the Vercel-hosted API.

### 5.1 Update Bot Configuration
In your Discord bot's `cogs/api_handler.py`:

```python
# Replace localhost with your Vercel domain
QUIZ_API_URL = "https://your-domain.vercel.app/api/quiz-completions"
QUIZ_API_TOKEN = "ae789b7e2a8d7baf08b6465486e6398fbd5a47e10d0128c7e6d61b65b61d75c5"
```

### 5.2 Test Connection
```python
# The bot will poll every 60 seconds automatically
# Check bot logs for successful API calls
```

---

## ✅ Step 6: Verify Deployment

### Test These URLs:
- `https://your-domain.vercel.app/` - Homepage
- `https://your-domain.vercel.app/staff` - Staff page
- `https://your-domain.vercel.app/quiz` - Quiz system
- `https://your-domain.vercel.app/admin/login` - Admin login

### Test Functionality:
1. ✅ Discord OAuth login works
2. ✅ Quiz completion and results
3. ✅ Staff profiles display correctly
4. ✅ Admin dashboard accessible
5. ✅ Images load properly

---

## 📁 File Uploads (Images)

Vercel's filesystem is **read-only** after build. For user uploads:

### Option A: Vercel Blob Storage
```bash
npm install @vercel/blob
```

Update image upload endpoints to use Vercel Blob.

### Option B: Cloudinary (Free tier available)
```bash
npm install cloudinary
```

Configure in environment variables and update upload logic.

---

## 🔄 Automatic Deployments

Once connected to GitHub, Vercel will:
- Auto-deploy on every `git push` to main branch
- Run preview deployments for pull requests
- Rollback easily if issues occur

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Check build logs in Vercel dashboard
# Common issues:
- Missing environment variables
- Database connection errors
- Missing dependencies
```

### Database Connection Issues
```bash
# Verify Turso credentials
turso db show catlounge

# Test connection locally first
# Make sure authToken has proper permissions
```

### Images Not Loading
```bash
# Check Next.js Image domains in next.config.js
# Verify public/ folder is committed
# Check Vercel function logs
```

### Discord OAuth Fails
```bash
# Verify DISCORD_REDIRECT_URI matches Vercel domain
# Check Discord Developer Portal redirect URIs
# Ensure CLIENT_ID and CLIENT_SECRET are correct
```

---

## 💰 Cost Estimate

**Free Tier Includes:**
- Vercel Hosting: **FREE** (100GB bandwidth/month)
- Turso Database: **FREE** (9GB storage)
- Discord Bot: **FREE** (runs on your PC)

**Total Monthly Cost: $0** 🎉

---

## 📈 Scaling Considerations

When you grow:
- Upgrade Vercel Pro ($20/month) for more bandwidth
- Upgrade Turso for more database capacity
- Consider dedicated bot hosting (Railway, Fly.io)

---

## 🎊 You're Done!

Your Cat Lounge website is now live on Vercel with:
✅ Global CDN
✅ Automatic HTTPS
✅ Edge functions for fast APIs
✅ Discord integration working
✅ Database in the cloud
✅ Zero server maintenance

Share your site and enjoy! 🐱✨
