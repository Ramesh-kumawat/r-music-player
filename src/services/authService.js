// Simple authentication service for local user management
class AuthService {
  constructor() {
    this.users = this.loadUsers();
    this.currentUser = this.loadCurrentUser();
  }

  // Load users from localStorage
  loadUsers() {
    const stored = localStorage.getItem('musicApp_users');
    if (stored) {
      return JSON.parse(stored);
    }
    // Create default user
    const defaultUser = {
      id: '1',
      username: 'user',
      email: 'user@musicapp.com',
      password: 'password123', // In production, use proper hashing
      createdAt: new Date().toISOString(),
      playlists: [],
      favorites: []
    };
    this.saveUsers([defaultUser]);
    return [defaultUser];
  }

  // Save users to localStorage
  saveUsers(users) {
    localStorage.setItem('musicApp_users', JSON.stringify(users));
  }

  // Load current user from localStorage
  loadCurrentUser() {
    const stored = localStorage.getItem('musicApp_currentUser');
    return stored ? JSON.parse(stored) : null;
  }

  // Save current user to localStorage
  saveCurrentUser(user) {
    if (user) {
      localStorage.setItem('musicApp_currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('musicApp_currentUser');
    }
  }

  // Register new user
  register(username, email, password) {
    // Check if user already exists
    if (this.users.find(u => u.username === username || u.email === email)) {
      throw new Error('Username or email already exists');
    }

    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password, // In production, hash this password
      createdAt: new Date().toISOString(),
      playlists: [],
      favorites: []
    };

    this.users.push(newUser);
    this.saveUsers(this.users);
    return newUser;
  }

  // Login user
  login(username, password) {
    const user = this.users.find(u => 
      (u.username === username || u.email === username) && u.password === password
    );

    if (!user) {
      throw new Error('Invalid username or password');
    }

    this.currentUser = user;
    this.saveCurrentUser(user);
    return user;
  }

  // Logout user
  logout() {
    this.currentUser = null;
    this.saveCurrentUser(null);
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser;
  }

  // Add track to favorites
  addToFavorites(track) {
    if (!this.currentUser) return false;
    
    if (!this.currentUser.favorites.find(f => f.id === track.id)) {
      this.currentUser.favorites.push(track);
      this.updateUser();
      return true;
    }
    return false;
  }

  // Remove track from favorites
  removeFromFavorites(trackId) {
    if (!this.currentUser) return false;
    
    this.currentUser.favorites = this.currentUser.favorites.filter(f => f.id !== trackId);
    this.updateUser();
    return true;
  }

  // Check if track is in favorites
  isInFavorites(trackId) {
    if (!this.currentUser) return false;
    return this.currentUser.favorites.some(f => f.id === trackId);
  }

  // Create playlist
  createPlaylist(name, description = '') {
    if (!this.currentUser) return null;
    
    const playlist = {
      id: Date.now().toString(),
      name,
      description,
      tracks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.currentUser.playlists.push(playlist);
    this.updateUser();
    return playlist;
  }

  // Add track to playlist
  addTrackToPlaylist(playlistId, track) {
    if (!this.currentUser) return false;
    
    const playlist = this.currentUser.playlists.find(p => p.id === playlistId);
    if (playlist && !playlist.tracks.find(t => t.id === track.id)) {
      playlist.tracks.push(track);
      playlist.updatedAt = new Date().toISOString();
      this.updateUser();
      return true;
    }
    return false;
  }

  // Get user playlists
  getUserPlaylists() {
    return this.currentUser ? this.currentUser.playlists : [];
  }

  // Get user favorites
  getUserFavorites() {
    return this.currentUser ? this.currentUser.favorites : [];
  }

  // Update user data
  updateUser() {
    if (this.currentUser) {
      const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
      if (userIndex !== -1) {
        this.users[userIndex] = this.currentUser;
        this.saveUsers(this.users);
        this.saveCurrentUser(this.currentUser);
      }
    }
  }
}

export default new AuthService();
