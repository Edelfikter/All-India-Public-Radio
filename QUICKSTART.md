# 🚀 Quick Start Guide

## How to Open and Run All India Public Radio

### Step 1: Prerequisites

Make sure you have **Node.js** installed on your computer.

**Check if you have Node.js:**
```bash
node --version
```

If you see a version number (like `v14.x.x` or higher), you're good to go! ✅

**Don't have Node.js?** Download it from: https://nodejs.org/

---

### Step 2: Install Dependencies

Open a terminal/command prompt in the project folder and run:

```bash
npm install
```

This downloads all the required packages. You only need to do this once! ⏱️ (Takes 1-2 minutes)

**What you'll see:**
```
added 218 packages, and audited 219 packages in 3s

28 packages are looking for funding
  run `npm fund` for details
```

✅ Dependencies installed successfully!

---

### Step 3: Start the Server

```bash
npm start
```

**What you'll see:**
```
Database initialized successfully
WARNING: Using default JWT_SECRET. Set JWT_SECRET environment variable in production!
Server running on http://localhost:3000
Database connected
```

✅ **Success!** The server is now running.

---

### Step 4: Open in Browser

Open your web browser and go to:

```
http://localhost:3000
```

🎉 **You should see the All India Public Radio platform!**

![All India Public Radio Interface](https://github.com/user-attachments/assets/36f0f26d-b7b4-4d47-9a26-93f092662c88)

The homepage displays:
- **🎙️ All India Public Radio** header
- **Login** and **Register** buttons for account access
- **Station List** button to browse all stations
- An interactive map of India (map tiles load from internet)

---

## Using the Platform

### First Time User

1. **Register an account**
   - Click the "Register" button in the top right
   - Choose a username and password (minimum 6 characters)
   - Click "Register"

2. **Create your first station**
   - Click "Create Station" button
   - Click anywhere on the India map to place your station
   - Enter a name, description, and genre
   - Click "Create Station"

3. **Build your broadcast**
   - You'll be taken to your station page
   - Click "Edit Broadcast"
   - Add YouTube tracks by pasting video URLs
   - Add TTS announcements for voice callouts
   - Click "Play Station" to hear your creation!

### Listening to Stations

1. Click any station pin on the map
2. Click "Listen" in the popup
3. Click the "▶ Play Station" button
4. Enjoy the broadcast!

---

## Troubleshooting

### Server won't start

**Error: `EADDRINUSE` (port already in use)**
```bash
# Try a different port
PORT=3001 npm start
```

**Error: `Cannot find module 'express'`**
```bash
# Dependencies not installed
npm install
```

### Browser shows "Cannot connect"

- Make sure the server is running (you should see "Server running on..." in terminal)
- Try refreshing the page
- Make sure you're using `http://localhost:3000` (not https)

### YouTube videos won't play

- Check your internet connection
- Make sure the YouTube video ID is correct
- Some videos may be restricted in your region

### TTS (Text-to-Speech) not working

- TTS requires HTTPS in some browsers
- Try a different browser (Chrome/Edge work best)
- Make sure your browser supports Web Speech API

---

## Stopping the Server

Press `Ctrl+C` in the terminal where the server is running.

---

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check out the architecture and features
- Explore the API endpoints
- Customize the platform for your needs

---

**Need help?** Open an issue on GitHub!
