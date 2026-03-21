# ⚡ CareConnect Quick Start Guide

Get CareConnect running in 5 minutes!

## Option 1: Automatic Setup (Recommended)

### macOS / Linux
```bash
# 1. Clone
git clone <repo-url>
cd CareNet

# 2. Run setup script
bash quickstart.sh

# 3. Update .env with API keys
nano .env

# 4. Start servers in separate terminals:
# Terminal 1:
cd backend && python run.py

# Terminal 2:
cd frontend/public && python -m http.server 8000

# 5. Open http://localhost:8000
```

### Windows (PowerShell)
```powershell
# 1. Clone
git clone <repo-url>
cd CareNet

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start Docker services
docker-compose up -d

# 4. Copy and edit .env
copy .env.example .env
# Edit .env with your API keys

# 5. Initialize database
cd backend
python scripts/seed.py
cd ..

# 6. Start servers
# Terminal 1:
cd backend; python run.py

# Terminal 2:
cd frontend\public
python -m http.server 8000

# 7. Open http://localhost:8000
```

## Option 2: Using Make Commands

```bash
# Install and start everything
make setup

# Update .env with API keys
nano .env

# Terminal 1: Start backend
make run

# Terminal 2: Start frontend
make frontend

# Open http://localhost:8000
```

## Option 3: Using Docker Compose

```bash
# Start all services
docker-compose up -d

# Initialize database
docker exec carenet_postgres psql -U carenet_user -d carenet_dev < init.sql

# Access at http://localhost:8000
```

## Demo Credentials

After setup, use these to test:

| Role | Email | Password |
|------|-------|----------|
| Elderly | elderly@example.com | password123 |
| Volunteer | volunteer@example.com | password123 |
| Family | family@example.com | password123 |

## What Each User Type Can Do

### 👴 Elderly
- Receive care assistance
- View caregiver details
- No app needed - just SMS updates

### 🤝 Volunteer
- Accept care tasks
- Complete services
- Receive ratings and tips
- Build reputation

### 👨‍👩‍👧 Family Member
- Create care requests
- Track status in realtime
- Rate services
- Send tips

## Server URLs

- **Backend API**: http://localhost:5000
- **Frontend App**: http://localhost:8000
- **API Docs**: http://localhost:5000/api/docs (if enabled)

## Test the API

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"family@example.com","password":"password123"}'
```

### Create Request
```bash
curl -X POST http://localhost:5000/api/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "elderly_id":"<id>",
    "service_type":"medical",
    "description":"Need medical check-up",
    "preferred_date":"2024-03-25T10:00:00"
  }'
```

## Environment Variables

Create `.env` file with:

```env
FLASK_ENV=development
DATABASE_URL=postgresql://carenet_user:carenet_password@localhost:5432/carenet_dev
JWT_SECRET_KEY=your-secret-key
ANTHROPIC_API_KEY=your-claude-api-key
STRIPE_SECRET_KEY=your-stripe-key
```

## Troubleshooting

### Port 5000 already in use
```bash
# Find and kill process
lsof -i :5000
kill -9 <PID>

# Or use different port in config
```

### Database connection error
```bash
# Check Docker
docker ps | grep postgres

# Restart database
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### CORS errors
- Make sure backend is running on port 5000
- Check CORS configuration in config.py

### JavaScript not loading
- Check browser console (F12)
- Ensure frontend is running on port 8000
- Clear browser cache

## What's Included

✅ Backend API (Flask + SQLAlchemy)
✅ Database (PostgreSQL + Redis)
✅ Frontend (HTML/CSS/JS + TailwindCSS)
✅ AI Integration (Claude API)
✅ Real-time Updates (Socket.IO)
✅ Authentication (JWT)
✅ Payment Ready (Stripe integration)
✅ Docker Setup

## Next Steps

1. **Update API Keys**
   - Get Claude API key from https://console.anthropic.com
   - Get Stripe keys from https://stripe.com
   - Update .env file

2. **Customize UI**
   - Edit frontend/public/index.html
   - Modify frontend/public/js/app.js styles

3. **Add More Features**
   - Create more API endpoints
   - Add database migrations
   - Implement additional services

4. **Deploy**
   - Follow [DEPLOYMENT.md](DEPLOYMENT.md)
   - Use Railway, Vercel, or your preferred platform

## Documentation

- [README.md](README.md) - Full project documentation
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment guide
- API Endpoints - See README.md API section
- Architecture - See project structure in README.md

## Support

- Check existing [Issues](https://github.com/yourrepo/issues)
- Review error logs: `docker-compose logs`
- Stack Overflow: Tag questions with `careconnect`

## Performance Tips

- The first request might be slow (app initialization)
- Database queries are optimized with proper indexing
- SocketIO provides real-time updates without polling
- AI matching runs asynchronously (non-blocking)

---

**Happy building! 🚀**

Having issues? Check [README.md Troubleshooting](README.md#troubleshooting) section.
