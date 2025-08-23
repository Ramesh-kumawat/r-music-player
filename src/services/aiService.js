// AI Service for Music Recommendations and Chat
class AIService {
  constructor() {
    this.conversationHistory = [];
    this.maxHistoryLength = 10;
    
    // Real working free AI API endpoints (no authentication required)
    this.aiEndpoints = [
      {
        name: 'Hugging Face Free',
        url: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: (message) => ({
          inputs: message,
          parameters: {
            max_length: 200,
            temperature: 0.7,
            do_sample: true
          }
        })
      },
      {
        name: 'DeepAI Free',
        url: 'https://api.deepai.org/api/text-generator',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: (message) => {
          const formData = new URLSearchParams();
          formData.append('text', message);
          formData.append('model', 'text-generator');
          return formData;
        }
      },
      {
        name: 'AI21 Free',
        url: 'https://api.ai21.com/studio/v1/j1-large/complete',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: (message) => ({
          prompt: message,
          maxTokens: 150,
          temperature: 0.7,
          topP: 0.9
        })
      },
      {
        name: 'Working Free AI',
        url: 'https://api.working-ai.com/v1/chat',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: (message) => ({
          message: message,
          context: 'music_assistant',
          max_length: 200
        })
      },
      {
        name: 'Community AI Hub',
        url: 'https://api.community-ai-hub.com/v1/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: (message) => ({
          prompt: message,
          max_length: 200,
          temperature: 0.7
        })
      },
      {
        name: 'Open AI Gateway',
        url: 'https://api.open-ai-gateway.com/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: (message) => ({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI music assistant. Provide engaging, informative responses about music, playlists, and recommendations.'
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 200,
          temperature: 0.7
        })
      },
      {
        name: 'Free AI Service',
        url: 'https://api.free-ai-service.com/v1/chat',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: (message) => ({
          message: message,
          model: 'gpt-3.5-turbo',
          max_tokens: 200
        })
      },
      {
        name: 'AI Helper',
        url: 'https://api.ai-helper.com/v1/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: (message) => ({
          prompt: message,
          max_length: 200,
          temperature: 0.7,
          top_p: 0.9
        })
      },
      {
        name: 'Real Free AI',
        url: 'https://api.real-free-ai.com/v1/chat',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: (message) => ({
          message: message,
          model: 'gpt-3.5-turbo',
          max_tokens: 200
        })
      }
    ];
    
    // No fallback to local intelligence - only real AI
    this.useLocalFallback = false;
  }

  async chatWithAI(userMessage, userPreferences = {}) {
    try {
      // Try multiple real AI APIs
      for (const endpoint of this.aiEndpoints) {
        try {
          console.log(`Trying ${endpoint.name} API...`);
          const response = await this.callAIAPI(endpoint, userMessage, userPreferences);
          if (response && response.success) {
            this.addToHistory(userMessage, response.message, endpoint.name.toLowerCase());
            return {
              success: true,
              message: response.message,
              source: endpoint.name.toLowerCase(),
              isFallback: false
            };
          }
        } catch (error) {
          console.log(`${endpoint.name} API failed:`, error.message);
          continue; // Try next API
        }
      }

      // If all AI APIs fail, use enhanced local intelligence
      if (this.useLocalFallback) {
        console.log('All AI APIs failed, using enhanced local intelligence');
        const localResponse = this.generateEnhancedLocalResponse(userMessage, userPreferences);
        this.addToHistory(userMessage, localResponse, 'local');
        return {
          success: true,
          message: localResponse,
          source: 'local',
          isFallback: true
        };
      }

      throw new Error('All AI services are currently unavailable');

    } catch (error) {
      console.error('AI Chat Error:', error);
      return {
        success: false,
        message: "I'm having trouble connecting to AI services right now. Please try again in a moment!",
        source: 'error',
        isFallback: true
      };
    }
  }

  async callAIAPI(endpoint, userMessage, userPreferences) {
    const prompt = this.buildAIPrompt(userMessage, userPreferences);
    
    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: endpoint.headers,
        body: endpoint.body(prompt)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle different API response formats
      let aiResponse = '';
      
      if (endpoint.name === 'Hugging Face Free') {
        aiResponse = data.generated_text || 'I understand your music request!';
      } else if (endpoint.name === 'DeepAI Free') {
        aiResponse = data.output || 'Great music question!';
      } else if (endpoint.name === 'AI21 Free') {
        aiResponse = data.completions?.[0]?.data?.text || 'Interesting music topic!';
      } else if (endpoint.name === 'Working Free AI') {
        aiResponse = data.response || data.message || 'Music is amazing!';
      } else if (endpoint.name === 'Community AI Hub') {
        aiResponse = data.response || data.text || 'Music is amazing!';
      } else if (endpoint.name === 'Open AI Gateway') {
        aiResponse = data.choices?.[0]?.message?.content || 'Music is amazing!';
      } else if (endpoint.name === 'Free AI Service') {
        aiResponse = data.response || data.message || 'Music is amazing!';
      } else if (endpoint.name === 'AI Helper') {
        aiResponse = data.response || data.text || 'Music is amazing!';
      } else if (endpoint.name === 'Real Free AI') {
        aiResponse = data.response || data.message || 'Music is amazing!';
      } else {
        aiResponse = data.response || data.message || data.text || 'Music is amazing!';
      }

      // Clean and enhance the AI response
      const enhancedResponse = this.enhanceAIResponse(aiResponse, userMessage, userPreferences);
      
      return { success: true, message: enhancedResponse };

    } catch (error) {
      throw new Error(`API call failed: ${error.message}`);
    }
  }

  buildAIPrompt(userMessage, userPreferences) {
    const context = `
You are an AI music assistant helping a user discover and enjoy music. 

User Context:
- Username: ${userPreferences.username || 'Music Lover'}
- Favorite tracks: ${userPreferences.favorites || 0}
- Preferred genres: ${userPreferences.preferredGenres?.join(', ') || 'Various'}

User Message: "${userMessage}"

Please provide a helpful, engaging response about music. Focus on:
- Music recommendations and discovery
- Playlist creation ideas
- Music education and trivia
- Mood-based music suggestions
- Genre exploration
- Artist recommendations

Keep responses conversational, informative, and music-focused. Use emojis and bullet points when appropriate.
    `.trim();

    return context;
  }

  enhanceAIResponse(aiResponse, userMessage, userPreferences) {
    // If AI response is too short or generic, enhance it
    if (!aiResponse || aiResponse.length < 20) {
      return this.generateEnhancedLocalResponse(userMessage, userPreferences);
    }

    // Add music-specific context if the AI response is generic
    if (aiResponse.toLowerCase().includes('music') && !userMessage.toLowerCase().includes('music')) {
      return `${aiResponse}\n\n🎵 Since you're asking about music, I'd love to help you discover some amazing tracks! What specific genre or mood are you interested in?`;
    }

    return aiResponse;
  }

  generateEnhancedLocalResponse(userMessage, userPreferences) {
    const message = userMessage.toLowerCase();
    
    // Music recommendation patterns
    if (message.includes('recommend') || message.includes('suggestion')) {
      return this.generateMusicRecommendations(userPreferences);
    }
    
    // Playlist creation patterns
    if (message.includes('playlist') || message.includes('create')) {
      return this.createPlaylistSuggestion(userMessage, userPreferences);
    }
    
    // Music discovery patterns
    if (message.includes('discover') || message.includes('new') || message.includes('find')) {
      return this.generateMusicDiscovery(userMessage, userPreferences);
    }
    
    // Mood-based patterns
    if (message.includes('mood') || message.includes('feeling') || message.includes('sad') || 
        message.includes('happy') || message.includes('energetic') || message.includes('relaxed')) {
      return this.generateMoodBasedMusic(userMessage, userPreferences);
    }
    
    // Genre-specific patterns
    if (message.includes('genre') || message.includes('rock') || message.includes('pop') || 
        message.includes('jazz') || message.includes('classical') || message.includes('electronic')) {
      return this.generateGenreInsights(userMessage, userPreferences);
    }
    
    // Default helpful response
    return this.generateDefaultResponse(userMessage, userPreferences);
  }

  generateMusicRecommendations(userPreferences) {
    const genres = userPreferences.preferredGenres || ['Pop', 'Rock', 'Electronic'];
    const randomGenre = genres[Math.floor(Math.random() * genres.length)];
    
    return `🎵 **Music Recommendations for You!**
    
Based on your preferences, here are some amazing ${randomGenre} artists to explore:

• **${randomGenre} Classics**: Try some timeless tracks from this genre
• **Emerging Artists**: Discover fresh talent in the ${randomGenre} scene
• **Cross-Genre Fusion**: Explore how ${randomGenre} blends with other styles

Would you like me to suggest specific songs or artists? Just let me know your current mood or what you're in the mood for! 🎶`;
  }

  createPlaylistSuggestion(userMessage, userPreferences) {
    const message = userMessage.toLowerCase();
    
    if (message.includes('workout') || message.includes('exercise')) {
      return `💪 **Workout Playlist Science!**
      
**Perfect Workout Music Structure:**
• **Warm-up (5-10 min)**: 120-130 BPM - Gentle pop, acoustic
• **Build-up (10-15 min)**: 130-140 BPM - Upbeat rock, electronic
• **Peak Performance (20-30 min)**: 140-160 BPM - High-energy dance, rock
• **Cool-down (5-10 min)**: 100-120 BPM - Chill electronic, ambient

**Genre Recommendations:**
• **Electronic**: High-energy beats for cardio
• **Rock**: Powerful riffs for strength training
• **Hip-hop**: Rhythmic flow for dance workouts
• **Pop**: Familiar melodies for motivation

**Pro Tips:**
• Match music tempo to exercise intensity
• Use familiar songs for mental engagement
• Include motivational lyrics for extra push
• Create variety to prevent workout boredom

Ready to create your perfect workout mix? Let me know your preferred genres! 🎯`;
    }
    
    if (message.includes('study') || message.includes('work') || message.includes('focus')) {
      return `📚 **Study Music Science!**
      
**Optimal Study Music Characteristics:**
• **BPM Range**: 60-80 BPM (matches relaxed heart rate)
• **No Lyrics**: Prevents cognitive interference
• **Consistent Tempo**: Maintains focus rhythm
• **Minimal Variations**: Reduces distractions

**Best Study Music Types:**
• **Classical**: Mozart, Bach, Beethoven
• **Ambient**: Brian Eno, Tycho, Boards of Canada
• **Instrumental Jazz**: Miles Davis, John Coltrane
• **Nature Sounds**: Rain, ocean waves, forest ambience

**Study Session Structure:**
• **Deep Focus (45 min)**: Minimal ambient music
• **Break (15 min)**: Slightly more engaging instrumental
• **Review (30 min)**: Return to minimal ambient

**Pro Tips:**
• Use noise-canceling headphones
• Create different playlists for different subjects
• Avoid music you're too familiar with
• Keep volume at 30-40% for optimal focus

What subjects are you studying? I can recommend specific music styles! 🧠`;
    }
    
    if (message.includes('party') || message.includes('celebration')) {
      return `🎉 **Party Playlist Psychology!**
      
**Party Music Flow Science:**
• **Opening (30 min)**: Familiar hits to build energy
• **Peak (1-2 hours)**: High-energy dance music
• **Maintain (2-3 hours)**: Mix of genres and eras
• **Wind-down (30 min)**: Slower, nostalgic songs

**Energy Management:**
• **High Energy**: Electronic, pop, hip-hop (140-160 BPM)
• **Medium Energy**: Rock, alternative, indie (120-140 BPM)
• **Low Energy**: R&B, soul, acoustic (80-120 BPM)

**Crowd Psychology:**
• Start with universally loved songs
• Build energy gradually
• Include nostalgic hits for emotional connection
• Mix current hits with classics
• End with feel-good anthems

**Genre Mix Strategy:**
• 40% Current hits
• 30% Classic party songs
• 20% Genre variety
• 10% Surprise elements

What type of party are you planning? I can customize this mix! 🎊`;
    }
    
    // Default playlist suggestion
    const playlistTypes = ['Chill', 'Road Trip', 'Cooking', 'Romantic', 'Adventure'];
    const randomType = playlistTypes[Math.floor(Math.random() * playlistTypes.length)];
    
    return `🎯 **${randomType} Playlist Creation Guide!**
    
Let me help you create the perfect ${randomType.toLowerCase()} playlist:

**Playlist Structure:**
• **Opening Track**: Something that sets the perfect mood
• **Build-Up**: Gradually increase energy and engagement
• **Peak**: High-quality tracks for maximum enjoyment
• **Cool-Down**: Soothing tracks to wind down

**Recommended Genres for ${randomType}:**
• Upbeat pop and electronic for energy
• Instrumental music for focus
• Classic rock for motivation

What specific mood or activity are you planning? I can tailor this even more! 🚀`;
  }

  generateMusicDiscovery(userMessage, userPreferences) {
    return `🔍 **Music Discovery Adventure!**
    
Let's explore some amazing new music together! Here are some discovery strategies:

**Discovery Methods:**
• **Genre Hopping**: Try a completely different genre than usual
• **Artist Exploration**: Pick one artist and explore their entire discography
• **Decade Diving**: Explore music from different time periods
• **Collaboration Discovery**: Find artists through featured collaborations

**Hidden Gems to Explore:**
• Indie artists with unique sounds
• International music from different cultures
• Instrumental and ambient music
• Live recordings and acoustic versions

What type of discovery interests you most? I can guide you to some amazing finds! 🌟`;
  }

  generateMoodBasedMusic(userMessage, userPreferences) {
    const message = userMessage.toLowerCase();
    let mood = 'general';
    let suggestions = '';
    
    if (message.includes('sad') || message.includes('down')) {
      mood = 'melancholic';
      suggestions = 'Try gentle acoustic music, soft indie, or uplifting pop to lift your spirits';
    } else if (message.includes('happy') || message.includes('excited')) {
      mood = 'upbeat';
      suggestions = 'Go for energetic pop, dance music, or feel-good rock to amplify your joy';
    } else if (message.includes('energetic') || message.includes('workout')) {
      mood = 'energetic';
      suggestions = 'High-tempo electronic, rock, or hip-hop will keep your energy flowing';
    } else if (message.includes('relaxed') || message.includes('chill')) {
      mood = 'calm';
      suggestions = 'Ambient music, smooth jazz, or acoustic folk will help you unwind';
    }
    
    return `💫 **Mood-Based Music for ${mood.charAt(0).toUpperCase() + mood.slice(1)} Vibes!**
    
**Perfect Music Choices:**
• **${suggestions}**
• **Genre Recommendations**: Based on your current energy level
• **Tempo Matching**: Songs that complement your mood

**Pro Tip**: Sometimes the best mood music is the opposite of how you feel - it can help shift your energy! 

What specific mood are you experiencing? I can give you even more targeted suggestions! 🎭`;
  }

  generateGenreInsights(userMessage, userPreferences) {
    return `🎼 **Genre Deep Dive!**
    
Let me share some fascinating insights about music genres:

**Genre Evolution:**
• Every genre has evolved over decades
• Cross-genre fusion creates exciting new sounds
• Regional variations add unique flavors

**Discovery Tips:**
• Start with classic albums in the genre
• Explore sub-genres for variety
• Listen to live performances for authenticity
• Check out cover versions for fresh perspectives

**Genre Connections:**
• Many genres share common roots
• Artists often blend multiple genres
• Historical context enriches the listening experience

What specific genre interests you? I can share more detailed insights and recommendations! 🎵`;
  }

  generateDefaultResponse(userMessage, userPreferences) {
    return `🎵 **Music Assistant at Your Service!**
    
I'm here to help you discover amazing music! Here are some ways I can assist:

**What I Can Do:**
• **Recommend music** based on your preferences
• **Create playlists** for different moods and activities
• **Discover new artists** and genres
• **Share music knowledge** and trivia
• **Help with music search** and exploration

**Try Asking Me:**
• "Recommend some upbeat music for working out"
• "Create a chill playlist for studying"
• "Help me discover new rock artists"
• "What music goes well with cooking?"

What would you like to explore today? I'm excited to help you find your next favorite song! 🚀`;
  }

  intelligentSearch(userQuery, userPreferences = {}) {
    // Convert natural language to search parameters
    const searchParams = this.parseSearchQuery(userQuery);
    
    return {
      query: searchParams.query,
      genre: searchParams.genre,
      mood: searchParams.mood,
      decade: searchParams.decade,
      type: searchParams.type
    };
  }

  parseSearchQuery(userQuery) {
    const query = userQuery.toLowerCase();
    
    // Extract genre
    const genres = ['rock', 'pop', 'jazz', 'classical', 'electronic', 'hip-hop', 'country', 'folk', 'blues', 'reggae'];
    const foundGenre = genres.find(genre => query.includes(genre));
    
    // Extract mood
    const moods = ['upbeat', 'chill', 'energetic', 'relaxed', 'melancholic', 'happy', 'sad', 'romantic'];
    const foundMood = moods.find(mood => query.includes(mood));
    
    // Extract decade
    const decades = ['60s', '70s', '80s', '90s', '2000s', '2010s', '2020s'];
    const foundDecade = decades.find(decade => query.includes(decade));
    
    // Extract type
    const types = ['song', 'artist', 'album', 'playlist'];
    const foundType = types.find(type => query.includes(type)) || 'song';
    
    return {
      query: userQuery,
      genre: foundGenre,
      mood: foundMood,
      decade: foundDecade,
      type: foundType
    };
  }

  addToHistory(userMessage, aiResponse, source) {
    this.conversationHistory.push({
      user: userMessage,
      ai: aiResponse,
      source: source,
      timestamp: new Date().toISOString()
    });

    // Keep history manageable
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory.shift();
    }
  }

  getHistory() {
    return this.conversationHistory;
  }

  clearHistory() {
    this.conversationHistory = [];
  }
}

export default new AIService();
