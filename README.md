# RT Enigma AI — Respiratory Therapy Platform v2.0
### chosen1.ai Deployment Guide

---

## 🏗️ Project Structure

```
rt-enigma-ai/
├── backend/              # FastAPI Python backend
│   ├── main.py           # App entry point
│   ├── models/           # Pydantic data models
│   ├── routers/
│   │   ├── auth.py       # JWT authentication
│   │   ├── payments.py   # Stripe payment processing
│   │   ├── ai_engine.py  # AI Q&A, ABG interpreter
│   │   ├── practice.py   # NBRC practice questions
│   │   └── simulations.py # Ventilator simulator
│   ├── requirements.txt
│   └── .env.example      # → copy to .env
│
└── frontend/             # React frontend
    ├── public/
    ├── src/
    │   ├── pages/
    │   │   ├── LandingPage.js    # Marketing homepage
    │   │   ├── LoginPage.js
    │   │   ├── RegisterPage.js
    │   │   ├── Dashboard.js
    │   │   ├── ABGCalculator.js  # Full ABG analysis
    │   │   ├── VentSimulator.js  # Vent settings analyzer
    │   │   ├── PracticeExam.js   # NBRC practice
    │   │   ├── AIAssistant.js    # Chat interface
    │   │   └── Pricing.js        # Stripe checkout
    │   ├── components/Layout.js
    │   ├── context/AuthContext.js
    │   ├── lib/api.js
    │   └── styles.css
    ├── package.json
    └── .env.example      # → copy to .env
```

---

## 🔑 Required API Keys (Get These First)

### 1. Anthropic API Key
- Go to https://console.anthropic.com
- Create API key
- Add to backend `.env` as `ANTHROPIC_API_KEY=sk-ant-...`

### 2. Stripe Keys
- Go to https://dashboard.stripe.com
- Get publishable + secret keys
- Create 6 price IDs (see Stripe Setup below)
- Set up webhook endpoint

### 3. JWT Secret
- Generate a random 256-bit string:
  ```bash
  openssl rand -hex 32
  ```

---

## 🚀 Deployment Options

### Option A: Render.com (Recommended — Free Tier Available)

**Backend:**
1. Create new "Web Service" on render.com
2. Connect your GitHub repo
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Set environment variables from `.env.example`
6. Set root directory to `backend/`

**Frontend:**
1. Create new "Static Site" on render.com
2. Build command: `npm install && npm run build`
3. Publish directory: `build`
4. Set `REACT_APP_API_URL` to your backend URL
5. Set root directory to `frontend/`

### Option B: Vercel (Frontend) + Railway (Backend)

**Frontend on Vercel:**
```bash
cd frontend
npx vercel --prod
# Set REACT_APP_API_URL env variable in Vercel dashboard
```

**Backend on Railway:**
```bash
# Push to GitHub, connect Railway to repo
# Set environment variables in Railway dashboard
# Railway auto-detects Python and uses requirements.txt
```

### Option C: VPS (DigitalOcean/Linode)

```bash
# Install dependencies
sudo apt update
sudo apt install python3-pip nodejs npm nginx certbot

# Backend
cd backend
pip3 install -r requirements.txt
cp .env.example .env
# Edit .env with your actual keys
uvicorn main:app --host 0.0.0.0 --port 8000 &

# Frontend  
cd frontend
cp .env.example .env
# Edit .env with your API URL
npm install
npm run build
# Copy build/ to /var/www/html/

# Nginx config (see below)
```

**Nginx Config for chosen1.ai:**
```nginx
server {
    listen 80;
    server_name chosen1.ai www.chosen1.ai;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name chosen1.ai;
    
    ssl_certificate /etc/letsencrypt/live/chosen1.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chosen1.ai/privkey.pem;
    
    root /var/www/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 443 ssl;
    server_name api.chosen1.ai;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 💳 Stripe Setup

1. Go to https://dashboard.stripe.com/products
2. Create a product: "RT Enigma AI"
3. Add 6 prices:
   - Student Monthly: $19.99/month → get `price_id` → `STRIPE_PRICE_STUDENT_MONTHLY`
   - Student Annual: $199/year → `STRIPE_PRICE_STUDENT_ANNUAL`
   - Professional Monthly: $39.99/month → `STRIPE_PRICE_PRO_MONTHLY`
   - Professional Annual: $399/year → `STRIPE_PRICE_PRO_ANNUAL`
   - Institution Monthly: $199/month → `STRIPE_PRICE_INST_MONTHLY`
   - Institution Annual: $1999/year → `STRIPE_PRICE_INST_ANNUAL`

4. Set up Webhook:
   - Dashboard → Webhooks → Add endpoint
   - URL: `https://api.chosen1.ai/api/payments/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copy signing secret → `STRIPE_WEBHOOK_SECRET`

---

## 🗄️ Production Database

For production, replace the in-memory user store with PostgreSQL:

```bash
pip install asyncpg databases sqlalchemy
```

Recommended: **Supabase** (free PostgreSQL hosting)
1. Create project at supabase.com
2. Get connection string
3. Set `DATABASE_URL` in `.env`

---

## 🧪 Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env
# Fill in API keys
uvicorn main:app --reload

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env
# Set REACT_APP_API_URL=http://localhost:8000
npm start
```

---

## 📱 Features Checklist

- [x] Landing page with pricing
- [x] User registration & JWT auth  
- [x] Stripe subscription checkout (monthly + annual)
- [x] Dashboard with quick access
- [x] AI Assistant (Claude-powered, full RT knowledge)
- [x] ABG Analyzer with AI interpretation
- [x] Ventilator Simulator (all modes)
- [x] NBRC Practice Exam (8 categories)
- [x] Responsive design
- [x] Subscription tier gating
- [ ] Production database (add PostgreSQL)
- [ ] Email verification (add SendGrid)
- [ ] Password reset flow

---

## 📞 Support

- Platform: chosen1.ai
- Email: support@chosen1.ai
