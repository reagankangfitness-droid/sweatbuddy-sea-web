# SweatBuddy Mobile App Setup Guide

## Prerequisites

- Node.js 18+ and pnpm installed
- Expo Go app installed on your phone ([iOS](https://apps.apple.com/app/apple-store/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- Clerk account ([Sign up](https://clerk.com))
- Stream Chat account ([Sign up](https://getstream.io/chat/))

## Environment Setup

1. **Copy the environment template:**
   ```bash
   cd apps/mobile
   cp .env.example .env
   ```

2. **Configure Clerk:**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com)
   - Create a new application or select your existing one
   - Copy the **Publishable Key** from the API Keys section
   - Add it to `.env`:
     ```
     EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
     ```

3. **Configure Stream Chat:**
   - Go to [Stream Dashboard](https://dashboard.getstream.io)
   - Create a new app or select your existing one
   - Copy the **API Key** from the dashboard
   - Add it to `.env`:
     ```
     EXPO_PUBLIC_STREAM_API_KEY=...
     ```

4. **Configure API URL:**
   - Find your computer's local IP address:
     - macOS: `ifconfig | grep "inet " | grep -v 127.0.0.1`
     - Windows: `ipconfig`
   - Add it to `.env` (make sure your phone is on the same WiFi network):
     ```
     EXPO_PUBLIC_API_URL=http://192.168.1.XXX:3001
     ```

## Running the App

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start the Expo development server:**
   ```bash
   pnpm start
   ```

3. **Open on your phone:**
   - Scan the QR code with your camera (iOS) or the Expo Go app (Android)
   - The app will load on your phone

## Features

- **Authentication:** Sign in with Clerk
- **Chat:** Real-time messaging with Stream Chat
- **Groups:** Join groups and chat with members
- **Profile:** View and edit your profile

## Troubleshooting

### "Cannot connect to Stream Chat"
- Make sure you've configured `EXPO_PUBLIC_STREAM_API_KEY` in `.env`
- Verify the backend API is running
- Check that `EXPO_PUBLIC_API_URL` points to your local IP

### "Authentication required"
- Ensure `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is set in `.env`
- Try clearing the Expo cache: `pnpm start --clear`

### QR code not working
- Make sure your phone and computer are on the same WiFi network
- Try using tunnel mode: `pnpm expo start --tunnel`

## Development

- **Clear cache:** `pnpm start --clear`
- **Run in tunnel mode:** `pnpm expo start --tunnel`
- **Check logs:** Press `d` in the terminal to open developer tools
