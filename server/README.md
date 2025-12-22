# Video Call Server

Socket.io signaling server for the video call application.

## Local Development

```bash
npm install
npm start
```

Server runs on port 8000.

## Deployment

See [DEPLOYMENT.md](../DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Railway

1. Push this folder to GitHub
2. Connect to [railway.app](https://railway.app)
3. Deploy and get your URL

### Quick Deploy to Render

1. Create Web Service on [render.com](https://render.com)
2. Connect GitHub repo
3. Set start command: `npm start`

### Environment Variables

- `PORT` - Server port (auto-assigned by most platforms)

## Features

- WebRTC signaling
- Room management
- Real-time chat
- Participant tracking