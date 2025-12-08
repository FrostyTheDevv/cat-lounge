# 🚀 Quick Start: Deploy Cat Lounge to Vercel

## ✅ Yes, Vercel Can Run Your Entire Site!

**What Runs on Vercel:**
- ✅ Next.js website (homepage, quiz, staff pages)
- ✅ All API routes (`/api/*`)
- ✅ Admin dashboard
- ✅ Discord OAuth authentication
- ✅ Database (with Turso)
- ✅ Image optimization
- ✅ Global CDN

**What Runs on Your Home PC:**
- 🤖 Discord bot only (polls the Vercel API every 60 seconds)

---

## 📝 3-Step Deployment Process

### Step 1: Set Up Database (15 minutes)

**Install Turso CLI:**
```bash
npm install -g @turso/turso-cli
turso auth login
```

**Create Database:**
```bash
turso db create catlounge
turso db show catlounge  # Get URL
turso db tokens create catlounge  # Get auth token
```

**Save these for later:**
- `TURSO_DATABASE_URL` - The database URL
- `TURSO_AUTH_TOKEN` - The auth token

---

### Step 2: Push to GitHub (5 minutes)

```bash
git init
git add .
git commit -m "Ready for Vercel deployment"
git remote add origin https://github.com/YOUR_USERNAME/cat-lounge.git
git push -u origin main
```

---

### Step 3: Deploy to Vercel (10 minutes)

1. Go to https://vercel.com
2. Click "Import Project"
3. Connect your GitHub repository
4. Add environment variables (Settings → Environment Variables):

**Required Variables:**
```
JWT_SECRET=generate-with-crypto
JWT_REFRESH_SECRET=generate-with-crypto
CSRF_SECRET=generate-with-crypto
DISCORD_BOT_TOKEN=your-bot-token
DISCORD_GUILD_ID=your-server-id
DISCORD_MEMBER_ROLE_ID=your-member-role
DISCORD_CLIENT_ID=your-oauth-app-id
DISCORD_CLIENT_SECRET=your-oauth-secret
DISCORD_REDIRECT_URI=https://your-domain.vercel.app/api/auth/discord/callback
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-turso-token
NODE_ENV=production
```

5. Click "Deploy"
6. Wait 2-3 minutes
7. Done! ✨

---

## 🤖 Update Your Discord Bot

In your bot's configuration file:

**Before:**
```python
QUIZ_API_URL = "http://localhost:3000/api/quiz-completions"
```

**After:**
```python
QUIZ_API_URL = "https://your-domain.vercel.app/api/quiz-completions"
```

Keep the same `QUIZ_API_TOKEN`.

---

## 💰 Cost Breakdown

| Service | Cost | What You Get |
|---------|------|-------------|
| **Vercel Hosting** | **FREE** | 100GB bandwidth, unlimited deploys |
| **Turso Database** | **FREE** | 9GB storage, 1B row reads/month |
| **Discord Bot** | **FREE** | Runs on your PC |
| **TOTAL** | **$0/month** | Full production site! |

---

## ✅ Verification Checklist

After deployment, test these:

- [ ] Homepage loads: `https://your-domain.vercel.app/`
- [ ] Quiz works: `https://your-domain.vercel.app/quiz`
- [ ] Staff page shows profiles: `https://your-domain.vercel.app/staff`
- [ ] Admin login works: `https://your-domain.vercel.app/admin/login`
- [ ] Discord OAuth redirects correctly
- [ ] Images load properly
- [ ] Bot can poll quiz API (check bot logs)

---

## 🆘 Need Help?

**Common Issues:**

1. **Build fails** → Check environment variables are set
2. **Database errors** → Verify Turso credentials
3. **OAuth fails** → Update Discord redirect URI
4. **Images don't load** → Check `next.config.js` domains

**Full Guide:** See `VERCEL_DEPLOYMENT.md` for detailed instructions.

---

## 🎊 That's It!

Your Cat Lounge website is now:
- ✅ Hosted globally on Vercel's edge network
- ✅ Secured with automatic HTTPS
- ✅ Backed by cloud database
- ✅ Connected to your Discord bot
- ✅ Costing you $0/month

Enjoy your live site! 🐱✨
