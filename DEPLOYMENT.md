# Deployment Guide

This guide covers deploying your video call app to production.

## Backend Deployment (Socket.io Server)

### Option 1: Railway (Recommended)

1. **Prepare your server:**
   ```bash
   cd server
   # The package.json is already configured with Node 18.x
   ```

2. **Set up Git repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

3. **Deploy to Railway:**
   - Go to [railway.app](https://railway.app)
   - Sign up/login with GitHub
   - Click "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect Node.js and deploy
   - Copy the generated URL (e.g., `https://your-app.railway.app`)

4. **Environment Variables on Railway:**
   - Go to your project → Variables
   - Add: `PORT=8000` (optional, Railway auto-assigns)

### Option 2: Render

1. **Create account at [render.com](https://render.com)**

2. **Create a new Web Service:**
   - Connect your GitHub repository
   - Select the `server` folder as root directory
   - Set build command: `npm install`
   - Set start command: `npm start`
   - Set environment: `Node`

3. **Environment Variables:**
   - Add `PORT` (Render will auto-assign)

### Option 3: Heroku

1. **Install Heroku CLI and login:**
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Deploy:**
   ```bash
   cd server
   heroku create your-video-call-server
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

3. **Get your Heroku URL:**
   ```bash
   heroku open
   ```

### Option 4: Vercel (Serverless Functions)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Create `vercel.json` in server folder:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/index.js"
       }
     ]
   }
   ```

3. **Deploy:**
   ```bash
   cd server
   vercel --prod
   ```

## Frontend Deployment (Next.js App)

### Option 1: Vercel (Recommended for Next.js)

1. **Deploy to Vercel:**
   ```bash
   # In the root directory (not server folder)
   npx vercel --prod
   ```

2. **Set Environment Variables in Vercel:**
   - Go to your project dashboard
   - Settings → Environment Variables
   - Add:
     ```
     NEXT_PUBLIC_SOCKET_SERVER_URL=https://your-backend-url.com
     NEXT_PUBLIC_ENABLE_TURN_SERVERS=true
     NEXT_PUBLIC_TWILIO_TURN_USERNAME=your-username
     NEXT_PUBLIC_TWILIO_TURN_CREDENTIAL=your-credential
     ```

### Option 2: Netlify

1. **Build the app:**
   ```bash
   npm run build
   npm run export  # If using static export
   ```

2. **Deploy:**
   - Drag and drop `out` folder to [netlify.com](https://netlify.com)
   - Or connect GitHub repo for automatic deployments

### Option 3: Railway

1. **Connect your frontend repo to Railway**
2. **Set environment variables in Railway dashboard**

## Configuration

### Update Environment Variables

1. **For production, update `.env.local`:**
   ```env
   NEXT_PUBLIC_SOCKET_SERVER_URL=https://your-backend-url.com
   NEXT_PUBLIC_ENABLE_TURN_SERVERS=true
   # Add your TURN server credentials here
   ```

2. **The app will automatically use:**
   - `localhost:8000` in development
   - Your production URL in production

### CORS Configuration

The server is already configured to accept connections from any origin. For production, consider restricting CORS to your frontend domain:

```javascript
// In server/index.js
const io = new Server(server, {
  cors: {
    origin: "https://your-frontend-domain.com",
    methods: ["GET", "POST"]
  }
});
```

## Testing Production Deployment

1. **Test the backend:**
   ```bash
   curl https://your-backend-url.com
   ```

2. **Test WebRTC connections:**
   - Open your deployed app in multiple browser tabs
   - Test video calls between different networks
   - Check browser console for connection errors

## Common Issues

1. **CORS Errors:** Update CORS settings in server
2. **WebRTC Failures:** Configure TURN servers for production
3. **Environment Variables:** Ensure all `NEXT_PUBLIC_` variables are set
4. **Port Issues:** Most platforms auto-assign ports, don't hardcode

## Production Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed with correct socket URL
- [ ] TURN servers configured for WebRTC
- [ ] CORS properly configured
- [ ] Environment variables set
- [ ] SSL/HTTPS enabled (required for WebRTC)
- [ ] Test video calls across different networks