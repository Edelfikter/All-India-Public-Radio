# 🎙️ All India Public Radio

**DIY Radio Platform** - Create virtual radio stations pinned on a map of India. Build broadcasts with YouTube music, browser-native TTS callouts, volume control, and fades.

## 🌟 Features

- **Interactive Map**: Place radio stations anywhere in India using Leaflet.js
- **YouTube Integration**: Play full tracks using YouTube IFrame Player API (no login required)
- **Text-to-Speech**: Browser-native TTS for announcements (completely free, no API keys)
- **Advanced Audio Control**: Volume fades, dips, and smooth transitions
- **Broadcast Builder**: Visual timeline editor for creating radio shows
- **Live Playback**: Client-side playback engine with segment management
- **Authentication**: Simple username/password auth with JWT
- **Zero Cost**: SQLite database, no external APIs except YouTube embeds

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Map**: Leaflet.js with OpenStreetMap tiles (free)
- **Music**: YouTube IFrame Player API
- **TTS**: Browser `window.speechSynthesis` API
- **Backend**: Node.js + Express
- **Database**: SQLite (via sqlite3)
- **Auth**: bcrypt + JWT

### Key Design Principles

- No audio is hosted or rebroadcast by the platform
- YouTube player is always visible (ToS compliance)
- All audio processing happens client-side
- Lightweight and scalable architecture

## 📋 Requirements

- Node.js 14+ and npm
- Modern web browser with JavaScript enabled
- Internet connection for YouTube videos and map tiles

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/Edelfikter/All-India-Public-Radio.git
cd All-India-Public-Radio

# Install dependencies
npm install

# Start the server
npm start
```

The application will be available at `http://localhost:3000`

### Default Configuration

- Server Port: 3000 (configurable via PORT environment variable)
- Database: SQLite file `radio.db` (created automatically)
- JWT Secret: Set `JWT_SECRET` environment variable in production

## 📖 User Guide

### Creating a Station

1. **Register/Login**: Click the Register button and create an account
2. **Create Station**: Click "Create Station" button in the header
3. **Place Pin**: Click on the map where you want your station located
4. **Fill Details**: Enter station name, description, and genre
5. **Build Broadcast**: You'll be redirected to the station page to add content

### Building a Broadcast

Once you own a station, you can build your broadcast timeline:

#### Adding a YouTube Track

1. Click "Add Track" in edit mode
2. Paste a YouTube URL or video ID
3. Configure:
   - Optional track title
   - Start/End times for partial plays
   - Fade-in and fade-out durations

#### Adding TTS Announcements

1. Click "Add TTS"
2. Type the announcement text
3. Choose a voice (browser-dependent)
4. Configure music dip during announcement

#### Adding Volume Dips

1. Click "Add Volume Dip"
2. Set target volume percentage
3. Set duration in seconds

#### Reordering Segments

- Use ↑ and ↓ buttons to reorder segments
- Changes are saved immediately

### Listening to a Station

1. Click on any station pin on the map, or
2. Use the "Station List" to browse all stations
3. Click "Listen" to go to the station page
4. Click "▶ Play Station" to start playback

The broadcast will play through all segments in order, with smooth transitions, fades, and TTS announcements.

## 🔧 API Reference

### Authentication

- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login and receive JWT token

### Stations

- `GET /api/stations` - List all stations (optional search/genre filters)
- `GET /api/stations/:id` - Get station details
- `POST /api/stations` - Create new station (requires auth)
- `PUT /api/stations/:id` - Update station (requires ownership)
- `DELETE /api/stations/:id` - Delete station (requires ownership)

### Broadcasts/Segments

- `GET /api/broadcasts/:stationId` - Get all segments for a station
- `POST /api/broadcasts/:stationId` - Add segment (requires ownership)
- `PUT /api/broadcasts/:stationId/:segmentId` - Update segment (requires ownership)
- `DELETE /api/broadcasts/:stationId/:segmentId` - Delete segment (requires ownership)
- `POST /api/broadcasts/:stationId/reorder` - Reorder segments (requires ownership)

## 🗄️ Database Schema

### users
- `id` - INTEGER PRIMARY KEY
- `username` - TEXT UNIQUE
- `password_hash` - TEXT
- `created_at` - DATETIME

### stations
- `id` - INTEGER PRIMARY KEY
- `name` - TEXT
- `description` - TEXT
- `genre` - TEXT
- `lat` - REAL (latitude)
- `lng` - REAL (longitude)
- `user_id` - INTEGER FK → users
- `loop_broadcast` - INTEGER (1 = loop, 0 = play once)
- `created_at` - DATETIME

### segments
- `id` - INTEGER PRIMARY KEY
- `station_id` - INTEGER FK → stations
- `type` - TEXT ('track' | 'tts' | 'volume_dip')
- `position` - INTEGER (order in timeline)
- `config` - TEXT (JSON with type-specific config)
- `created_at` - DATETIME

### Segment Config Examples

**Track segment:**
```json
{
  "youtubeId": "dQw4w9WgXcQ",
  "title": "Song Title",
  "startTime": 0,
  "endTime": 180,
  "fadeIn": 2,
  "fadeOut": 3
}
```

**TTS segment:**
```json
{
  "text": "Welcome to my radio station!",
  "voice": "Google US English",
  "dipMusic": true,
  "dipVolume": 20
}
```

**Volume Dip segment:**
```json
{
  "volume": 30,
  "duration": 5
}
```

## 🎨 Customization

### Environment Variables

- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Secret key for JWT tokens (change in production!)

### Styling

Edit `/public/css/style.css` to customize the look and feel. The current theme is dark mode optimized for radio stations.

## 🔒 Security Notes

- Change `JWT_SECRET` in production
- The default secret is for development only
- HTTPS recommended for production deployment
- Password minimum length is 6 characters
- SQLite database has foreign key constraints enabled

## 🚢 Deployment

### Production Checklist

1. Set `JWT_SECRET` environment variable
2. Set `PORT` if needed
3. Enable HTTPS (required for speech synthesis in some browsers)
4. Backup `radio.db` regularly
5. Consider using a process manager like PM2:

```bash
npm install -g pm2
pm2 start server/index.js --name "radio-platform"
pm2 save
pm2 startup
```

## 📱 Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (TTS voices may vary)
- Mobile browsers: Responsive design, full functionality

## 🤝 Contributing

This is an open-source project. Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- OpenStreetMap for free map tiles
- Leaflet.js for excellent mapping library
- YouTube for the IFrame Player API
- Browser vendors for the Web Speech API

## 💡 Tips

- **YouTube videos**: Use popular music videos that are unlikely to be removed
- **TTS voices**: Available voices depend on the user's browser and OS
- **Performance**: The platform can handle many stations as SQLite is very efficient
- **Mobile**: Works great on mobile devices with touch support

## 🐛 Troubleshooting

**YouTube player not loading?**
- Check internet connection
- Verify video ID is correct and video is not restricted

**TTS not working?**
- Enable HTTPS (some browsers require it)
- Check browser compatibility
- Try different voices

**Can't create station?**
- Make sure you're logged in
- Click "Create Station" button first, then click on map

**Station not playing?**
- Ensure broadcast has segments
- Check browser console for errors
- Verify YouTube videos are available

---

**Built with ❤️ for radio enthusiasts in India and beyond**