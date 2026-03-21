# 🚀 CareConnect Deployment Guide - Railway

Hướng dẫn deploy CareConnect để chạy demo online với 2 browsers khác nhau.

## **Prerequisites**

- GitHub account (để connect repo)
- Railway account (free, không cần credit card)
- Frontend frontend UI code (already ready)
- Backend API code (just updated)

---

## **Step 1: Prepare Backend** ✅ (DONE)

Các files được tạo sẵn:
- ✅ `Procfile` - Railway biết cách chạy app
- ✅ `runtime.txt` - Python version
- ✅ `requirements.txt` - Updated with eventlet
- ✅ `frontend/public/js/app.js` - Updated API_BASE_URL & Socket.IO URL

---

## **Step 2: Deploy Backend to Railway** 🔧

### 2.1: Push code lên GitHub

```bash
cd c:\Users\ADMIN\Downloads\projects\CareNet
git init
git add .
git commit -m "Initial commit: CareNet app ready for deployment"
git remote add origin https://github.com/YOUR_USERNAME/carenet.git
git branch -M main
git push -u origin main
```

### 2.2: Connect Railway to GitHub

1. Go to **https://railway.app** → Sign in/up (free)
2. Click **New Project** → **Deploy from GitHub**
3. Search for `carenet` repo → Select it
4. Railway automatically detects:
   - ✅ Python project
   - ✅ Procfile
   - ✅ requirements.txt

### 2.3: Setup Environment Variables in Railway

Railway dashboard → Project → Variables

Add these variables:

```
FLASK_ENV=production
JWT_SECRET_KEY=change-this-to-random-32-char-string
ANTHROPIC_API_KEY=your-actual-key (optional for demo)
STRIPE_SECRET_KEY=your-actual-key (optional for demo)
DATABASE_URL=postgresql://... (Railway provides PostgreSQL add-on)
```

**For demo purposes, you can skip API keys** - just set dummy values!

### 2.4: Add PostgreSQL Database

Railway dashboard → Add Plugin → PostgreSQL

Railway automatically sets `DATABASE_URL` environment variable.

### 2.5: Deploy!

Railway auto-deploys when you push to GitHub.

After ~2-3 minutes, you'll get a URL like:
```
https://carenet-production-abc123.railway.app
```

✅ **Backend is now LIVE!**

---

## **Step 3: Deploy Frontend to Vercel** 🎨

### 3.1: Prepare Frontend

Frontend files are already good! Just need to upload.

### 3.2: Deploy Frontend

Option A: **Vercel (Recommended)**
1. Go to **https://vercel.com** → Sign in with GitHub
2. Create New Project → Import `carenet` repo
3. Configure:
   - Framework: **Next.js** or **Other**
   - Root Directory: `frontend/public`
4. Deploy!

Option B: **Railway** (same as backend)
1. Same as backend, just select frontend folder

**You'll get URL like:**
```
https://carenet-demo-xyz789.vercel.app
```

---

## **Step 4: Test with 2 Browsers** 🧪

### 4.1: Open 2 Browsers

- **Browser 1** (Chrome): Open your deployed URL
- **Browser 2** (Firefox/Safari): Open same URL

### 4.2: Run Demo

```
Browser 1: Login as "John" (Volunteer)
Browser 2: Login as "Jane" (Family User)

Action 1: Jane creates request
→ John's browser auto-updates with Available Tasks ✨

Action 2: John accepts task
→ Jane's browser auto-updates instantly ✨

Action 3: John completes task
→ Jane can Rate & Tip ✨
```

---

## **Common Issues & Solutions**

### ❌ "Backend connection refused"

**Solution:**
1. Check backend URL in browser console
2. Make sure Procfile is correct
3. Railway needs ~3 minutes to build

### ❌ "CORS errors"

**Solution:**
Update CORS_ALLOWED_ORIGINS in Railway environment:
```
CORS_ALLOWED_ORIGINS=https://your-frontend-url.vercel.app,https://your-backend-url.railway.app
```

### ❌ "Socket.IO not connecting"

**Solution:** 
Frontend auto-detects domain now - should work!
Check browser console for connection errors.

### ❌ "Database connection failed"

**Solution:**
Make sure DATABASE_URL is set in Railway env vars.

---

## **Important Files Changed**

1. **Procfile** (NEW)
   ```
   web: cd backend && gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:$PORT run:app
   ```

2. **runtime.txt** (NEW)
   ```
   python-3.11.7
   ```

3. **requirements.txt** (UPDATED)
   - Added: `eventlet==0.33.3`

4. **frontend/public/js/app.js** (UPDATED)
   - `getApiBaseUrl()` - auto-detect API URL
   - `getSocketUrl()` - auto-detect Socket.IO URL

---

## **Demo Scenarios**

### Scenario 1: Volunteer sees new requests
1. Jane (Family) creates request
2. John (Volunteer) auto-sees it in Available Tasks
3. John clicks Accept ✅

### Scenario 2: Family confirms volunteer match
1. John accepts Jane's request
2. Jane auto-sees "John" assigned ✅
3. Jane can see volunteer details

### Scenario 3: Rate and Tips
1. John completes task
2. Jane clicks "Rate & Tip"
3. Jane rates 5 stars + tips $50 ⭐💰
4. John's earnings auto-update ✨

---

## **Next Steps**

After successful deployment:

1. **Test thoroughly** with 2 browsers
2. **Check logs** in Railway dashboard if issues
3. **Share links** with others for testing
4. **Monitor performance** in Railway analytics

---

## **Local Development (Still Works)**

You can still run locally:

```bash
# Terminal 1: Backend
cd backend
python run.py  # Runs on http://localhost:5000

# Terminal 2: Frontend
cd frontend/public
python -m http.server 8000  # Runs on http://localhost:8000
```

Frontend auto-detects localhost and connects to port 5000! ✨

---

📞 **Need help?** Check Railway docs: https://docs.railway.app

Good luck! 🚀
