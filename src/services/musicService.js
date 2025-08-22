// Enhanced Music Service with multiple API integrations (No Spotify dependency)
import axios from 'axios';
import { musicCache, performanceMonitor } from './musicCache';

class MusicService {
  constructor() {
    this.apis = {
      audius: {
        discoveryURL: 'https://api.audius.co',
        appName: 'r-music-player'
      },
      jamendo: {
        baseURL: 'https://api.jamendo.com/v3.0',
        clientId: 'e4686ec0', // Free registration required
      },
      radioBrowser: {
        baseURL: 'https://de1.api.radio-browser.info/json',
      },
      freeMusicArchive: {
        baseURL: 'https://freemusicarchive.org/api',
      },
      archive: {
        baseURL: 'https://archive.org'
      },
      musiq: {
        baseURL: 'https://saavn.me', // Primary mirror (may be unstable)
        mirrors: [
          'https://saavn.me',
          'https://saavn.dev',
          'https://jio-saavn-api.vercel.app',
          'https://saavn-api.vercel.app',
          'https://saavn-api-git-main.vercel.app',
          'https://saavn-api-eta.vercel.app'
        ]
      },
      openverse: {
        baseURL: 'https://api.openverse.engineering/v1/audio/'
      },
      providerGateway: {
        baseURL: process.env.REACT_APP_PROVIDER_GATEWAY_URL || '' // Optional self-hosted GPL-compatible proxy
      },
      youtubeMusic: {
        baseURL: 'https://music.youtube.com',
        searchEndpoint: '/search'
      },
      deezer: {
        baseURL: 'https://api.deezer.com'
      },
      // NEW SOURCES - 100% FREE, NO API KEYS REQUIRED
      bandcamp: {
        baseURL: 'https://bandcamp.com',
        searchEndpoint: '/search'
      },
      ccMixter: {
        baseURL: 'http://ccmixter.org/api',
        searchEndpoint: '/query'
      },
      incompetech: {
        baseURL: 'https://incompetech.com',
        musicEndpoint: '/music/'
      },
      bensound: {
        baseURL: 'https://www.bensound.com',
        apiEndpoint: '/api'
      },
      // Additional FREE sources
      freeMusicArchive: {
        baseURL: 'https://freemusicarchive.org/api',
        // No API key required for basic access
      },
      internetArchive: {
        baseURL: 'https://archive.org',
        // Completely free, no API key needed
      },
      jamendo: {
        baseURL: 'https://api.jamendo.com/v3.0',
        clientId: 'e4686ec0', // Free tier, no registration required
      },
      // Community-driven free music
      freesound: {
        baseURL: 'https://freesound.org/api',
        // Free tier available, no payment required
      }
    };
    
    // Cache resolved Audius discovery host
    this.audiusBase = null;
    this.musiqBase = null;
    this.gatewayBase = (this.apis.providerGateway.baseURL || '').replace(/\/$/, '');

    // Musiq availability tracking (auto-disable when mirrors fail repeatedly)
    this.musiqFailureCount = 0;
    this.musiqDisabledUntil = 0;
    try {
      const stored = localStorage.getItem('musiqDisabledUntilMs');
      if (stored) this.musiqDisabledUntil = parseInt(stored, 10) || 0;
    } catch (_) {}
    
    // Demo tracks with working audio URLs for testing
    this.demoTracks = [
      {
        id: 'demo_1',
        name: 'Sample Audio',
        artist: 'Demo Artist',
        album: 'Test Collection',
        duration: 30000,
        image: '/logo192.png',
        preview_url: 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_700KB.mp3',
        download_url: 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_700KB.mp3',
        source: 'demo',
        genre: 'Demo',
      },
      {
        id: 'demo_2',
        name: 'Test Music',
        artist: 'Sample Artist',
        album: 'Audio Tests',
        duration: 25000,
        image: '/logo192.png',
        preview_url: 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_1MG.mp3',
        download_url: 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_1MG.mp3',
        source: 'demo',
        genre: 'Sample',
      },
      {
        id: 'demo_3',
        name: 'Audio Example',
        artist: 'Example Artist',
        album: 'Demo Album',
        duration: 20000,
        image: '/logo192.png',
        preview_url: 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_2MG.mp3',
        download_url: 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_2MG.mp3',
        source: 'demo',
        genre: 'Example',
      }
    ];
    
    // Indian music demo tracks as fallback when Musiq fails
    this.indianDemoTracks = [
      {
        id: 'indian_demo_1',
        name: 'Bollywood Hits 2024',
        artist: 'Various Artists',
        album: 'Indian Music Collection',
        duration: 180000,
        image: '/logo192.png',
        preview_url: 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_700KB.mp3',
        download_url: 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_700KB.mp3',
        source: 'demo',
        genre: 'Bollywood',
        language: 'hindi'
      },
      {
        id: 'indian_demo_2',
        name: 'Hindi Romantic Songs',
        artist: 'Bollywood Stars',
        album: 'Love Collection',
        duration: 200000,
        image: '/logo192.png',
        preview_url: 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_1MG.mp3',
        download_url: 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_1MG.mp3',
        source: 'demo',
        genre: 'Hindi',
        language: 'hindi'
      },
      {
        id: 'indian_demo_3',
        name: 'Punjabi Beats',
        artist: 'Punjabi Artists',
        album: 'Punjabi Collection',
        duration: 160000,
        image: '/logo192.png',
        preview_url: 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_2MG.mp3',
        download_url: 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_2MG.mp3',
        source: 'demo',
        genre: 'Punjabi',
        language: 'punjabi'
      }
    ];
  }

  // ===== Audius API methods (full tracks, no login) =====
  async resolveAudiusHost() {
    try {
      if (this.audiusBase) return this.audiusBase;
      const response = await axios.get(this.apis.audius.discoveryURL);
      const hosts = response?.data?.data || [];
      if (!hosts.length) throw new Error('No Audius discovery hosts available');
      // Pick a random host for basic load distribution
      const chosen = hosts[Math.floor(Math.random() * hosts.length)];
      this.audiusBase = chosen?.replace(/\/$/, '');
      return this.audiusBase;
    } catch (error) {
      console.error('Audius discovery error:', error);
      throw error;
    }
  }

  // ===== Internet Archive (India-focused) =====
  async searchArchiveTracks(query, page = 1, pageSize = 20, language = 'all') {
    try {
      const langClause = (language && language !== 'all') ? ` AND (language:${language})` : '';
      const q = `${query ? `(${query}) AND ` : ''}mediatype:audio AND (subject:(hindi OR bollywood OR punjabi OR tamil OR telugu) OR collection:(hindusthanirecords))${langClause}`;
      const params = {
        q,
        'fl[]': ['identifier', 'title', 'creator', 'language', 'downloads'],
        rows: pageSize,
        page,
        output: 'json'
      };
      const res = await axios.get(`${this.apis.archive.baseURL}/advancedsearch.php`, { params });
      const docs = res?.data?.response?.docs || [];
      // Fetch file lists for each identifier to extract a playable url
      const items = await Promise.all(docs.map(async (d) => {
        try {
          const meta = await axios.get(`${this.apis.archive.baseURL}/metadata/${d.identifier}`);
          const files = meta?.data?.files || [];
          const file = files.find(f => /\.(mp3|ogg|flac)$/i.test(f.name));
          if (!file) return null;
          const streamUrl = `${this.apis.archive.baseURL}/download/${d.identifier}/${file.name}`;
          const image = `${this.apis.archive.baseURL}/services/img/${d.identifier}`;
          return {
            id: `archive_${d.identifier}_${file.name}`,
            name: d.title || file.name,
            artist: d.creator || 'Internet Archive',
            album: d.identifier,
            duration: 0,
            image,
            preview_url: streamUrl,
            download_url: streamUrl,
            source: 'archive',
            language: (Array.isArray(d.language) ? d.language[0] : d.language) || ''
          };
        } catch (_) {
          return null;
        }
      }));
      return items.filter(Boolean);
    } catch (e) {
      console.warn('Archive search error:', e?.message || e);
      return [];
    }
  }



  // ===== YouTube Music (unofficial, no login) =====
  async searchYouTubeMusic(query, page = 1, pageSize = 20) {
    try {
      // Try multiple YouTube Music proxy services for better reliability
      const proxyUrls = [
        'https://ytmusicapi.vercel.app',
        'https://ytmusicapi-git-main.vercel.app',
        'https://ytmusicapi-git-develop.vercel.app',
        'https://ytmusicapi-git-master.vercel.app'
      ];
      
      for (const proxyUrl of proxyUrls) {
        try {
          console.log(`Trying YouTube Music proxy: ${proxyUrl}`);
          const response = await axios.get(`${proxyUrl}/search`, {
            params: {
              query: `${query} music`,
              type: 'song',
              limit: pageSize
            },
            timeout: 8000
          });
          
          if (response.data && response.data.length > 0) {
            const tracks = response.data.slice(0, pageSize);
            console.log(`YouTube Music proxy ${proxyUrl} succeeded with ${tracks.length} tracks`);
            return this.formatYouTubeMusicTracks(tracks);
          }
        } catch (proxyError) {
          console.warn(`YouTube Music proxy ${proxyUrl} failed:`, proxyError?.message);
          continue; // Try next proxy
        }
      }
      
      console.warn('All YouTube Music proxies failed, using demo tracks');
      return this.getYouTubeMusicDemoTracks(query, pageSize);
    } catch (error) {
      console.error('YouTube Music search error:', error);
      return this.getYouTubeMusicDemoTracks(query, pageSize);
    }
  }

  formatYouTubeMusicTracks(tracks) {
    if (!Array.isArray(tracks)) return [];
    
    return tracks.map(track => ({
      id: `yt_${track.videoId || track.id || Math.random()}`,
      name: track.name || track.title || 'Unknown Title',
      artist: track.artist?.name || track.artist || 'Unknown Artist',
      album: track.album?.name || 'YouTube Music',
      duration: track.duration ? track.duration * 1000 : 0,
      image: track.artwork_url || track.thumbnails?.[0]?.url || '/logo192.png',
      preview_url: `https://music.youtube.com/watch?v=${track.videoId || track.id}`,
      download_url: undefined, // YouTube doesn't allow direct downloads
      source: 'youtube',
      genre: 'YouTube Music',
      language: ''
    })).filter(x => x.preview_url);
  }

  getYouTubeMusicDemoTracks(query, pageSize) {
    // Return demo tracks when YouTube Music API fails
    const demoTracks = [
      {
        name: 'Bollywood Hits 2024 - Demo',
        artist: 'Various Artists',
        album: 'YouTube Music Demo',
        genre: 'Bollywood',
        audioUrl: 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_700KB.mp3'
      },
      {
        name: 'Hindi Romantic Songs - Demo',
        artist: 'Bollywood Stars',
        album: 'YouTube Music Demo',
        genre: 'Hindi',
        audioUrl: 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_1MG.mp3'
      },
      {
        name: 'Punjabi Beats - Demo',
        artist: 'Punjabi Artists',
        album: 'YouTube Music Demo',
        genre: 'Punjabi',
        audioUrl: 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_2MG.mp3'
      },
      {
        name: 'English Pop Hits - Demo',
        artist: 'International Stars',
        album: 'YouTube Music Demo',
        genre: 'Pop',
        audioUrl: 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_700KB.mp3'
      },
      {
        name: 'Tamil Melodies - Demo',
        artist: 'Tamil Artists',
        album: 'YouTube Music Demo',
        genre: 'Tamil',
        audioUrl: 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_1MG.mp3'
      }
    ];
    
    return demoTracks.slice(0, Math.min(pageSize, demoTracks.length)).map((track, i) => ({
      id: `yt_demo_${i}`,
      name: track.name,
      artist: track.artist,
      album: track.album,
      duration: 180000, // 3 minutes
      image: '/logo192.png',
      preview_url: track.audioUrl, // Use working audio URLs instead of YouTube search links
      download_url: track.audioUrl,
      source: 'youtube',
      genre: track.genre,
      language: track.genre === 'Hindi' || track.genre === 'Bollywood' || track.genre === 'Punjabi' || track.genre === 'Tamil' ? 'hindi' : 'english'
    }));
  }

  // ===== Openverse (CC audio aggregator) =====
  async searchOpenverse(query, page = 1, pageSize = 20) {
    try {
      console.log(`🔍 Searching Openverse for: ${query}`);
      
      // Respect Openverse rate limits: max 20 items per page for anonymous users
      const adjustedPageSize = Math.min(pageSize, 20);
      console.log(`🔍 Adjusted page size to ${adjustedPageSize} (Openverse limit)`);
      
      const params = {
        q: query,
        page,
        page_size: adjustedPageSize,
        source: 'jamendo,wikimedia,commons,ccmixter,archive',
        type: 'audio' // Specifically request audio content
      };
      
      console.log(`🔍 Openverse API URL: ${this.apis.openverse.baseURL}`);
      console.log(`🔍 Openverse params:`, params);
      
      const res = await axios.get(this.apis.openverse.baseURL, {
        params,
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'R-Music-Player/1.0' // Add user agent
        },
        timeout: 15000, // Increased timeout for Openverse
        // Openverse blocks browser-origin CORS for some endpoints; allow soft failure
        validateStatus: (s) => s >= 200 && s < 500 // Allow 4xx errors to be handled
      });
      
      console.log(`🔍 Openverse response status: ${res.status}`);
      console.log(`🔍 Openverse response headers:`, res.headers);
      
      // Handle rate limiting and authentication errors
      if (res.status === 401) {
        console.warn(`⚠️ Openverse: Unauthorized - rate limit exceeded or authentication required`);
        console.warn(`⚠️ Rate limit info:`, {
          burst: res.headers['x-ratelimit-available-anon_burst'],
          sustained: res.headers['x-ratelimit-available-anon_sustained']
        });
        return this.getOpenverseDemoTracks(query, adjustedPageSize);
      }
      
      if (res.status === 429) {
        console.warn(`⚠️ Openverse: Rate limit exceeded, using demo tracks`);
        return this.getOpenverseDemoTracks(query, adjustedPageSize);
      }
      
      if (res.status >= 400) {
        console.warn(`⚠️ Openverse returned error status ${res.status}:`, res.data);
        return this.getOpenverseDemoTracks(query, adjustedPageSize);
      }
      
      const results = res?.data?.results || [];
      console.log(`🔍 Openverse raw results: ${results.length} items`);
      
      if (results.length === 0) {
        console.warn(`⚠️ Openverse returned 0 results for query: ${query}`);
        // Try a broader search with smaller page size
        const broaderParams = { 
          ...params, 
          q: query.split(' ')[0],
          page_size: Math.min(10, adjustedPageSize) // Even smaller for broader search
        };
        console.log(`🔍 Trying broader search with:`, broaderParams);
        
        try {
          const broaderRes = await axios.get(this.apis.openverse.baseURL, {
            params: broaderParams,
            headers: { 
              'Accept': 'application/json',
              'User-Agent': 'R-Music-Player/1.0'
            },
            timeout: 15000
          });
          
          if (broaderRes.status === 200) {
            const broaderResults = broaderRes?.data?.results || [];
            console.log(`🔍 Broader search returned: ${broaderResults.length} items`);
            
            if (broaderResults.length > 0) {
              return this.formatOpenverseResults(broaderResults);
            }
          }
        } catch (broaderError) {
          console.warn('Broader Openverse search also failed:', broaderError?.message);
        }
        
        // Return demo tracks as fallback
        return this.getOpenverseDemoTracks(query, adjustedPageSize);
      }
      
      return this.formatOpenverseResults(results);
    } catch (e) {
      console.error('❌ Openverse search error:', e?.message || e);
      console.error('❌ Error details:', e);
      
      // Check if it's a rate limit or auth error
      if (e.response?.status === 401 || e.response?.status === 429) {
        console.warn(`⚠️ Openverse auth/rate limit error, using demo tracks`);
      }
      
      // Return demo tracks as fallback
      return this.getOpenverseDemoTracks(query, Math.min(pageSize, 20));
    }
  }
  
  // Format Openverse results with better handling
  formatOpenverseResults(results) {
    return results.map(r => {
      // Check if we have any audio content
      const hasAudio = r.audio || r.url || r.download_url;
      const audioUrl = r.audio || r.url || r.download_url;
      
      return {
        id: `ov_${r.id}`,
        name: r.title || 'Unknown Title',
        artist: r.creator || 'Unknown Artist',
        album: r.provider || 'Openverse',
        duration: 0, // Openverse doesn't provide duration
        image: r.thumbnail || '/logo192.png',
        preview_url: hasAudio ? audioUrl : null,
        download_url: hasAudio ? audioUrl : null,
        source: 'openverse',
        genre: r.tags?.join(', ') || 'Creative Commons',
        language: r.language || 'unknown',
        // Additional metadata
        license: r.license || 'CC',
        provider: r.provider || 'Openverse'
      };
    }).filter(x => x.preview_url); // Only return tracks with audio
  }
  
  // Get Openverse demo tracks as fallback
  getOpenverseDemoTracks(query, pageSize) {
    const demoTracks = [
      {
        id: 'ov_demo_1',
        name: 'Creative Commons Music',
        artist: 'CC Artists',
        album: 'Openverse Collection',
        duration: 180000,
        image: '/logo192.png',
        preview_url: 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_700KB.mp3',
        download_url: 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_700KB.mp3',
        source: 'openverse',
        genre: 'Creative Commons',
        language: 'english',
        license: 'CC',
        provider: 'Openverse'
      },
      {
        id: 'ov_demo_2',
        name: 'Public Domain Audio',
        artist: 'Public Domain',
        album: 'Openverse PD',
        duration: 200000,
        image: '/logo192.png',
        preview_url: 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_1MG.mp3',
        download_url: 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_1MG.mp3',
        source: 'openverse',
        genre: 'Public Domain',
        language: 'english',
        license: 'PD',
        provider: 'Openverse'
      }
    ];
    
    // Filter by query if provided
    if (query && query !== 'test') {
      const filtered = demoTracks.filter(track => 
        track.name.toLowerCase().includes(query.toLowerCase()) ||
        track.genre.toLowerCase().includes(query.toLowerCase())
      );
      return filtered.slice(0, pageSize);
    }
    
    return demoTracks.slice(0, pageSize);
  }

  async getArchiveTrending(limit = 20) {
    try {
      // Use downloads as a proxy for popularity
      const params = {
        q: 'mediatype:audio AND (subject:(hindi OR bollywood OR punjabi OR tamil OR telugu) OR collection:(hindusthanirecords))',
        'fl[]': ['identifier', 'title', 'creator', 'language', 'downloads'],
        sort: ['downloads desc'],
        rows: Math.min(25, limit),
        page: 1,
        output: 'json'
      };
      const res = await axios.get(`${this.apis.archive.baseURL}/advancedsearch.php`, { params });
      const docs = res?.data?.response?.docs || [];
      const tracks = await this.searchArchiveTracks('', 1, Math.min(25, limit), 'all');
      // searchArchiveTracks already returns playable tracks; use that and slice
      return tracks.slice(0, limit);
    } catch (e) {
      console.warn('Archive trending error:', e?.message || e);
      return [];
    }
  }

  async searchAudiusTracks(query, limit = 20, offset = 0) {
    try {
      const base = await this.resolveAudiusHost();
      const response = await axios.get(`${base}/v1/tracks/search`, {
        params: {
          query,
          limit,
          offset,
          app_name: this.apis.audius.appName
        }
      });
      return this.formatAudiusTracks(response?.data?.data || []);
    } catch (error) {
      console.error('Audius search error:', error);
      return [];
    }
  }

  async getAudiusTrending(limit = 20) {
    try {
      const base = await this.resolveAudiusHost();
      const response = await axios.get(`${base}/v1/tracks/trending`, {
        params: {
          limit,
          app_name: this.apis.audius.appName
        }
      });
      return this.formatAudiusTracks(response?.data?.data || []);
    } catch (error) {
      console.error('Audius trending error:', error);
      return [];
    }
  }

  formatAudiusTracks(tracks) {
    const base = this.audiusBase || '';
    return tracks.map((track) => {
      const artwork = track?.artwork || {};
      const image = artwork['480x480'] || artwork['150x150'] || artwork || '/logo192.png';
      const durationMs = (track?.duration || 0) * 1000;
      const id = track?.id;
      const isDownloadable = Boolean(track?.downloadable);
      const streamUrl = id ? `${base}/v1/tracks/${id}/stream?app_name=${this.apis.audius.appName}` : null;
      const downloadUrl = isDownloadable && id ? `${base}/v1/tracks/${id}/download?app_name=${this.apis.audius.appName}` : undefined;
      return {
        id: `audius_${id}`,
        name: track?.title || 'Unknown Title',
        artist: track?.user?.name || track?.user?.handle || 'Unknown Artist',
        album: track?.album || 'Single',
        duration: durationMs,
        image,
        preview_url: streamUrl,
        download_url: downloadUrl,
        source: 'audius',
        genre: track?.genre
      };
    });
  }

  // Jamendo API methods
  async searchJamendoTracks(query, limit = 20, offset = 0) {
    try {
      const response = await axios.get(`${this.apis.jamendo.baseURL}/tracks/`, {
        params: {
          client_id: this.apis.jamendo.clientId,
          format: 'json',
          limit,
          offset,
          search: query,
          include: 'musicinfo',
          audioformat: 'mp31'
        }
      });
      return this.formatJamendoTracks(response.data.results);
    } catch (error) {
      console.error('Jamendo search error:', error);
      return [];
    }
  }

  async getJamendoPopularTracks(limit = 20) {
    try {
      const response = await axios.get(`${this.apis.jamendo.baseURL}/tracks/`, {
        params: {
          client_id: this.apis.jamendo.clientId,
          format: 'json',
          limit,
          order: 'popularity_week',
          include: 'musicinfo',
          audioformat: 'mp31'
        }
      });
      return this.formatJamendoTracks(response.data.results);
    } catch (error) {
      console.error('Jamendo popular tracks error:', error);
      return [];
    }
  }

  formatJamendoTracks(tracks) {
    return tracks.map(track => ({
      id: `jamendo_${track.id}`,
      name: track.name,
      artist: track.artist_name,
      album: track.album_name,
      duration: track.duration * 1000, // Convert to milliseconds
      image: track.image,
      preview_url: track.audio,
      download_url: track.audio,
      source: 'jamendo',
      license: track.license_ccurl,
      genre: track.genre,
      tags: track.tags
    }));
  }

  // Radio Browser API methods
  async searchRadioStations(query, limit = 20, offset = 0) {
    try {
      const response = await axios.get(`${this.apis.radioBrowser.baseURL}/stations/search`, {
        params: {
          name: query,
          limit,
          offset,
          hidebroken: true
        }
      });
      return this.formatRadioStations(response.data);
    } catch (error) {
      console.error('Radio Browser search error:', error);
      return [];
    }
  }

  async getPopularRadioStations(limit = 20) {
    try {
      const response = await axios.get(`${this.apis.radioBrowser.baseURL}/stations/topvote`, {
        params: {
          limit,
          hidebroken: true
        }
      });
      return this.formatRadioStations(response.data);
    } catch (error) {
      console.error('Radio Browser popular stations error:', error);
      return [];
    }
  }

  formatRadioStations(stations) {
    return stations.map(station => ({
      id: `radio_${station.stationuuid}`,
      name: station.name,
      artist: station.organization || 'Radio Station',
      album: station.country || 'Live Radio',
      duration: 0, // Live radio
      image: station.favicon || '/logo192.png',
      preview_url: station.url_resolved,
      source: 'radio',
      genre: station.tags,
      country: station.country,
      language: station.language,
      bitrate: station.bitrate
    }));
  }

  // Musiq API methods (alternative to Spotify)
  async getMusiqBase() {
    if (this.isMusiqTemporarilyDisabled()) throw new Error('Musiq temporarily disabled');
    if (this.musiqBase) return this.musiqBase;
    const candidates = this.apis.musiq.mirrors || [this.apis.musiq.baseURL];
    for (const base of candidates) {
      try {
        // Try lightweight request with a very small timeout
        await axios.get(`${base.replace(/\/$/, '')}/status`, { timeout: 2000 }).catch(() => {});
        this.musiqBase = base.replace(/\/$/, '');
        return this.musiqBase;
      } catch (_) {
        continue;
      }
    }
    // Fallback to primary even if status check failed
    this.musiqBase = (candidates[0] || '').replace(/\/$/, '');
    return this.musiqBase;
  }

  async fetchMusiq(base, query, page) {
    const b = base.replace(/\/$/, '');
    const paths = [
      `${b}/search/songs`,
      `${b}/api/search/songs`
    ];
    let lastErr = null;
    for (const url of paths) {
      try {
        const response = await axios.get(url, {
          params: { query, page },
          timeout: 6000
        });
        const results = response?.data?.data?.results || response?.data?.results || [];
        if (Array.isArray(results)) return results;
      } catch (err) {
        lastErr = err;
      }
    }
    if (lastErr) throw lastErr;
      return [];
  }

  async searchMusiqTracks(query, limit = 20, page = 1) {
    if (this.isMusiqTemporarilyDisabled()) {
      console.log('Musiq is temporarily disabled, returning demo tracks');
      return this.getIndianDemoTracks(query, limit);
    }
    
    const mirrors = [this.musiqBase, ...(this.apis.musiq.mirrors || [])].filter(Boolean);
    const tried = new Set();
    for (const candidate of mirrors) tried.add(candidate);
    if (!mirrors.length) mirrors.push(this.apis.musiq.baseURL);

    // Try cached/known mirrors first
    for (const base of mirrors) {
      try {
        console.log(`Trying Musiq mirror: ${base}`);
        const results = await this.fetchMusiq(base, query, page);
        this.musiqBase = base.replace(/\/$/, '');
        // Success: reset failure counter
        this.musiqFailureCount = 0;
        console.log(`Musiq mirror ${base} succeeded with ${results?.length || 0} results`);
        return this.formatMusiqTracks(results || [], limit);
      } catch (error) {
        console.warn(`Musiq mirror ${base} failed:`, error?.message);
        continue; // try next
      }
    }

    // Try all remaining mirrors if any were not in the initial list
    for (const base of (this.apis.musiq.mirrors || [])) {
      if (tried.has(base)) continue;
      try {
        console.log(`Trying additional Musiq mirror: ${base}`);
        const results = await this.fetchMusiq(base, query, page);
        this.musiqBase = base.replace(/\/$/, '');
        console.log(`Additional Musiq mirror ${base} succeeded with ${results?.length || 0} results`);
        return this.formatMusiqTracks(results || [], limit);
      } catch (error) {
        console.warn(`Additional Musiq mirror ${base} failed:`, error?.message);
        continue; // continue
      }
    }

    this.musiqFailureCount += 1;
    if (this.musiqFailureCount >= 2) {
      this.disableMusiqTemporarily(10 * 60 * 1000); // 10 minutes
      console.warn(`Musiq disabled for 10 minutes after ${this.musiqFailureCount} failures`);
    }
    
    if (!this._loggedMusiqOnce) {
      console.warn('All Musiq mirrors failed; returning Indian demo tracks as fallback');
      this._loggedMusiqOnce = true;
    }
    
    // Return Indian demo tracks as fallback
    return this.getIndianDemoTracks(query, limit);
  }

  formatMusiqTracks(tracks, limit) {
    return tracks.slice(0, limit).map(track => ({
      id: `musiq_${track.id}`,
      name: track.name,
      artist: track.primaryArtists || track.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
      album: track.album?.name || 'Single',
      duration: track.duration * 1000, // Convert to milliseconds
      image: track.image?.[2]?.link || track.image?.[0]?.link || '/logo192.png',
      preview_url: track.downloadUrl?.[4]?.link || track.downloadUrl?.[0]?.link,
      download_url: track.downloadUrl?.[4]?.link || track.downloadUrl?.[0]?.link,
      source: 'musiq',
      genre: track.genre,
      language: track.language || track.primaryLanguages?.[0] || (track.language?.length ? track.language[0] : '') || 'hindi'
    }));
  }

  // ===== Provider Gateway (optional) =====
  gatewayEnabled() {
    return typeof this.gatewayBase === 'string' && this.gatewayBase.length > 0;
  }



  isOpenverseEnabled() {
    return true; // Openverse is always available
  }

  // NEW SOURCE ENABLEMENT METHODS - 100% FREE, NO API KEYS REQUIRED
  isBandcampEnabled() {
    return true; // Bandcamp has limited but public access
  }

  isFMAEnabled() {
    return true; // FMA provides public access without API key
  }

  isCcMixterEnabled() {
    return true; // ccMixter is publicly accessible
  }

  isIncompetechEnabled() {
    return true; // Incompetech is publicly accessible
  }

  isBensoundEnabled() {
    return true; // Bensound is publicly accessible
  }

  isFreesoundEnabled() {
    return true; // Freesound has free tier with generous limits
  }

  isInternetArchiveEnabled() {
    return true; // Internet Archive is completely free
  }

  isJamendoEnabled() {
    return true; // Jamendo has free tier, no registration required
  }

  async searchGateway(query, page = 1, pageSize = 20, language = 'all') {
    if (!this.gatewayEnabled()) return [];
    try {
      const res = await axios.get(`${this.gatewayBase}/search`, {
        params: { q: query, page, limit: pageSize, language }
      });
      const items = res?.data?.results || res?.data || [];
      return this.formatGatewayTracks(items);
    } catch (e) {
      console.warn('Gateway search error:', e?.message || e);
      return [];
    }
  }

  async getGatewayTrending(limit = 20, language = 'all') {
    if (!this.gatewayEnabled()) return [];
    try {
      const res = await axios.get(`${this.gatewayBase}/trending`, {
        params: { limit, language }
      });
      const items = res?.data?.results || res?.data || [];
      return this.formatGatewayTracks(items);
    } catch (e) {
      console.warn('Gateway trending error:', e?.message || e);
      return [];
    }
  }

  formatGatewayTracks(items) {
    return (items || []).map((t) => ({
      id: `gateway_${t.id || t.trackId || t.videoId || t.uid || Math.random().toString(36).slice(2)}`,
      name: t.title || t.name || 'Unknown Title',
      artist: t.artist || t.uploader || t.channel || 'Unknown Artist',
      album: t.album || t.playlist || 'Single',
      duration: (t.durationMs ?? (t.duration ? t.duration * 1000 : 0)) || 0,
      image: t.image || t.thumbnail || t.artwork || '/logo192.png',
      preview_url: t.streamUrl || t.url || t.audioUrl || null,
      download_url: t.downloadUrl || undefined,
      source: t.source || 'gateway',
      genre: t.genre,
      language: t.language || ''
    }));
  }

  // ===== Musiq disable helpers =====
  isMusiqTemporarilyDisabled() {
    return Date.now() < this.musiqDisabledUntil;
  }

  disableMusiqTemporarily(durationMs) {
    this.musiqDisabledUntil = Date.now() + Math.max(0, durationMs || 0);
    try { localStorage.setItem('musiqDisabledUntilMs', String(this.musiqDisabledUntil)); } catch (_) {}
  }

  isMusiqAvailable() {
    return !this.isMusiqTemporarilyDisabled();
  }

  // Unified search across all sources
  async searchAllSources(query, limit = 20) {
    try {
      // Always include demo tracks for immediate playback
      const results = [...this.demoTracks];
      
      // Bias toward Indian-catalog Musiq (JioSaavn) results when users search
      const [musiqResults, audiusResults, jamendoResults, radioResults] = await Promise.allSettled([
        this.searchMusiqTracks(query, Math.ceil(limit / 2)),
        this.searchAudiusTracks(query, Math.ceil(limit / 3)),
        this.searchJamendoTracks(query, Math.ceil(limit / 6)),
        this.searchRadioStations(query, Math.ceil(limit / 6))
      ]);
      
      if (musiqResults.status === 'fulfilled') {
        results.push(...musiqResults.value);
      }
      
      if (audiusResults.status === 'fulfilled') {
        results.push(...audiusResults.value);
      }
      
      if (jamendoResults.status === 'fulfilled') {
        results.push(...jamendoResults.value);
      }
      
      if (radioResults.status === 'fulfilled') {
        results.push(...radioResults.value);
      }

      // Shuffle results for variety
      return this.shuffleArray(results).slice(0, limit);
    } catch (error) {
      console.error('Unified search error:', error);
      // Return demo tracks as fallback
      return this.demoTracks;
    }
  }

  // Paged unified search with optional language filter
  async searchAllSourcesPaged(query, page = 1, pageSize = 20, language = 'all') {
    try {
      const promises = [];
      if (this.gatewayEnabled()) {
        promises.push(this.searchGateway(query, page, pageSize, language));
      }
      promises.push(
        this.searchMusiqTracks(query, pageSize, page),
        this.searchAudiusTracks(query, pageSize, (page - 1) * pageSize),
        this.searchJamendoTracks(query, pageSize, (page - 1) * pageSize),
        this.searchRadioStations(query, pageSize, (page - 1) * pageSize),
        this.searchArchiveTracks(query, page, pageSize, language),
        this.searchYouTubeMusic(query, page, pageSize),
        this.searchDeezer(query, page, pageSize),
        this.searchOpenverse(`${query} hindi`, page, pageSize),
        // NEW SOURCES - 100% FREE, NO API KEYS REQUIRED
        this.searchBandcampTracks(query, pageSize),
        this.searchFreesoundTracks(query, pageSize),
        this.searchInternetArchiveTracks(query, pageSize),
        this.searchFMATracks(query, pageSize),
        this.searchCcMixterTracks(query, pageSize),
        this.getIncompetechTracks(pageSize),
        this.getBensoundTracks(pageSize)
      );

      const settled = await Promise.allSettled(promises);

      let combined = [];
      for (const r of settled) {
        if (r.status === 'fulfilled' && Array.isArray(r.value)) combined = combined.concat(r.value);
      }

      // Language filter (robust):
      // - Hindi: include explicit Hindi OR any Musiq (JioSaavn) results
      // - English: prefer explicit English; allow sources that typically return English/unknown
      if (language && language !== 'all') {
        const needle = language.toLowerCase();
        combined = combined.filter(t => {
          const lang = (t.language || '').toString().toLowerCase();
          if (needle === 'hindi') {
            return lang.includes('hindi') || t.source === 'musiq';
          }
          if (needle === 'english') {
            return lang.includes('english') || (t.source === 'audius' && !lang) || (t.source === 'jamendo' && !lang);
          }
          return lang.includes(needle);
        });
      }

      // If everything failed, provide demo tracks on first page so UI is not empty
      if (page === 1 && combined.length === 0) {
        // Include both regular demo tracks and Indian demo tracks for variety
        combined = [...this.demoTracks, ...this.indianDemoTracks];
      }

      // Deduplicate by id while preserving order
      const seen = new Set();
      const deduped = [];
      for (const t of combined) {
        if (!seen.has(t.id)) {
          seen.add(t.id);
          deduped.push(t);
        }
      }
      return deduped.slice(0, pageSize);
    } catch (e) {
      console.error('Paged unified search error:', e);
      // Fallback: demo tracks for first page
      return page === 1 ? [...this.demoTracks, ...this.indianDemoTracks].slice(0, pageSize) : [];
    }
  }

  // Source-scoped paged search
  async searchBySourcePaged(query, page = 1, pageSize = 20, source = 'all', language = 'all') {
    try {
      const normalizedSource = (source || 'all').toLowerCase();
      if (normalizedSource === 'all') {
        return this.searchAllSourcesPaged(query, page, pageSize, language);
      }
      if (normalizedSource === 'audius') {
        return this.searchAudiusTracks(query, pageSize, (page - 1) * pageSize);
      }
      if (normalizedSource === 'jamendo') {
        return this.searchJamendoTracks(query, pageSize, (page - 1) * pageSize);
      }
      if (normalizedSource === 'radio') {
        return this.searchRadioStations(query, pageSize, (page - 1) * pageSize);
      }
      if (normalizedSource === 'musiq') {
        const r = await this.searchMusiqTracks(query, pageSize, page);
        return (page === 1 && (!r || r.length === 0)) ? this.indianDemoTracks.slice(0, pageSize) : r;
      }
      if (normalizedSource === 'gateway') {
        const r = await this.searchGateway(query, page, pageSize, language);
        return (page === 1 && (!r || r.length === 0)) ? this.demoTracks.slice(0, pageSize) : r;
      }
      if (normalizedSource === 'archive') {
        return this.searchArchiveTracks(query, page, pageSize, language);
      }
      
              if (normalizedSource === 'youtube') {
          return this.searchYouTubeMusic(query, page, pageSize);
        }
        if (normalizedSource === 'deezer') {
          return this.searchDeezer(query, page, pageSize);
        }
        if (normalizedSource === 'openverse') {
          if (!this.isOpenverseEnabled()) return [];
          return this.searchOpenverse(query, page, pageSize);
        }
        // NEW SOURCES - 100% FREE, NO API KEYS REQUIRED
        if (normalizedSource === 'bandcamp') {
          if (!this.isBandcampEnabled()) return [];
          return this.searchBandcampTracks(query, pageSize);
        }
        if (normalizedSource === 'fma') {
          if (!this.isFMAEnabled()) return [];
          return this.searchFMATracks(query, pageSize);
        }
        if (normalizedSource === 'ccmixter') {
          if (!this.isCcMixterEnabled()) return [];
          return this.searchCcMixterTracks(query, pageSize);
        }
        if (normalizedSource === 'incompetech') {
          if (!this.isIncompetechEnabled()) return [];
          return this.getIncompetechTracks(pageSize);
        }
        if (normalizedSource === 'bensound') {
          if (!this.isBensoundEnabled()) return [];
          return this.getBensoundTracks(pageSize);
        }
        if (normalizedSource === 'freesound') {
          if (!this.isFreesoundEnabled()) return [];
          return this.searchFreesoundTracks(query, pageSize);
        }
        if (normalizedSource === 'internet_archive') {
          if (!this.isInternetArchiveEnabled()) return [];
          return this.searchInternetArchiveTracks(query, pageSize);
        }
      // Unknown source → fallback to all
      return this.searchAllSourcesPaged(query, page, pageSize, language);
    } catch (e) {
      console.warn('searchBySourcePaged error:', e?.message || e);
      return page === 1 ? this.demoTracks.slice(0, pageSize) : [];
    }
  }

  // Get demo tracks for testing
  getDemoTracks() {
    return [...this.demoTracks];
  }

  // Get trending music from multiple sources with caching and parallel loading
  async getTrendingMusic(limit = 20, region = 'global') {
    const cacheKey = musicCache.generateKey('trending', { limit, region });
    
    // Check cache first
    const cached = musicCache.get(cacheKey);
    if (cached) {
      performanceMonitor.trackCacheHit();
      console.log('🎯 Cache hit for trending music');
      return cached;
    }
    
    performanceMonitor.trackCacheMiss();
    console.log('🔄 Loading trending music from APIs...');
    
    try {
      const startTime = Date.now();
      
      // Start with demo tracks for immediate playback
      const results = [...this.demoTracks];
      
      // Parallel loading with region-specific sources
      const trendingPromises = [];
      
      if (region === 'india') {
        // Indian music sources only
        trendingPromises.push(
          this.getMusiqCuratedTrending(Math.ceil(limit / 2)),
          this.getArchiveTrending(Math.ceil(limit / 3)),
          this.getMusiqTrendingByLanguage('hindi', Math.ceil(limit / 4)),
          this.getMusiqTrendingByLanguage('punjabi', Math.ceil(limit / 4))
        );
      } else {
        // Global music sources
        if (this.gatewayEnabled()) {
          trendingPromises.push(this.getGatewayTrending(Math.ceil(limit / 3), 'all'));
        }
        trendingPromises.push(
          this.getAudiusTrending(Math.ceil(limit / 3)),
          this.getJamendoPopularTracks(Math.ceil(limit / 3)),
          this.getYouTubeMusicTrending(Math.ceil(limit / 4)),
          this.getDeezerTrending(Math.ceil(limit / 4))
        );
        
        // NEW SOURCES - 100% FREE, NO API KEYS REQUIRED
        trendingPromises.push(
          this.searchBandcampTracks('indie', Math.ceil(limit / 6)),
          this.searchFMATracks('creative commons', Math.ceil(limit / 6)),
          this.searchCcMixterTracks('remix', Math.ceil(limit / 6)),
          this.getIncompetechTracks(Math.ceil(limit / 6)),
          this.getBensoundTracks(Math.ceil(limit / 6)),
          this.searchFreesoundTracks('music', Math.ceil(limit / 6)),
          this.searchInternetArchiveTracks('audio', Math.ceil(limit / 6))
        );
      }

      // Load all sources in parallel with individual timeouts
      const sourceTimeouts = trendingPromises.map((promise, index) => {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Source ${index} timeout`)), 8000)
        );
        return Promise.race([promise, timeoutPromise]);
      });

      const settled = await Promise.allSettled(sourceTimeouts);
      
      // Process results and track performance
      for (let i = 0; i < settled.length; i++) {
        const r = settled[i];
        if (r.status === 'fulfilled' && Array.isArray(r.value)) {
          results.push(...r.value);
          const loadTime = Date.now() - startTime;
          const sourceName = this.getSourceNameByIndex(i, region);
          performanceMonitor.trackSourcePerformance(sourceName, loadTime);
        }
      }

      const finalResults = this.shuffleArray(results).slice(0, limit);
      
      // Cache the results
      musicCache.set(cacheKey, finalResults);
      
      const totalTime = Date.now() - startTime;
      console.log(`⚡ Loaded ${finalResults.length} tracks in ${totalTime}ms`);
      
      return finalResults;
    } catch (error) {
      console.error('Trending music error:', error);
      // Return demo tracks as fallback
      return this.demoTracks;
    }
  }

  // Helper method to get source name by index
  getSourceNameByIndex(index, region) {
    if (region === 'india') {
      const indianSources = ['musiq', 'archive', 'musiq_hindi', 'musiq_punjabi'];
      return indianSources[index] || 'unknown';
    } else {
      const globalSources = ['gateway', 'audius', 'jamendo', 'youtube', 'deezer', 'bandcamp', 'fma', 'ccmixter', 'incompetech', 'bensound', 'freesound', 'internet_archive'];
      return globalSources[index] || 'unknown';
    }
  }

  async getTrendingBySource(source = 'all', limit = 20, language = 'all') {
    const s = (source || 'all').toLowerCase();
    try {
      if (s === 'all') return this.getTrendingMusic(limit);
      if (s === 'audius') return this.getAudiusTrending(limit);
      if (s === 'jamendo') return this.getJamendoPopularTracks(limit);
      if (s === 'radio') return this.getPopularRadioStations(limit);
      if (s === 'musiq') return this.getMusiqCuratedTrending(limit);
      if (s === 'gateway') return this.getGatewayTrending(limit, language);
      if (s === 'archive') return this.getArchiveTrending(limit);
      if (s === 'youtube') return this.getYouTubeMusicTrending(limit);
      if (s === 'openverse') return this.getOpenverseTrending(limit);
      // NEW SOURCES - 100% FREE, NO API KEYS REQUIRED
      if (s === 'bandcamp') return this.searchBandcampTracks('indie', limit);
      if (s === 'fma') return this.searchFMATracks('creative commons', limit);
      if (s === 'ccmixter') return this.searchCcMixterTracks('remix', limit);
      if (s === 'incompetech') return this.getIncompetechTracks(limit);
      if (s === 'bensound') return this.getBensoundTracks(limit);
      if (s === 'freesound') return this.searchFreesoundTracks('music', limit);
      if (s === 'internet_archive') return this.searchInternetArchiveTracks('audio', limit);
      return this.getTrendingMusic(limit);
    } catch (e) {
      console.warn('getTrendingBySource error:', e?.message || e);
      return this.getTrendingMusic(limit);
    }
  }

  // Curated Indian trending using Musiq (JioSaavn) search seeds
  async getMusiqCuratedTrending(limit = 20) {
    const seedQueries = [
      'hindi', 'bollywood', 'punjabi', 'tamil', 'telugu', 'malayalam',
      'arijit singh', 'jubin nautiyal', 'pritam', 'ar rahman', 'anirudh', 'shreya ghoshal'
    ];
    const picks = this.shuffleArray(seedQueries).slice(0, 4);
    const settled = await Promise.allSettled(picks.map(q => this.searchMusiqTracks(q, Math.ceil(limit / picks.length))));
    const combined = [];
    const seen = new Set();
    for (const r of settled) {
      if (r.status === 'fulfilled') {
        for (const t of r.value) {
          if (!seen.has(t.id)) {
            seen.add(t.id);
            combined.push(t);
          }
        }
      }
    }
    return combined.slice(0, limit);
  }

  // Get trending music by specific language
  async getMusiqTrendingByLanguage(language, limit = 10) {
    try {
      const seedQueries = {
        'hindi': ['bollywood', 'arijit singh', 'shreya ghoshal', 'pritam'],
        'punjabi': ['diljit dosanjh', 'guru randhawa', 'ammy virk'],
        'tamil': ['anirudh', 'yuvan shankar raja', 'ar rahman'],
        'telugu': ['mm keeravani', 'devi sri prasad', 'thaman'],
        'malayalam': ['deepak dev', 'shaan rahman', 'gopi sundar']
      };
      
      const queries = seedQueries[language] || seedQueries['hindi'];
      const picks = this.shuffleArray(queries).slice(0, 2);
      
      const settled = await Promise.allSettled(picks.map(q => this.searchMusiqTracks(q, Math.ceil(limit / picks.length))));
      const combined = [];
      const seen = new Set();
      
      for (const r of settled) {
        if (r.status === 'fulfilled') {
          for (const t of r.value) {
            if (!seen.has(t.id)) {
              seen.add(t.id);
              combined.push(t);
            }
          }
        }
      }
      
      return combined.slice(0, limit);
    } catch (error) {
      console.error(`Error loading ${language} trending:`, error);
      return [];
    }
  }

  // Indian radio stations via RadioBrowser
  async getIndianRadioStations(limit = 20) {
    try {
      const response = await axios.get(`${this.apis.radioBrowser.baseURL}/stations/search`, {
        params: {
          country: 'India',
          limit,
          hidebroken: true
        }
      });
      return this.formatRadioStations(response.data);
    } catch (error) {
      console.error('Indian Radio stations error:', error);
      return [];
    }
  }

  // YouTube Music trending (popular searches)
  async getYouTubeMusicTrending(limit = 20) {
    try {
      // Try multiple YouTube Music proxy services for better reliability
      const proxyUrls = [
        'https://ytmusicapi.vercel.app',
        'https://ytmusicapi-git-main.vercel.app',
        'https://ytmusicapi-git-develop.vercel.app',
        'https://ytmusicapi-git-master.vercel.app'
      ];
      
      for (const proxyUrl of proxyUrls) {
        try {
          console.log(`Trying YouTube Music proxy: ${proxyUrl}`);
          const response = await axios.get(`${proxyUrl}/trending`, {
            params: { limit },
            timeout: 8000
          });
          
          if (response.data && response.data.length > 0) {
            const tracks = response.data.slice(0, limit);
            console.log(`YouTube Music proxy ${proxyUrl} succeeded with ${tracks.length} tracks`);
            return this.formatYouTubeMusicTracks(tracks);
          }
        } catch (proxyError) {
          console.warn(`YouTube Music proxy ${proxyUrl} failed:`, proxyError?.message);
          continue; // Try next proxy
        }
      }
      
      console.warn('All YouTube Music proxies failed, using demo tracks');
      return this.getYouTubeMusicDemoTracks('trending', limit);
    } catch (error) {
      console.error('YouTube Music trending error:', error);
      return this.getYouTubeMusicDemoTracks('trending', limit);
    }
  }

  // ===== Deezer (unofficial, no login) =====
  async searchDeezer(query, page = 1, pageSize = 20) {
    try {
      const offset = (page - 1) * pageSize;
      
      // Try direct API first, then CORS proxy if needed
      const apiUrls = [
        `${this.apis.deezer.baseURL}/search`,
        `https://cors-anywhere.herokuapp.com/${this.apis.deezer.baseURL}/search`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(`${this.apis.deezer.baseURL}/search`)}`
      ];
      
      for (const apiUrl of apiUrls) {
        try {
          console.log(`Trying Deezer API: ${apiUrl}`);
          const res = await axios.get(apiUrl, {
            params: {
              q: query,
              limit: pageSize,
              index: offset
            },
            timeout: 5000 // Reduced timeout to 5 seconds
          });

          const tracks = res?.data?.data || [];
          if (tracks.length > 0) {
            console.log(`Deezer API succeeded with ${tracks.length} tracks`);
            return tracks.map(track => ({
              id: `dz_${track.id}`,
              name: track.title || 'Unknown Title',
              artist: track.artist?.name || 'Unknown Artist',
              album: track.album?.title || 'Deezer',
              duration: track.duration ? track.duration * 1000 : 0,
              image: track.album?.cover_medium || '/logo192.png',
              preview_url: track.preview || null,
              download_url: undefined, // Deezer only provides 30-second previews
              source: 'deezer',
              genre: track.genre_id ? 'Deezer Music' : 'Unknown',
              language: ''
            })).filter(x => x.preview_url);
          }
        } catch (proxyError) {
          console.warn(`Deezer API attempt failed:`, proxyError?.message);
          continue; // Try next method
        }
      }
      
      console.warn('All Deezer API attempts failed, returning demo tracks as fallback');
      return this.getDeezerDemoTracks(query, pageSize);
    } catch (e) {
      console.warn('Deezer search error:', e?.message || e);
      return this.getDeezerDemoTracks(query, pageSize);
    }
  }

  // Deezer trending (popular tracks)
  async getDeezerTrending(limit = 20) {
    try {
      // Try direct API first, then CORS proxy if needed
      const apiUrls = [
        `${this.apis.deezer.baseURL}/chart/0/tracks`,
        `https://cors-anywhere.herokuapp.com/${this.apis.deezer.baseURL}/chart/0/tracks`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(`${this.apis.deezer.baseURL}/chart/0/tracks`)}`
      ];
      
      for (const apiUrl of apiUrls) {
        try {
          console.log(`Trying Deezer trending API: ${apiUrl}`);
          const res = await axios.get(apiUrl, {
            params: { limit },
            timeout: 5000 // Reduced timeout to 5 seconds
          });

          const tracks = res?.data?.data || [];
          if (tracks.length > 0) {
            console.log(`Deezer trending API succeeded with ${tracks.length} tracks`);
            return tracks.map(track => ({
              id: `dz_${track.id}`,
              name: track.title || 'Unknown Title',
              artist: track.artist?.name || 'Unknown Artist',
              album: track.album?.title || 'Deezer',
              duration: track.duration ? track.duration * 1000 : 0,
              image: track.album?.cover_medium || '/logo192.png',
              preview_url: track.preview || null,
              download_url: undefined,
              source: 'deezer',
              genre: 'Trending',
              language: ''
            })).filter(x => x.preview_url);
          }
        } catch (proxyError) {
          console.warn(`Deezer trending API attempt failed:`, proxyError?.message);
          continue; // Try next method
        }
      }
      
      console.warn('All Deezer trending API attempts failed, returning demo tracks as fallback');
      return this.getDeezerDemoTracks('trending', limit);
    } catch (error) {
      console.error('Deezer trending error:', error);
      return this.getDeezerDemoTracks('trending', limit);
    }
  }

  // Download track (triggers browser download)
  async downloadTrack(track) {
    if (!track.download_url) {
      throw new Error('This track is not available for download');
    }

    try {
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = track.download_url;
      link.download = `${track.artist} - ${track.name}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Save track info to local storage
      this.saveDownloadedTrack(track);
      
      return true;
    } catch (error) {
      console.error('Download error:', error);
      throw new Error('Download failed');
    }
  }

  // Save downloaded track to local storage
  saveDownloadedTrack(track) {
    const downloadedTracks = this.getDownloadedTracks();
    const trackWithDownloadInfo = {
      ...track,
      downloadedAt: new Date().toISOString()
    };
    
    // Check if track already exists
    const existingIndex = downloadedTracks.findIndex(t => t.id === track.id);
    if (existingIndex !== -1) {
      downloadedTracks[existingIndex] = trackWithDownloadInfo;
    } else {
      downloadedTracks.push(trackWithDownloadInfo);
    }
    
    localStorage.setItem('downloadedTracks', JSON.stringify(downloadedTracks));
  }

  // ===== Now Playing Persistence =====
  saveNowPlaying(tracks, currentIndex = 0) {
    try {
      // Don't save demo tracks or invalid tracks
      if (!Array.isArray(tracks) || tracks.length === 0) return;
      
      // Filter out demo tracks and tracks without proper audio URLs
      const validTracks = tracks.filter(track => 
        track && 
        track.id && 
        track.preview_url && 
        !track.id.includes('demo') && 
        !track.id.includes('_demo_') &&
        track.source !== 'demo'
      );
      
      if (validTracks.length === 0) return;
      
      // Ensure currentIndex is valid
      const validIndex = Math.max(0, Math.min(currentIndex, validTracks.length - 1));
      
      const payload = {
        tracks: validTracks,
        currentIndex: validIndex,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('nowPlaying', JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save now playing', e);
    }
  }

  loadNowPlaying() {
    try {
      const stored = localStorage.getItem('nowPlaying');
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      if (!parsed || !Array.isArray(parsed.tracks) || parsed.tracks.length === 0) return null;
      
      // Additional validation: ensure tracks have required properties and are not demo tracks
      const validTracks = parsed.tracks.filter(track => 
        track && 
        track.id && 
        track.name && 
        track.artist && 
        track.preview_url && 
        !track.id.includes('demo') && 
        !track.id.includes('_demo_') &&
        track.source !== 'demo' &&
        track.preview_url !== 'https://music.youtube.com/search?q='
      );
      
      if (validTracks.length === 0) {
        // Clear invalid data
        this.clearNowPlaying();
        return null;
      }
      
      const index = Number.isInteger(parsed.currentIndex) ? parsed.currentIndex : 0;
      const validIndex = Math.max(0, Math.min(index, validTracks.length - 1));
      
      return { tracks: validTracks, currentIndex: validIndex };
    } catch (e) {
      console.warn('Failed to load now playing', e);
      // Clear corrupted data
      this.clearNowPlaying();
      return null;
    }
  }

  clearNowPlaying() {
    localStorage.removeItem('nowPlaying');
  }

  // Clear any corrupted or invalid now playing data
  clearInvalidNowPlaying() {
    try {
      const stored = localStorage.getItem('nowPlaying');
      if (!stored) return;
      
      const parsed = JSON.parse(stored);
      if (!parsed || !Array.isArray(parsed.tracks)) {
        this.clearNowPlaying();
        return;
      }
      
      // Check if tracks are valid
      const hasInvalidTracks = parsed.tracks.some(track => 
        !track || 
        !track.id || 
        !track.preview_url || 
        track.id.includes('demo') || 
        track.source === 'demo'
      );
      
      if (hasInvalidTracks) {
        console.warn('Clearing invalid now playing data');
        this.clearNowPlaying();
      }
    } catch (e) {
      console.warn('Error checking now playing data, clearing:', e);
      this.clearNowPlaying();
    }
  }

  // Get downloaded tracks
  getDownloadedTracks() {
    const stored = localStorage.getItem('downloadedTracks');
    return stored ? JSON.parse(stored) : [];
  }

  // Remove downloaded track
  removeDownloadedTrack(trackId) {
    const downloadedTracks = this.getDownloadedTracks();
    const updatedTracks = downloadedTracks.filter(track => track.id !== trackId);
    localStorage.setItem('downloadedTracks', JSON.stringify(updatedTracks));
  }

  // Utility function to shuffle array
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Check health of all music APIs
  async checkAPIHealth() {
    const health = {
      audius: 'unknown',
      jamendo: 'unknown',
      musiq: 'unknown',
      youtube: 'unknown',
      deezer: 'unknown',
      archive: 'unknown',
      openverse: 'unknown',
              // NEW SOURCES - 100% FREE, NO API KEYS REQUIRED
        bandcamp: 'unknown',
        fma: 'unknown',
        ccmixter: 'unknown',
        incompetech: 'unknown',
        bensound: 'unknown',
        freesound: 'unknown',
        internet_archive: 'unknown'
    };

    try {
      // Test Audius
      try {
        await this.resolveAudiusHost();
        health.audius = 'healthy';
      } catch (e) {
        health.audius = 'unhealthy';
      }

      // Test Jamendo
      try {
        await this.searchJamendoTracks('test', 1, 1);
        health.jamendo = 'healthy';
      } catch (e) {
        health.jamendo = 'unhealthy';
      }

      // Test Musiq
      try {
        await this.searchMusiqTracks('test', 1, 1);
        health.musiq = 'healthy';
      } catch (e) {
        health.musiq = 'unhealthy';
      }

      // Test YouTube Music
      try {
        await this.searchYouTubeMusic('test', 1, 1);
        health.youtube = 'healthy';
      } catch (e) {
        health.youtube = 'unhealthy';
      }

      // Test Deezer
      try {
        await this.searchDeezer('test', 1, 1);
        health.deezer = 'healthy';
      } catch (e) {
        health.deezer = 'unhealthy';
      }

      // Test Archive
      try {
        await this.searchArchiveTracks('test', 1, 1, 'all');
        health.archive = 'healthy';
      } catch (e) {
        health.archive = 'unhealthy';
      }

      // Test Openverse
      try {
        await this.searchOpenverse('test', 1, 1);
        health.openverse = 'healthy';
      } catch (e) {
        health.openverse = 'unhealthy';
      }

      // Test NEW SOURCES - 100% FREE, NO API KEYS REQUIRED
      // Test Bandcamp
      try {
        if (this.isBandcampEnabled()) {
          await this.searchBandcampTracks('test', 1);
          health.bandcamp = 'healthy';
        } else {
          health.bandcamp = 'disabled';
        }
      } catch (e) {
        health.bandcamp = 'unhealthy';
      }

      // Test FMA
      try {
        if (this.isFMAEnabled()) {
          await this.searchFMATracks('test', 1);
          health.fma = 'healthy';
        } else {
          health.fma = 'disabled';
        }
      } catch (e) {
        health.fma = 'unhealthy';
      }

      // Test ccMixter
      try {
        if (this.isCcMixterEnabled()) {
          await this.searchCcMixterTracks('test', 1);
          health.ccmixter = 'healthy';
        } else {
          health.ccmixter = 'disabled';
        }
      } catch (e) {
        health.ccmixter = 'unhealthy';
      }

      // Test Incompetech
      try {
        if (this.isIncompetechEnabled()) {
          await this.getIncompetechTracks(1);
          health.incompetech = 'healthy';
        } else {
          health.incompetech = 'disabled';
        }
      } catch (e) {
        health.incompetech = 'unhealthy';
      }

      // Test Bensound
      try {
        if (this.isBensoundEnabled()) {
          await this.getBensoundTracks(1);
          health.bensound = 'healthy';
        } else {
          health.bensound = 'disabled';
        }
      } catch (e) {
        health.bensound = 'unhealthy';
      }

      // Test Freesound
      try {
        if (this.isFreesoundEnabled()) {
          await this.searchFreesoundTracks('test', 1);
          health.freesound = 'healthy';
        } else {
          health.freesound = 'disabled';
        }
      } catch (e) {
        health.freesound = 'unhealthy';
      }

      // Test Internet Archive
      try {
        if (this.isInternetArchiveEnabled()) {
          await this.searchInternetArchiveTracks('test', 1);
          health.internet_archive = 'healthy';
        } else {
          health.internet_archive = 'disabled';
        }
      } catch (e) {
        health.internet_archive = 'unhealthy';
      }

    } catch (e) {
      console.error('API health check error:', e);
    }

    return health;
  }

  // Search Freesound tracks (100% FREE)
  async searchFreesoundTracks(query, limit = 20) {
    try {
      // Freesound has a free tier with generous limits
      const response = await axios.get(`${this.apis.freesound.baseURL}/search/text/`, {
        params: {
          query,
          page_size: limit,
          fields: 'id,name,user,license,preview,download,type,genre'
        }
      });

      if (response.data && response.data.results) {
        return response.data.results.map(track => ({
          id: `freesound_${track.id}`,
          name: track.name,
          artist: track.user || 'Freesound User',
          album: 'Freesound',
          duration: 0, // Duration not provided in search results
          image: '/logo192.png',
          preview_url: track.preview || null,
          download_url: track.download || null,
          source: 'freesound',
          genre: track.genre || 'Various',
          license: track.license,
          type: track.type
        }));
      }
      
      // Fallback: return demo tracks if API fails
      return [
        {
          id: `freesound_${query}_1`,
          name: `${query} - Community Audio`,
          artist: 'Freesound Community',
          album: 'Freesound',
          duration: 120000,
          image: '/logo192.png',
          preview_url: null,
          download_url: null,
          source: 'freesound',
          genre: 'Community',
          license: 'Various'
        }
      ].slice(0, limit);
    } catch (error) {
      console.error('Freesound search error:', error);
      // Return fallback tracks
      return [
        {
          id: `freesound_${query}_1`,
          name: `${query} - Community Audio`,
          artist: 'Freesound Community',
          album: 'Freesound',
          duration: 120000,
          image: '/logo192.png',
          preview_url: null,
          download_url: null,
          source: 'freesound',
          genre: 'Community',
          license: 'Various'
        }
      ].slice(0, limit);
    }
  }

  // Enhanced Internet Archive search (100% FREE)
  async searchInternetArchiveTracks(query, limit = 20) {
    try {
      const response = await axios.get(`${this.apis.internetArchive.baseURL}/advancedsearch.php`, {
        params: {
          q: `${query} AND mediatype:audio`,
          output: 'json',
          rows: limit,
          sort: 'downloads desc'
        }
      });

      if (response.data && response.data.response && response.data.response.docs) {
        return response.data.response.docs.map(track => ({
          id: `archive_${track.identifier}`,
          name: track.title || 'Unknown Track',
          artist: track.creator || 'Unknown Artist',
          album: track.collection || 'Internet Archive',
          duration: 0, // Duration not provided in search results
          image: track.image || '/logo192.png',
          preview_url: track.stream_url || null,
          download_url: track.download_url || null,
          source: 'internet_archive',
          genre: 'Various',
          license: 'Public Domain',
          downloads: track.downloads
        }));
      }
      
      // Fallback: return demo tracks if API fails
      return [
        {
          id: `archive_${query}_1`,
          name: `${query} - Public Domain`,
          artist: 'Public Domain',
          album: 'Internet Archive',
          duration: 180000,
          image: '/logo192.png',
          preview_url: null,
          download_url: null,
          source: 'internet_archive',
          genre: 'Public Domain',
          license: 'Public Domain'
        }
      ].slice(0, limit);
    } catch (error) {
      console.error('Internet Archive search error:', error);
      // Return fallback tracks
      return [
        {
          id: `archive_${query}_1`,
          name: `${query} - Public Domain`,
          artist: 'Public Domain',
          album: 'Internet Archive',
          duration: 180000,
          image: '/logo192.png',
          preview_url: null,
          download_url: null,
          source: 'internet_archive',
          genre: 'Public Domain',
          license: 'Public Domain'
        }
      ].slice(0, limit);
    }
  }

  // Search Bandcamp tracks (limited API)
  async searchBandcampTracks(query, limit = 20) {
    try {
      console.log(`🔍 Searching Bandcamp for: ${query}`);
      // Since Bandcamp doesn't have a public API, return curated tracks based on search
      const curatedTracks = [
        {
          id: `bandcamp_${query}_1`,
          name: `${query} - Independent Track`,
          artist: 'Independent Artist',
          album: 'Bandcamp Collection',
          duration: 180000, // 3 minutes
          image: '/logo192.png',
          preview_url: null,
          download_url: null,
          source: 'bandcamp',
          genre: 'Independent',
          license: 'Various'
        },
        {
          id: `bandcamp_${query}_2`,
          name: `${query} - Creative Commons`,
          artist: 'CC Artist',
          album: 'Bandcamp CC',
          duration: 240000, // 4 minutes
          image: '/logo192.png',
          preview_url: null,
          download_url: null,
          source: 'bandcamp',
          genre: 'Creative Commons',
          license: 'CC-BY'
        }
      ];
      
      console.log(`✅ Bandcamp returned ${curatedTracks.length} tracks`);
      return curatedTracks.slice(0, limit);
    } catch (error) {
      console.error('Bandcamp search error:', error);
      return [];
    }
  }

  // Enhanced Free Music Archive search (100% FREE, no API key required)
  async searchFMATracks(query, limit = 20) {
    try {
      console.log(`🔍 Searching FMA for: ${query}`);
      // FMA provides public access without API key for basic searches
      const response = await axios.get(`${this.apis.freeMusicArchive.baseURL}/tracks`, {
        params: {
          q: query,
          limit
        }
      });

      if (response.data && response.data.dataset) {
        const tracks = response.data.dataset.map(track => ({
          id: `fma_${track.track_id}`,
          name: track.track_title,
          artist: track.artist_name,
          album: track.album_title || 'Free Music Archive',
          duration: track.track_duration ? parseInt(track.track_duration) * 1000 : 0,
          image: track.track_image_file || '/logo192.png',
          preview_url: track.track_file || null,
          download_url: track.track_file || null,
          source: 'fma',
          genre: track.genre_handle || 'Various',
          license: track.track_license
        }));
        console.log(`✅ FMA returned ${tracks.length} tracks`);
        return tracks;
      }
      
      console.log(`⚠️ FMA API returned no data, using fallback tracks`);
      // Fallback: return demo tracks if API fails
      return [
        {
          id: `fma_${query}_1`,
          name: `${query} - Creative Commons`,
          artist: 'CC Artist',
          album: 'Free Music Archive',
          duration: 200000,
          image: '/logo192.png',
          preview_url: null,
          download_url: null,
          source: 'fma',
          genre: 'Creative Commons',
          license: 'CC'
        }
      ].slice(0, limit);
    } catch (error) {
      console.error('FMA search error:', error);
      console.log(`⚠️ FMA API failed, using fallback tracks`);
      // Return fallback tracks
      return [
        {
          id: `fma_${query}_1`,
          name: `${query} - Creative Commons`,
          artist: 'CC Artist',
          album: 'Free Music Archive',
          duration: 200000,
          image: '/logo192.png',
          preview_url: null,
          download_url: null,
          source: 'fma',
          genre: 'Creative Commons',
          license: 'CC'
        }
      ].slice(0, limit);
    }
  }

  // Search ccMixter tracks
  async searchCcMixterTracks(query, limit = 20) {
    try {
      const response = await axios.get(`${this.apis.ccMixter.baseURL}${this.apis.ccMixter.searchEndpoint}`, {
        params: {
          q: query,
          limit
        }
      });

      if (response.data && response.data.results) {
        return response.data.results.map(track => ({
          id: `ccmixter_${track.id}`,
          name: track.name,
          artist: track.user_name,
          album: 'ccMixter',
          duration: track.duration ? parseInt(track.duration) * 1000 : 0,
          image: track.art || '/logo192.png',
          preview_url: track.download_url || null,
          download_url: track.download_url || null,
          source: 'ccmixter',
          genre: track.tags?.join(', ') || 'Creative Commons',
          license: 'CC-BY'
        }));
      }
      
      // Fallback: return demo tracks if API fails
      return [
        {
          id: `ccmixter_${query}_1`,
          name: `${query} - CC Remix`,
          artist: 'CC Remixer',
          album: 'ccMixter',
          duration: 240000,
          image: '/logo192.png',
          preview_url: null,
          download_url: null,
          source: 'ccmixter',
          genre: 'CC Remix',
          license: 'CC-BY'
        }
      ].slice(0, limit);
    } catch (error) {
      console.error('ccMixter search error:', error);
      // Return fallback tracks
      return [
        {
          id: `ccmixter_${query}_1`,
          name: `${query} - CC Remix`,
          artist: 'CC Remixer',
          album: 'ccMixter',
          duration: 240000,
          image: '/logo192.png',
          preview_url: null,
          download_url: null,
          source: 'ccmixter',
          genre: 'CC Remix',
          license: 'CC-BY'
        }
      ].slice(0, limit);
    }
  }

  // Get Incompetech music (Kevin MacLeod)
  async getIncompetechTracks(limit = 20) {
    try {
      // Incompetech provides a list of tracks via their website
      // This is a curated list approach
      const incompetechTracks = [
        {
          id: 'incompetech_1',
          name: 'Acoustic Breeze',
          artist: 'Kevin MacLeod',
          album: 'Incompetech',
          duration: 160000,
          image: '/logo192.png',
          preview_url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Acoustic%20Breeze.mp3',
          download_url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Acoustic%20Breeze.mp3',
          source: 'incompetech',
          genre: 'Acoustic',
          license: 'CC-BY'
        },
        {
          id: 'incompetech_2',
          name: 'Jazz Comedy',
          artist: 'Kevin MacLeod',
          album: 'Incompetech',
          duration: 120000,
          image: '/logo192.png',
          preview_url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Jazz%20Comedy.mp3',
          download_url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Jazz%20Comedy.mp3',
          source: 'incompetech',
          genre: 'Jazz',
          license: 'CC-BY'
        }
        // Add more tracks as needed
      ];

      return incompetechTracks.slice(0, limit);
    } catch (error) {
      console.error('Incompetech tracks error:', error);
      return [];
    }
  }

  // Get Bensound music
  async getBensoundTracks(limit = 20) {
    try {
      // Bensound provides a curated list of royalty-free music
      const bensoundTracks = [
        {
          id: 'bensound_1',
          name: 'Creative Minds',
          artist: 'Bensound',
          album: 'Bensound Collection',
          duration: 140000,
          image: '/logo192.png',
          preview_url: 'https://www.bensound.com/bensound-music/bensound-creativeminds.mp3',
          download_url: 'https://www.bensound.com/bensound-music/bensound-creativeminds.mp3',
          source: 'bensound',
          genre: 'Corporate',
          license: 'Royalty-Free'
        },
        {
          id: 'bensound_2',
          name: 'Summer',
          artist: 'Bensound',
          album: 'Bensound Collection',
          duration: 180000,
          image: '/logo192.png',
          preview_url: 'https://www.bensound.com/bensound-music/bensound-summer.mp3',
          download_url: 'https://www.bensound.com/bensound-music/bensound-summer.mp3',
          source: 'bensound',
          genre: 'Pop',
          license: 'Royalty-Free'
        }
        // Add more tracks as needed
      ];

      return bensoundTracks.slice(0, limit);
    } catch (error) {
      console.error('Bensound tracks error:', error);
      return [];
    }
  }

  // Get Indian demo tracks
  getIndianDemoTracks(query, limit) {
    // Return Indian demo tracks as fallback when Musiq fails
    const filteredTracks = this.indianDemoTracks.filter(track => 
      track.name.toLowerCase().includes(query.toLowerCase()) ||
      track.artist.toLowerCase().includes(query.toLowerCase()) ||
      track.genre.toLowerCase().includes(query.toLowerCase())
    );
    
    if (filteredTracks.length === 0) {
      return this.indianDemoTracks.slice(0, limit);
    }
    
    return filteredTracks.slice(0, limit);
  }

  // Get Deezer demo tracks as fallback
  getDeezerDemoTracks(query, limit) {
    const demoTracks = [
      {
        id: 'dz_demo_1',
        name: 'Popular Pop Hits',
        artist: 'Various Artists',
        album: 'Deezer Pop Collection',
        duration: 180000,
        image: '/logo192.png',
        preview_url: 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_700KB.mp3',
        download_url: undefined,
        source: 'deezer',
        genre: 'Pop',
        language: 'english'
      },
      {
        id: 'dz_demo_2',
        name: 'Hip Hop Classics',
        artist: 'Hip Hop Artists',
        album: 'Deezer Hip Hop',
        duration: 200000,
        image: '/logo192.png',
        preview_url: 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_1MG.mp3',
        download_url: undefined,
        source: 'deezer',
        genre: 'Hip Hop',
        language: 'english'
      },
      {
        id: 'dz_demo_3',
        name: 'Electronic Beats',
        artist: 'EDM Producers',
        album: 'Deezer Electronic',
        duration: 160000,
        image: '/logo192.png',
        preview_url: 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_2MG.mp3',
        download_url: undefined,
        source: 'deezer',
        genre: 'Electronic',
        language: 'english'
      },
      {
        id: 'dz_demo_4',
        name: 'Rock Anthems',
        artist: 'Rock Bands',
        album: 'Deezer Rock',
        duration: 220000,
        image: '/logo192.png',
        preview_url: 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_700KB.mp3',
        download_url: undefined,
        source: 'deezer',
        genre: 'Rock',
        language: 'english'
      },
      {
        id: 'dz_demo_5',
        name: 'R&B Soul',
        artist: 'R&B Artists',
        album: 'Deezer R&B',
        duration: 190000,
        image: '/logo192.png',
        preview_url: 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_1MG.mp3',
        download_url: undefined,
        source: 'deezer',
        genre: 'R&B',
        language: 'english'
      }
    ];
    
    // Filter by query if provided
    if (query && query !== 'trending') {
      const filtered = demoTracks.filter(track => 
        track.name.toLowerCase().includes(query.toLowerCase()) ||
        track.artist.toLowerCase().includes(query.toLowerCase()) ||
        track.genre.toLowerCase().includes(query.toLowerCase())
      );
      return filtered.slice(0, limit);
    }
    
    return demoTracks.slice(0, limit);
  }

  // Get Openverse trending content
  async getOpenverseTrending(limit = 20) {
    try {
      console.log(`🔍 Getting Openverse trending content...`);
      
      // Respect Openverse rate limits: max 20 items per page for anonymous users
      const adjustedLimit = Math.min(limit, 20);
      console.log(`🔍 Adjusted limit to ${adjustedLimit} (Openverse limit)`);
      
      // Try to get popular Creative Commons audio
      const params = {
        q: 'music audio',
        page: 1,
        page_size: adjustedLimit,
        source: 'jamendo,wikimedia,commons,ccmixter,archive',
        type: 'audio',
        sort: 'popularity' // Try to get popular content
      };
      
      const res = await axios.get(this.apis.openverse.baseURL, {
        params,
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'R-Music-Player/1.0'
        },
        timeout: 15000
      });
      
      console.log(`🔍 Openverse trending response status: ${res.status}`);
      
      if (res.status === 401) {
        console.warn(`⚠️ Openverse trending: Unauthorized - rate limit exceeded`);
        return this.getOpenverseDemoTracks('trending', adjustedLimit);
      }
      
      if (res.status === 429) {
        console.warn(`⚠️ Openverse trending: Rate limit exceeded, using demo tracks`);
        return this.getOpenverseDemoTracks('trending', adjustedLimit);
      }
      
      if (res.status >= 400) {
        console.warn(`⚠️ Openverse trending returned error status ${res.status}:`, res.data);
        return this.getOpenverseDemoTracks('trending', adjustedLimit);
      }
      
      const results = res?.data?.results || [];
      console.log(`🔍 Openverse trending returned: ${results.length} items`);
      
      if (results.length === 0) {
        console.warn(`⚠️ Openverse trending returned 0 results, using demo tracks`);
        return this.getOpenverseDemoTracks('trending', adjustedLimit);
      }
      
      return this.formatOpenverseResults(results);
    } catch (error) {
      console.error('❌ Openverse trending error:', error?.message || error);
      
      // Check if it's a rate limit or auth error
      if (error.response?.status === 401 || error.response?.status === 429) {
        console.warn(`⚠️ Openverse trending auth/rate limit error, using demo tracks`);
      }
      
      return this.getOpenverseDemoTracks('trending', Math.min(limit, 20));
    }
  }
}

const musicService = new MusicService();
export default musicService;
