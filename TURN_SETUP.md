# TURN Server Setup Guide

This video call app supports multiple TURN server providers for handling WebRTC connections behind strict firewalls.

## Setup Instructions

### 1. Twilio TURN Servers (Recommended - Free Tier Available)

1. Sign up at https://www.twilio.com
2. Go to Console → Account → API Keys & Tokens
3. Create API Key for TURN credentials
4. Add to `.env.local`:
   ```
   NEXT_PUBLIC_ENABLE_TURN_SERVERS=true
   NEXT_PUBLIC_TWILIO_TURN_USERNAME=your-twilio-username
   NEXT_PUBLIC_TWILIO_TURN_CREDENTIAL=your-twilio-credential
   ```

### 2. Metered.ca TURN Servers (50GB Free Monthly)

1. Sign up at https://www.metered.ca/tools/openrelay/
2. Get your free TURN server credentials
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_ENABLE_TURN_SERVERS=true
   NEXT_PUBLIC_METERED_TURN_USERNAME=your-metered-username
   NEXT_PUBLIC_METERED_TURN_CREDENTIAL=your-metered-credential
   ```

### 3. Self-hosted Coturn (Free, Open Source)

1. Install Coturn on your server: https://github.com/coturn/coturn
2. Configure your server
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_ENABLE_TURN_SERVERS=true
   NEXT_PUBLIC_CUSTOM_TURN_URL=turn:your-server.com:3478
   NEXT_PUBLIC_CUSTOM_TURN_USERNAME=your-username
   NEXT_PUBLIC_CUSTOM_TURN_CREDENTIAL=your-credential
   ```

## Configuration

- **STUN servers** (always enabled): Handle basic NAT traversal
- **TURN servers** (optional): Required for users behind strict firewalls
- You can use multiple providers simultaneously for maximum reliability

## Testing

To test if TURN servers are working:
1. Enable TURN servers in `.env.local`
2. Restart your development server
3. Test connections between different networks
4. Check browser console for ICE connection logs

## Production Deployment

Make sure to:
1. Set `NEXT_PUBLIC_ENABLE_TURN_SERVERS=true` in production
2. Configure your chosen TURN provider's credentials
3. Monitor usage to stay within free tier limits