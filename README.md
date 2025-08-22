# R-Music Player

A comprehensive music player application that integrates with Spotify and multiple online music APIs for streaming and downloading music.

## Features

### 🎵 **Multi-Source Music Streaming**
- **Spotify Integration**: Access your Spotify playlists, library, and favorites
- **Jamendo Music**: Creative Commons music with download capabilities
- **Radio Browser**: Internet radio stations from around the world
- **Musiq API**: Alternative music source for diverse content

### 🔍 **Advanced Search**
- Search across all integrated music sources
- Filter results by tracks or radio stations
- Trending and popular music discovery
- Unified search interface

### 💾 **Download Management**
- Download tracks from supported sources (Jamendo, Musiq)
- Offline access to downloaded music
- Download history and management
- File organization and metadata

### 🎧 **Enhanced Audio Player**
- Support for both Spotify and online tracks
- Queue management
- Cross-platform compatibility
- Responsive design

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Spotify account (for premium features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd r-music
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure APIs**
   - **Spotify**: Your Spotify client ID is already configured
   - **Jamendo**: Free registration at [jamendo.com](https://jamendo.com) (optional)
   - **Other APIs**: No additional configuration needed

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Usage

### Authentication
1. Click "Login with Spotify" on the login page
2. Authorize the application in your Spotify account
3. You'll be redirected back to the app

### Discovering Music
1. **Search Page**: Use the search bar to find tracks across all sources
2. **Trending**: Browse popular and trending music
3. **Library**: Access your Spotify playlists and saved tracks

### Playing Music
1. Click the play button on any track
2. Use the player controls to navigate between tracks
3. Add tracks to your library or download them

### Downloading Music
1. Look for the download button (📥) on supported tracks
2. Downloaded tracks appear in the Downloads section
3. Access offline music anytime

## API Sources

### Spotify Web API
- User playlists and library
- Track metadata and streaming
- User profile information

### Jamendo Music
- Creative Commons licensed music
- High-quality audio files
- Download capabilities

### Radio Browser
- Internet radio stations
- Live streaming
- Station metadata

### Musiq API
- Alternative music source
- Diverse genre coverage
- Streaming support

## File Structure

```
src/
├── components/          # Reusable UI components
│   ├── audioPlayer/    # Audio playback component
│   ├── sidebar/        # Navigation sidebar
│   └── ...
├── screens/            # Main application screens
│   ├── search/         # Music search interface
│   ├── downloads/      # Download management
│   ├── player/         # Music player screen
│   └── ...
├── services/           # API and business logic
│   └── musicService.js # Unified music service
└── spotify.js          # Spotify API configuration
```

## Troubleshooting

### Common Issues

1. **Spotify Authentication Fails**
   - Clear browser cache and cookies
   - Check if the redirect URI matches your setup
   - Ensure your Spotify client ID is correct

2. **Music Won't Play**
   - Check if you're logged into Spotify
   - Verify internet connection
   - Check browser console for errors

3. **Downloads Not Working**
   - Ensure the track supports downloads
   - Check browser download settings
   - Verify storage permissions

### Error Messages

- **404 on /callback**: Check Spotify redirect URI configuration
- **API rate limits**: Wait a few minutes and try again
- **CORS errors**: Ensure you're running from localhost:3000

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review browser console for error messages
3. Create an issue in the repository

---

**Enjoy your music! 🎶**
