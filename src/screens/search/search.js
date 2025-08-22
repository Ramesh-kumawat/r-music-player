import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IconContext } from 'react-icons';
import { 
  AiFillPlayCircle, 
  AiOutlineDownload, 
  AiOutlineHeart, 
  AiFillHeart,
  AiOutlineSearch,
  AiOutlineLoading3Quarters,
  AiOutlineReload,
  AiOutlineExclamationCircle
} from 'react-icons/ai';
import { BsBroadcast } from 'react-icons/bs';
import { useNavigate, useLocation } from 'react-router-dom';
import musicService from '../../services/musicService';
import { musicCache } from '../../services/musicCache';
import './search.css';

export default function Search({ user }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [trendingMusic, setTrendingMusic] = useState([]);
  const [filteredApiMusic, setFilteredApiMusic] = useState([]);
  const [allSourceMusic, setAllSourceMusic] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [trendingInitialLoading, setTrendingInitialLoading] = useState(false);
  const [filteredLoading, setFilteredLoading] = useState(false);
  const [allSourceLoading, setAllSourceLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [trendingError, setTrendingError] = useState(null);
  const [filteredError, setFilteredError] = useState(null);
  const [allSourceError, setAllSourceError] = useState(null);
  const [apiHealth, setApiHealth] = useState({});
  const [apiHealthLoading, setApiHealthLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all'); // all, tracks, radio
  const [languageFilter, setLanguageFilter] = useState('all'); // all | hindi | english
  const [sourceFilter, setSourceFilter] = useState('all'); // all | audius | jamendo | radio | musiq | gateway | bandcamp | fma | ccmixter | incompetech | bensound | freesound | internet_archive
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [userLibrary, setUserLibrary] = useState([]);
  const [isStateRestored, setIsStateRestored] = useState(false);
  const [showRestorationIndicator, setShowRestorationIndicator] = useState(false);
  const [hasLoadedTrendingOnce, setHasLoadedTrendingOnce] = useState(false);
  const [hasLoadedAllContent, setHasLoadedAllContent] = useState(false);
  const [allContentLoaded, setAllContentLoaded] = useState(false);
  const [trendingPage, setTrendingPage] = useState(1);
  const [hasMoreTrending, setHasMoreTrending] = useState(false);
  const [filteredPage, setFilteredPage] = useState(1);
  const [hasMoreFiltered, setHasMoreFiltered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);
  const sentinelRef = useRef(null);

  // State persistence functions
  const saveSearchState = () => {
    try {
      const stateToSave = {
        searchQuery,
        searchResults,
        selectedTab,
        languageFilter,
        sourceFilter,
        page,
        hasMore,
        timestamp: Date.now()
      };
      localStorage.setItem('searchPageState', JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save search state:', error);
    }
  };

  const loadSearchState = () => {
    try {
      const savedState = localStorage.getItem('searchPageState');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        const isRecent = Date.now() - parsed.timestamp < 30 * 60 * 1000; // 30 minutes
        
                  if (isRecent) {
            console.log('Restoring search state from localStorage');
            setSearchQuery(parsed.searchQuery || '');
            setSearchResults(parsed.searchResults || []);
            setSelectedTab(parsed.selectedTab || 'all');
            setLanguageFilter(parsed.languageFilter || 'all');
            setSourceFilter(parsed.sourceFilter || 'all');
            setPage(parsed.page || 1);
            setHasMore(parsed.hasMore || false);
            setIsStateRestored(true); // Set state restored flag
            setShowRestorationIndicator(true); // Show restoration indicator
            
            // Hide indicator after 3 seconds
            setTimeout(() => {
              setShowRestorationIndicator(false);
            }, 3000);
            
            return true; // State was restored
          } else {
          console.log('Saved state is too old, clearing');
          localStorage.removeItem('searchPageState');
        }
      }
    } catch (error) {
      console.warn('Failed to load search state:', error);
      localStorage.removeItem('searchPageState');
    }
    return false; // No state was restored
  };

  const clearSearchState = () => {
    try {
      localStorage.removeItem('searchPageState');
    } catch (error) {
      console.warn('Failed to clear search state:', error);
    }
  };

  const isFirstWebsiteVisit = () => {
    try {
      const firstVisit = localStorage.getItem('websiteFirstVisit');
      if (!firstVisit) {
        // This is the first visit to the website
        localStorage.setItem('websiteFirstVisit', Date.now().toString());
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Failed to check first visit:', error);
      return false;
    }
  };

  useEffect(() => {
    // Scroll to top when component mounts
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const container = document.querySelector('.screen-container');
      if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
    
    // Try to restore saved search state first (fastest)
    const stateRestored = loadSearchState();
    
    // Only load content if state was restored or if user explicitly needs it
    if (stateRestored) {
      console.log('State restored, skipping initial content load');
    } else {
      // Show trending section but let user click to load
      console.log('No state restored, content will load on demand');
      setAllContentLoaded(false); // Show the "Load All Content" button
    }
    
    // Check API health (this is fast)
    checkAPIHealth();
    
    // Get user favorites (local operation)
    if (user) {
      setUserLibrary(user.favorites || []);
    }
  }, [user]);

  const checkAPIHealth = async () => {
    try {
      setApiHealthLoading(true);
      const health = await musicService.checkAPIHealth();
      setApiHealth(health);
    } catch (error) {
      console.error('Error checking API health:', error);
    } finally {
      setApiHealthLoading(false);
    }
  };

  const loadTrendingMusic = async () => {
    try {
      setTrendingLoading(true);
      setTrendingError(null);
      const trending = await musicService.getTrendingBySource(sourceFilter, 20, languageFilter);
      setTrendingMusic(trending);
    } catch (error) {
      console.error('Error loading trending music:', error);
      setTrendingError('Failed to load trending music. Please try again.');
    } finally {
      setTrendingLoading(false);
    }
  };

  const retryTrending = () => {
    loadTrendingMusic();
  };

  const refreshTrendingMusic = () => {
    setHasLoadedTrendingOnce(false);
    loadTrendingMusic();
  };

  const loadAllContent = useCallback(async () => {
    try {
      setTrendingInitialLoading(true);
      setTrendingError(null);
      
      console.log('🚀 Loading all trending content with enhanced service...');
      const startTime = Date.now();
      
      // Use the enhanced music service with caching
      const trending = await musicService.getTrendingMusic(50, 'global');
      
      const loadTime = Date.now() - startTime;
      console.log(`⚡ Loaded ${trending.length} tracks in ${loadTime}ms`);
      
      setTrendingMusic(trending);
      setHasMoreTrending(true);
      setAllContentLoaded(true);
      
    } catch (error) {
      console.error('Error loading all content:', error);
      setTrendingError('Failed to load content. Please try again.');
    } finally {
      setTrendingInitialLoading(false);
    }
  }, []);

  // Load filtered API music based on current source filter
  const loadFilteredApiMusic = useCallback(async () => {
    if (sourceFilter === 'all') return;
    
    try {
      setFilteredLoading(true);
      setFilteredError(null);
      
      console.log(`🔍 Loading filtered API music from ${sourceFilter}...`);
      console.log(`🔍 API Health for ${sourceFilter}:`, apiHealth[sourceFilter]);
      console.log(`🔍 Full API Health:`, apiHealth);
      
      // Check if the source is healthy before attempting to load
      if (apiHealth[sourceFilter] === 'unhealthy') {
        console.warn(`⚠️ ${sourceFilter} is marked as unhealthy, attempting to load anyway...`);
      }
      
      // Special handling for Openverse
      if (sourceFilter === 'openverse') {
        console.log(`🔍 Special handling for Openverse filter...`);
        console.log(`🔍 Openverse has rate limits: max 20 items per page for anonymous users`);
      }
      
      // Adjust limit for sources with restrictions
      let adjustedLimit = 30;
      if (sourceFilter === 'openverse') {
        adjustedLimit = 20; // Respect Openverse's anonymous user limit
        console.log(`🔍 Adjusted limit to ${adjustedLimit} for ${sourceFilter}`);
      }
      
      const music = await musicService.getTrendingBySource(sourceFilter, adjustedLimit, languageFilter);
      
      console.log(`✅ ${sourceFilter} returned ${music.length} tracks:`, music.slice(0, 3));
      
      if (music.length === 0) {
        console.warn(`⚠️ ${sourceFilter} returned 0 tracks - this might indicate an API issue`);
        
        // Special handling for Openverse
        if (sourceFilter === 'openverse') {
          console.log(`🔍 Trying direct Openverse call as fallback...`);
          try {
            const directMusic = await musicService.searchOpenverse('music', 1, 30);
            console.log(`🔍 Direct Openverse call returned: ${directMusic.length} tracks`);
            if (directMusic.length > 0) {
              setFilteredApiMusic(directMusic);
              setHasMoreFiltered(directMusic.length >= 30);
              setFilteredPage(1);
              setFilteredLoading(false);
              return;
            }
          } catch (directError) {
            console.error(`❌ Direct Openverse call failed:`, directError);
          }
        }
      }
      
      setFilteredApiMusic(music);
      setHasMoreFiltered(music.length >= adjustedLimit);
      setFilteredPage(1);
      
    } catch (error) {
      console.error(`❌ Error loading filtered API music from ${sourceFilter}:`, error);
      console.error(`❌ Error details:`, {
        message: error.message,
        stack: error.stack,
        sourceFilter,
        languageFilter,
        apiHealth: apiHealth[sourceFilter]
      });
      
      setFilteredError(`Failed to load ${sourceFilter} music: ${error.message}`);
    } finally {
      setFilteredLoading(false);
    }
  }, [sourceFilter, languageFilter, apiHealth]);

  // Load all source music combined
  const loadAllSourceMusic = useCallback(async () => {
    try {
      setAllSourceLoading(true);
      setAllSourceError(null);
      
      console.log('🌟 Loading all source music combined...');
      const music = await musicService.getTrendingMusic(50, 'global');
      
      setAllSourceMusic(music);
      
    } catch (error) {
      console.error('Error loading all source music:', error);
      setAllSourceError('Failed to load all source music. Please try again.');
    } finally {
      setAllSourceLoading(false);
    }
  }, []);

  const reloadContentWithFilters = async () => {
    try {
      setTrendingLoading(true);
      setTrendingError(null);
      
      console.log(`Reloading content with filters: source=${sourceFilter}, language=${languageFilter}`);
      
      let newContent = [];
      
      if (sourceFilter === 'all') {
        // Load from all healthy sources with current language filter
        const promises = [];
        
        if (apiHealth.musiq === 'healthy') {
          promises.push(musicService.getTrendingBySource('musiq', 15, languageFilter));
        }
        if (apiHealth.audius === 'healthy') {
          promises.push(musicService.getTrendingBySource('audius', 15, languageFilter));
        }
        if (apiHealth.jamendo === 'healthy') {
          promises.push(musicService.getTrendingBySource('jamendo', 15, languageFilter));
        }
        if (apiHealth.radio === 'healthy') {
          promises.push(musicService.getTrendingBySource('radio', 15, languageFilter));
        }
        if (apiHealth.archive === 'healthy') {
          promises.push(musicService.getTrendingBySource('archive', 15, languageFilter));
        }
        // NEW SOURCES - 100% FREE, NO API KEYS REQUIRED
        if (apiHealth.bandcamp === 'healthy') {
          promises.push(musicService.getTrendingBySource('bandcamp', 15, languageFilter));
        }
        if (apiHealth.fma === 'healthy') {
          promises.push(musicService.getTrendingBySource('fma', 15, languageFilter));
        }
        if (apiHealth.ccmixter === 'healthy') {
          promises.push(musicService.getTrendingBySource('ccmixter', 15, languageFilter));
        }
        if (apiHealth.incompetech === 'healthy') {
          promises.push(musicService.getTrendingBySource('incompetech', 15, languageFilter));
        }
        if (apiHealth.bensound === 'healthy') {
          promises.push(musicService.getTrendingBySource('bensound', 15, languageFilter));
        }
        if (apiHealth.freesound === 'healthy') {
          promises.push(musicService.getTrendingBySource('freesound', 15, languageFilter));
        }
        if (apiHealth.internet_archive === 'healthy') {
          promises.push(musicService.getTrendingBySource('internet_archive', 15, languageFilter));
        }
        
        const results = await Promise.allSettled(promises);
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            newContent = newContent.concat(result.value);
          }
        });
      } else {
        // Load from specific source with current language filter
        newContent = await musicService.getTrendingBySource(sourceFilter, 30, languageFilter);
      }
      
      if (newContent.length > 0) {
        setTrendingMusic(newContent);
        setTrendingPage(1);
        setHasMoreTrending(newContent.length >= 30);
        console.log(`Reloaded ${newContent.length} tracks with new filters`);
      }
      
    } catch (error) {
      console.error('Error reloading content with filters:', error);
      setTrendingError('Failed to reload content. Please try again.');
    } finally {
      setTrendingLoading(false);
    }
  };

  const loadMoreTrending = async () => {
    if (trendingLoading || !hasMoreTrending) return;
    
    console.log('Loading more trending content...');
    
    try {
      setTrendingLoading(true);
      const nextPage = trendingPage + 1;
      
      let moreContent = [];
      
      if (sourceFilter === 'all') {
        // Load from additional sources one by one for better performance
        const sources = ['audius', 'jamendo', 'radio', 'archive', 'bandcamp', 'fma', 'ccmixter', 'incompetech', 'bensound', 'freesound', 'internet_archive'];
        
        for (const source of sources) {
          if (apiHealth[source] === 'healthy') {
            try {
              const sourceContent = await musicService.getTrendingBySource(source, 10, languageFilter);
              if (sourceContent && sourceContent.length > 0) {
                moreContent = moreContent.concat(sourceContent);
                // Stop after getting enough content to avoid overloading
                if (moreContent.length >= 20) break;
              }
            } catch (error) {
              console.warn(`Failed to load from ${source}:`, error);
            }
          }
        }
      } else {
        // Load more from specific source
        moreContent = await musicService.getTrendingBySource(sourceFilter, 20, languageFilter);
      }
      
      if (moreContent.length > 0) {
        // Deduplicate and append new content
        const existingIds = new Set(trendingMusic.map(t => t.id));
        const newTracks = moreContent.filter(t => !existingIds.has(t.id));
        
        if (newTracks.length > 0) {
          // Shuffle for variety
          const shuffledTracks = newTracks.sort(() => Math.random() - 0.5);
          setTrendingMusic(prev => [...prev, ...shuffledTracks]);
          setTrendingPage(nextPage);
          
          // Continue if we got significant content
          setHasMoreTrending(newTracks.length >= 10);
          console.log(`Added ${newTracks.length} new trending tracks`);
        } else {
          console.log('No new tracks found, disabling load more');
          setHasMoreTrending(false);
        }
      } else {
        console.log('No more content available');
        setHasMoreTrending(false);
      }
      
    } catch (error) {
      console.error('Load more trending error:', error);
      setHasMoreTrending(false);
    } finally {
      setTrendingLoading(false);
    }
  };

  const PAGE_SIZE = 20;

  const handleSearch = async (e, overrideLanguage) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    const lang = overrideLanguage || languageFilter;
    try {
      setSearchLoading(true);
      setSearchError(null);
      setPage(1);
      setIsStateRestored(false); // Clear restored state indicator for new search
      
      const results = await (sourceFilter === 'all'
        ? musicService.searchAllSourcesPaged(searchQuery, 1, PAGE_SIZE, lang)
        : musicService.searchBySourcePaged(searchQuery, 1, PAGE_SIZE, sourceFilter, lang));
      setSearchResults(results);
      setHasMore(results.length >= PAGE_SIZE);
    } catch (error) {
      console.error('Search error:', error);
      let errorMessage = 'Search failed. Please check your connection and try again.';
      
      // Provide more specific error messages for different sources
      if (sourceFilter === 'musiq') {
        errorMessage = 'JioSaavn service is currently unavailable. This could be due to temporary service issues or rate limiting. Please try again later or use a different source.';
      } else if (sourceFilter === 'audius') {
        errorMessage = 'Audius service is currently unavailable. Please try again later or use a different source.';
      } else if (sourceFilter === 'jamendo') {
        errorMessage = 'Jamendo service is currently unavailable. Please check your API key or try again later.';
      } else if (sourceFilter === 'radio') {
        errorMessage = 'Radio service is currently unavailable. Please try again later or use a different source.';
      }
      
      setSearchError(errorMessage);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const retrySearch = () => {
    if (searchQuery.trim()) {
      handleSearch(null, languageFilter);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setPage(1);
    setHasMore(false);
    setSearchError(null);
    clearSearchState();
    setHasLoadedTrendingOnce(false); // Reset trending music flag
    loadTrendingMusic(); // Load fresh trending music
  };

  const loadMore = async () => {
    if (loading || !hasMore) return;
    
    console.log('Loading more results...', { page, hasMore, loading });
    
    try {
      setLoading(true);
      const nextPage = page + 1;
      const more = await (sourceFilter === 'all'
        ? musicService.searchAllSourcesPaged(searchQuery, nextPage, PAGE_SIZE, languageFilter)
        : musicService.searchBySourcePaged(searchQuery, nextPage, PAGE_SIZE, sourceFilter, languageFilter));
      
      console.log('Loaded more results:', { count: more.length, page: nextPage });
      
      if (more && more.length > 0) {
        // Deduplicate by id while appending
        const existing = new Map(searchResults.map(t => [t.id, t]));
        for (const t of more) {
          if (!existing.has(t.id)) existing.set(t.id, t);
        }
        const merged = Array.from(existing.values());
        setSearchResults(merged);
        setPage(nextPage);
        
        // Set hasMore based on whether we got a full page of results
        const newHasMore = more.length >= PAGE_SIZE;
        console.log('Setting hasMore to:', newHasMore, 'because got', more.length, 'results');
        setHasMore(newHasMore);
      } else {
        // No more results
        console.log('No more results available');
        setHasMore(false);
      }
    } catch (error) {
      console.error('Load more error:', error);
      // Don't show error for load more, just stop loading
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // Infinite scroll on the screen container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    const onScroll = () => {
      if (!searchResults.length) return;
      if (loading || !hasMore) return;
      
      const scrollTop = el.scrollTop;
      const clientHeight = el.clientHeight;
      const scrollHeight = el.scrollHeight;
      const threshold = 300; // Increased threshold for better detection
      
      console.log('Scroll event:', { scrollTop, clientHeight, scrollHeight, threshold });
      
      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        console.log('Triggering loadMore from scroll event');
        loadMore();
      }
    };
    
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [loading, hasMore, searchResults, page, languageFilter, searchQuery]);

  // IntersectionObserver-based infinite loader (more reliable across layouts)
  useEffect(() => {
    const root = containerRef.current;
    const target = sentinelRef.current;
    if (!root || !target) return;
    if (!searchResults.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore && !loading) {
            loadMore();
          }
        });
      },
      { root, rootMargin: '200px', threshold: 0.1 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [searchResults, hasMore, loading, page, languageFilter, sourceFilter, searchQuery]);

  // IntersectionObserver for trending music infinite scroll
  useEffect(() => {
    const root = containerRef.current;
    const trendingSentinel = document.querySelector('.trending-sentinel');
    if (!root || !trendingSentinel) return;
    if (!trendingMusic.length || !hasMoreTrending) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMoreTrending && !trendingLoading) {
            loadMoreTrending();
          }
        });
      },
      { root, rootMargin: '200px', threshold: 0.1 }
    );
    observer.observe(trendingSentinel);
    return () => observer.disconnect();
  }, [trendingMusic, hasMoreTrending, trendingLoading, sourceFilter, languageFilter]);

  // Reload trending when filters change and there is no active query
  useEffect(() => {
    if (!searchQuery.trim()) {
      loadTrendingMusic();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceFilter, languageFilter]);

  // Central loading state for major operations - only show for search, not trending
  const isMajorOperationLoading = searchLoading;

  // Save search state when it changes
  useEffect(() => {
    if (searchQuery || searchResults.length > 0) {
      saveSearchState();
    }
  }, [searchQuery, searchResults, selectedTab, languageFilter, sourceFilter, page, hasMore]);

  // Auto-reset source filter if selected source becomes unhealthy
  useEffect(() => {
    if (sourceFilter !== 'all' && apiHealth[sourceFilter] === 'unhealthy') {
      console.log(`Source ${sourceFilter} is unhealthy, resetting to 'all'`);
      setSourceFilter('all');
      // Clear search results since we're changing sources
      if (searchQuery) {
        setSearchResults([]);
        setPage(1);
        setHasMore(false);
      }
    }
  }, [apiHealth, sourceFilter, searchQuery]);

  // Save state before component unmounts
  useEffect(() => {
    return () => {
      saveSearchState();
    };
  }, []);

  // Load filtered API music when source filter changes
  useEffect(() => {
    if (sourceFilter !== 'all' && Object.keys(apiHealth).length > 0) {
      loadFilteredApiMusic();
    } else if (sourceFilter === 'all') {
      setFilteredApiMusic([]);
      setHasMoreFiltered(false);
    }
  }, [sourceFilter, languageFilter, apiHealth, loadFilteredApiMusic]);

  const playTrack = (track) => {
    console.log('🎵 playTrack called with:', track);
    
    if (!track || !track.id) {
      console.error('❌ Invalid track data:', track);
      return;
    }
    
    // Determine which list to use based on current context
    let list = [];
    let source = 'unknown';
    
    // Check if we're in search results
    if (searchResults.length > 0) {
      list = filterResults(searchResults);
      source = 'search';
      console.log('🔍 Using search results, filtered count:', list.length);
    }
    // Check if we're in filtered API music
    else if (filteredApiMusic.length > 0 && sourceFilter !== 'all') {
      list = filteredApiMusic;
      source = 'filtered';
      console.log('🎯 Using filtered API music, count:', list.length);
    }
    // Check if we're in all source music
    else if (allSourceMusic.length > 0) {
      list = allSourceMusic;
      source = 'allSource';
      console.log('🌟 Using all source music, count:', list.length);
    }
    // Fallback to trending music
    else if (trendingMusic.length > 0) {
      list = trendingMusic;
      source = 'trending';
      console.log('📈 Using trending music, count:', list.length);
    }
    
    if (list.length === 0) {
      console.error('❌ No tracks available in any list');
      return;
    }
    
    // Find the exact track in the list
    const trackIndex = list.findIndex(t => t.id === track.id);
    
    if (trackIndex === -1) {
      console.warn('⚠️ Track not found in list, adding it to the beginning');
      // If track not found, add it to the beginning of the list
      list = [track, ...list];
      console.log('✅ Added track to beginning of list');
    }
    
    console.log('🎵 Final list for player:', {
      source,
      listLength: list.length,
      trackIndex: trackIndex >= 0 ? trackIndex : 0,
      selectedTrack: track,
      firstTrackInList: list[0]
    });
    
    // Verify the track data integrity
    if (track.id !== list[trackIndex >= 0 ? trackIndex : 0].id) {
      console.error('❌ Track ID mismatch!', {
        originalTrackId: track.id,
        listTrackId: list[trackIndex >= 0 ? trackIndex : 0].id
      });
      // Force the correct track to be first
      list = [track, ...list.filter(t => t.id !== track.id)];
      console.log('🔄 Fixed list order to ensure correct track');
    }
    
    try {
      musicService.saveNowPlaying(list, trackIndex >= 0 ? trackIndex : 0);
      console.log('✅ Successfully saved now playing');
    } catch (error) {
      console.error('❌ Error saving now playing:', error);
    }
    
    console.log('🚀 Navigating to player with state:', { 
      track: track, 
      tracks: list,
      trackIndex: trackIndex >= 0 ? trackIndex : 0
    });
    
    try {
      navigate("/player", { 
        state: { 
          track: track,
          tracks: list
        }
      });
      console.log('✅ Navigation successful');
    } catch (error) {
      console.error('❌ Navigation error:', error);
    }
  };

  const downloadTrack = async (track) => {
    try {
      await musicService.downloadTrack(track);
      alert(`Downloaded: ${track.name} by ${track.artist}`);
    } catch (error) {
      alert(`Download failed: ${error.message}`);
    }
  };

  const toggleLibrary = (track) => {
    const isInLibrary = userLibrary.some(t => t.id === track.id);
    
    if (isInLibrary) {
      // Remove from favorites
      user.favorites = user.favorites.filter(f => f.id !== track.id);
    } else {
      // Add to favorites
      if (!user.favorites) user.favorites = [];
      user.favorites.push(track);
    }
    
    setUserLibrary([...user.favorites]);
  };

  const isInLibrary = (track) => userLibrary.some(t => t.id === track.id);

  const filterResults = (tracks) => {
    if (selectedTab === 'all') return tracks;
    if (selectedTab === 'tracks') return tracks.filter(t => t.source !== 'radio');
    if (selectedTab === 'radio') return tracks.filter(t => t.source === 'radio');
    return tracks;
  };

  const formatDuration = (duration) => {
    if (!duration || duration === 0) return 'Live';
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const MusicCard = ({ track }) => (
    <div className="music-card" onClick={() => playTrack(track)}>
      <div className="music-card-image">
        <img 
          src={track.image || '/logo192.png'} 
          alt={track.name}
          onError={(e) => {
            e.target.src = '/logo192.png';
          }}
        />
        <div className="music-card-overlay">
          <IconContext.Provider value={{ size: "40px", color: "#ffffff" }}>
            <AiFillPlayCircle 
              onClick={(e) => {
                e.stopPropagation();
                console.log('Play button clicked for track:', track);
                playTrack(track);
              }} 
            />
          </IconContext.Provider>
        </div>
      </div>
      
      <div className="music-card-info">
        <h3 className="music-card-title">{track.name}</h3>
        <p className="music-card-artist">{track.artist}</p>
        <p className="music-card-album">{track.album}</p>
        <div className="music-card-meta">
          <span className="music-card-duration">
            {track.source === 'radio' ? 'LIVE' : formatDuration(track.duration)}
          </span>
          <span className={`music-card-source source-${track.source}`}>
            {track.source === 'radio' ? <BsBroadcast /> : null}
            {track.source}
          </span>
        </div>
      </div>
      
      <div className="music-card-actions">
        <IconContext.Provider value={{ size: "20px" }}>
          <button 
            className={`action-button ${isInLibrary(track) ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleLibrary(track);
            }}
            title={isInLibrary(track) ? 'Remove from library' : 'Add to library'}
          >
            {isInLibrary(track) ? <AiFillHeart /> : <AiOutlineHeart />}
          </button>
          
          {track.download_url && (
            <button 
              className="action-button"
              onClick={(e) => {
                e.stopPropagation();
                downloadTrack(track);
              }}
              title="Download track"
            >
              <AiOutlineDownload />
            </button>
          )}
        </IconContext.Provider>
      </div>
    </div>
  );

  const APIStatusIndicator = () => {
    // Group sources by status for better organization
    const healthySources = Object.entries(apiHealth).filter(([_, status]) => status === 'healthy');
    const unhealthySources = Object.entries(apiHealth).filter(([_, status]) => status === 'unhealthy');
    const unknownSources = Object.entries(apiHealth).filter(([_, status]) => status === 'unknown');
    
    const getSourceDisplayName = (source) => {
      const sourceNames = {
        'musiq': 'JioSaavn',
        'audius': 'Audius',
        'jamendo': 'Jamendo',
        'radio': 'Radio',
        'gateway': 'Gateway',
        'archive': 'Archive',
        'youtube': 'YouTube Music',
        'deezer': 'Deezer',
        'openverse': 'Openverse',
        'bandcamp': 'Bandcamp',
        'fma': 'FMA',
        'ccmixter': 'ccMixter',
        'incompetech': 'Incompetech',
        'bensound': 'Bensound',
        'freesound': 'Freesound',
        'internet_archive': 'Internet Archive'
      };
      return sourceNames[source] || source.charAt(0).toUpperCase() + source.slice(1);
    };

    return (
      <div className="api-status-container">
        <div className="api-status-header">
          <h4>Music Sources Status</h4>
          <div className="api-actions">
            <button onClick={checkAPIHealth} className="refresh-api-button" title="Refresh API status" disabled={apiHealthLoading}>
              {apiHealthLoading ? (
                <AiOutlineLoading3Quarters className="spinning" size="16px" />
              ) : (
                <AiOutlineReload size="16px" />
              )}
            </button>
            <button onClick={refreshTrendingMusic} className="refresh-api-button" title="Refresh Trending" disabled={trendingLoading}>
              {trendingLoading ? (
                <AiOutlineLoading3Quarters className="spinning" size="16px" />
              ) : (
                <AiOutlineReload size="16px" />
              )}
            </button>
          </div>
        </div>
        


        {/* Sources Grid */}
        <div className="api-status-grid">
          {Object.entries(apiHealth).map(([source, status]) => (
            <div key={source} className={`api-status-item ${status}`}>
              <span className="status-dot"></span>
              <span className="source-name">{getSourceDisplayName(source)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="screen-container" ref={containerRef}>
      {/* Central Loading Overlay for Major Operations */}
      {isMajorOperationLoading && (
        <div className="central-loading-overlay">
          <div className="loading-spinner"></div>
          <h3>Loading...</h3>
          <p>
            {searchLoading 
              ? `Searching for "${searchQuery}" across multiple music sources...`
              : isStateRestored 
                ? 'Restoring your previous search...'
                : 'Loading...'
            }
          </p>
        </div>
      )}

      {/* Subtle State Restoration Indicator */}
      {showRestorationIndicator && (
        <div className="state-restoration-indicator">
          <div className="loading-spinner-small"></div>
          <span>Restoring your previous search...</span>
        </div>
      )}

      <div className="search-container">
        <div className="search-header">
          <h1>Discover Music</h1>
          
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-container">
              <AiOutlineSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search for tracks, artists, or radio stations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-button" disabled={searchLoading}>
                {searchLoading ? (
                  <>
                    <AiOutlineLoading3Quarters className="spinning" />
                    Searching...
                  </>
                ) : (
                  <>
                    <AiOutlineSearch />
                    Search
                  </>
                )}
              </button>
              {searchQuery && (
                <button 
                  type="button" 
                  className="clear-search-button" 
                  onClick={clearSearch}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </form>



          <div className="search-tabs">
            <button 
              className={`tab-button ${selectedTab === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedTab('all')}
            >
              All Results
            </button>
            <button 
              className={`tab-button ${selectedTab === 'tracks' ? 'active' : ''}`}
              onClick={() => setSelectedTab('tracks')}
            >
              Tracks
            </button>
            <button 
              className={`tab-button ${selectedTab === 'radio' ? 'active' : ''}`}
              onClick={() => setSelectedTab('radio')}
            >
              Radio Stations
            </button>
          </div>

          <div className="search-tabs">
            <button
              className={`tab-button ${sourceFilter === 'all' ? 'active' : ''}`}
              onClick={() => { 
                setSourceFilter('all'); 
                if (searchQuery) {
                  handleSearch(null, languageFilter);
                } else {
                  reloadContentWithFilters();
                }
              }}
            >
              All Sources
            </button>
            {apiHealth.musiq === 'healthy' && (
              <button
                className={`tab-button ${sourceFilter === 'musiq' ? 'active' : ''}`}
                onClick={() => { 
                  setSourceFilter('musiq'); 
                  if (searchQuery) {
                    handleSearch(null, languageFilter);
                  } else {
                    reloadContentWithFilters();
                  }
                }}
              >
                Musiq (JioSaavn)
              </button>
            )}
            {apiHealth.audius === 'healthy' && (
              <button
                className={`tab-button ${sourceFilter === 'audius' ? 'active' : ''}`}
                onClick={() => { 
                  setSourceFilter('audius'); 
                  if (searchQuery) {
                    handleSearch(null, languageFilter);
                  } else {
                    reloadContentWithFilters();
                  }
                }}
              >
                Audius
              </button>
            )}
            {apiHealth.jamendo === 'healthy' && (
              <button
                className={`tab-button ${sourceFilter === 'jamendo' ? 'active' : ''}`}
                onClick={() => { 
                  setSourceFilter('jamendo'); 
                  if (searchQuery) {
                    handleSearch(null, languageFilter);
                  } else {
                    reloadContentWithFilters();
                  }
                }}
              >
                Jamendo
              </button>
            )}
            {apiHealth.radio === 'healthy' && (
              <button
                className={`tab-button ${sourceFilter === 'radio' ? 'active' : ''}`}
                onClick={() => { 
                  setSourceFilter('radio'); 
                  if (searchQuery) {
                    handleSearch(null, languageFilter);
                  } else {
                    reloadContentWithFilters();
                  }
                }}
              >
                Radio
              </button>
            )}
            {apiHealth.gateway === 'healthy' && (
              <button
                className={`tab-button ${sourceFilter === 'gateway' ? 'active' : ''}`}
                onClick={() => { 
                  setSourceFilter('gateway'); 
                  if (searchQuery) {
                    handleSearch(null, languageFilter);
                  } else {
                    reloadContentWithFilters();
                  }
                }}
              >
                Gateway
              </button>
            )}
            {apiHealth.archive === 'healthy' && (
              <button
                className={`tab-button ${sourceFilter === 'archive' ? 'active' : ''}`}
                onClick={() => { 
                  setSourceFilter('archive'); 
                  if (searchQuery) {
                    handleSearch(null, languageFilter);
                  } else {
                    reloadContentWithFilters();
                  }
                }}
              >
                Archive (India)
              </button>
            )}
            {apiHealth.youtube === 'healthy' && (
              <button
                className={`tab-button ${sourceFilter === 'youtube' ? 'active' : ''}`}
                onClick={() => { 
                  setSourceFilter('youtube'); 
                  if (searchQuery) {
                    handleSearch(null, languageFilter);
                  } else {
                    reloadContentWithFilters();
                  }
                }}
              >
                YouTube Music
              </button>
            )}
            {apiHealth.deezer === 'healthy' && (
              <button
                className={`tab-button ${sourceFilter === 'deezer' ? 'active' : ''}`}
                onClick={() => { 
                  setSourceFilter('deezer'); 
                  if (searchQuery) {
                    handleSearch(null, languageFilter);
                  } else {
                    reloadContentWithFilters();
                  }
                }}
              >
                Deezer
              </button>
            )}
            {apiHealth.openverse === 'healthy' && (
              <button
                className={`tab-button ${sourceFilter === 'openverse' ? 'active' : ''}`}
                onClick={() => { 
                  setSourceFilter('openverse'); 
                  if (searchQuery) {
                    handleSearch(null, languageFilter);
                  } else {
                    reloadContentWithFilters();
                  }
                }}
              >
                Openverse
              </button>
            )}
            
            {/* NEW FREE MUSIC SOURCES */}
            {apiHealth.bandcamp === 'healthy' && (
              <button
                className={`tab-button ${sourceFilter === 'bandcamp' ? 'active' : ''}`}
                data-source="bandcamp"
                onClick={() => { 
                  setSourceFilter('bandcamp'); 
                  if (searchQuery) {
                    handleSearch(null, languageFilter);
                  } else {
                    reloadContentWithFilters();
                  }
                }}
              >
                Bandcamp
              </button>
            )}
            {apiHealth.fma === 'healthy' && (
              <button
                className={`tab-button ${sourceFilter === 'fma' ? 'active' : ''}`}
                data-source="fma"
                onClick={() => { 
                  setSourceFilter('fma'); 
                  if (searchQuery) {
                    handleSearch(null, languageFilter);
                  } else {
                    reloadContentWithFilters();
                  }
                }}
              >
                FMA (Creative Commons)
              </button>
            )}
            {apiHealth.ccmixter === 'healthy' && (
              <button
                className={`tab-button ${sourceFilter === 'ccmixter' ? 'active' : ''}`}
                data-source="ccmixter"
                onClick={() => { 
                  setSourceFilter('ccmixter'); 
                  if (searchQuery) {
                    handleSearch(null, languageFilter);
                  } else {
                    reloadContentWithFilters();
                  }
                }}
              >
                ccMixter
              </button>
            )}
            {apiHealth.incompetech === 'healthy' && (
              <button
                className={`tab-button ${sourceFilter === 'incompetech' ? 'active' : ''}`}
                data-source="incompetech"
                onClick={() => { 
                  setSourceFilter('incompetech'); 
                  if (searchQuery) {
                    handleSearch(null, languageFilter);
                  } else {
                    reloadContentWithFilters();
                  }
                }}
              >
                Incompetech
              </button>
            )}
            {apiHealth.bensound === 'healthy' && (
              <button
                className={`tab-button ${sourceFilter === 'bensound' ? 'active' : ''}`}
                data-source="bensound"
                onClick={() => { 
                  setSourceFilter('bensound'); 
                  if (searchQuery) {
                    handleSearch(null, languageFilter);
                  } else {
                    reloadContentWithFilters();
                  }
                }}
              >
                Bensound
              </button>
            )}
            {apiHealth.freesound === 'healthy' && (
              <button
                className={`tab-button ${sourceFilter === 'freesound' ? 'active' : ''}`}
                data-source="freesound"
                onClick={() => { 
                  setSourceFilter('freesound'); 
                  if (searchQuery) {
                    handleSearch(null, languageFilter);
                  } else {
                    reloadContentWithFilters();
                  }
                }}
              >
                Freesound
              </button>
            )}
            {apiHealth.internet_archive === 'healthy' && (
              <button
                className={`tab-button ${sourceFilter === 'internet_archive' ? 'active' : ''}`}
                data-source="internet_archive"
                onClick={() => { 
                  setSourceFilter('internet_archive'); 
                  if (searchQuery) {
                    handleSearch(null, languageFilter);
                  } else {
                    reloadContentWithFilters();
                  }
                }}
              >
                Internet Archive
              </button>
            )}
          </div>

          <div className="search-tabs">
            <button
              className={`tab-button ${languageFilter === 'all' ? 'active' : ''}`}
              onClick={() => { 
                setLanguageFilter('all'); 
                if (searchQuery) {
                  handleSearch(null, 'all');
                } else {
                  reloadContentWithFilters();
                }
              }}
            >
              All Languages
            </button>
            <button
              className={`tab-button ${languageFilter === 'hindi' ? 'active' : ''}`}
              onClick={() => { 
                setLanguageFilter('hindi'); 
                if (searchQuery) {
                  handleSearch(null, 'hindi');
                } else {
                  reloadContentWithFilters();
                }
              }}
            >
              Hindi
            </button>
            <button
              className={`tab-button ${languageFilter === 'english' ? 'active' : ''}`}
              onClick={() => { 
                setLanguageFilter('english'); 
                if (searchQuery) {
                  handleSearch(null, 'english');
                } else {
                  reloadContentWithFilters();
                }
              }}
            >
              English
            </button>
          </div>

          {/* API Status Indicator */}
          <APIStatusIndicator />

          {/* Source Health Notice */}
          {Object.values(apiHealth).some(status => status === 'unhealthy') && (
            <div className="source-health-notice">
              <span>⚠️ Some music sources are currently unavailable and have been hidden</span>
            </div>
          )}
        </div>

        <div className="search-content">
          {/* Search Results Section */}
          {searchResults.length > 0 ? (
            <div className="search-results">
              <div className="search-results-header">
                <h2>Search Results</h2>
                {isStateRestored && (
                  <div className="state-restored-indicator">
                    <span>🔄 Restored from previous session</span>
                  </div>
                )}
              </div>
              <div className="music-grid">
                {filterResults(searchResults).map((track) => (
                  <MusicCard key={track.id} track={track} />
                ))}
              </div>
              <div ref={sentinelRef} style={{ height: 1 }} />
              {/* Load More Button and Loading State */}
              {hasMore && (
                <div className="load-more-container">
                  {loading ? (
                    <div className="loading-container load-more-loading">
                      <AiOutlineLoading3Quarters className="spinning" size="24px" />
                      <p>Loading more...</p>
                    </div>
                  ) : (
                    <button 
                      onClick={loadMore}
                      className="load-more-button"
                      disabled={loading}
                    >
                      <AiOutlineReload size="16px" />
                      Load More Results
                    </button>
                  )}
                  
                  {/* Infinite Scroll Sentinel */}
                  <div 
                    ref={sentinelRef} 
                    style={{ height: '20px', margin: '20px 0' }}
                    className="infinite-scroll-sentinel"
                  />
                </div>
              )}
            </div>
          ) : searchQuery.trim() && !searchLoading ? (
            <div className="empty-state">
              <AiOutlineExclamationCircle size="48px" color="#888" />
              <h3>No results found</h3>
              <p>Try adjusting your search terms or filters</p>
            </div>
          ) : null}

          {/* Search Loading State */}
          {searchLoading && (
            <div className="loading-container">
              <AiOutlineLoading3Quarters className="spinning" size="48px" />
              <p>Searching for "{searchQuery}"...</p>
            </div>
          )}

          {/* Search Error State */}
          {searchError && (
            <div className="error-container">
              <AiOutlineExclamationCircle size="48px" color="#ff6b6b" />
              <h3>Search Failed</h3>
              <p>{searchError}</p>
              <button onClick={retrySearch} className="retry-button">
                <AiOutlineReload size="16px" />
                Try Again
              </button>
            </div>
          )}



          {/* Filtered API Music Section */}
          <div className="trending-section api-trending">
            <div className="trending-header">
              <h2>🎵 Filtered API Music</h2>
              <div className="trending-actions">
                {sourceFilter === 'all' ? (
                  <span className="filter-info">Select a source filter above</span>
                ) : (
                  <button 
                    onClick={loadFilteredApiMusic}
                    className="load-trending-button"
                    title={`Load music from ${sourceFilter}`}
                    disabled={filteredLoading}
                  >
                    {filteredLoading ? (
                      <AiOutlineLoading3Quarters className="spinning" size="16px" />
                    ) : (
                      <AiOutlineReload size="16px" />
                    )}
                    Load {sourceFilter.charAt(0).toUpperCase() + sourceFilter.slice(1)}
                  </button>
                )}
              </div>
            </div>
            
            {/* Filtered API Music Loading State */}
            {filteredLoading ? (
              <div className="loading-container">
                <AiOutlineLoading3Quarters className="spinning" size="40px" />
                <p>Loading {sourceFilter} music...</p>
              </div>
            ) : filteredError ? (
              /* Filtered API Music Error State */
              <div className="error-container">
                <AiOutlineExclamationCircle size="48px" color="#ff6b6b" />
                <h3>Failed to Load {sourceFilter.charAt(0).toUpperCase() + sourceFilter.slice(1)} Music</h3>
                <p>{filteredError}</p>
                <button onClick={loadFilteredApiMusic} className="retry-button">
                  <AiOutlineReload size="16px" />
                  Try Again
                </button>
              </div>
            ) : (
              /* Filtered API Music Content */
              <div className="music-grid">
                {filteredApiMusic.length > 0 ? (
                  filteredApiMusic.map((track) => (
                    <MusicCard key={track.id} track={track} />
                  ))
                ) : sourceFilter === 'all' ? (
                  <div className="empty-state">
                    <AiOutlineExclamationCircle size="48px" color="#888" />
                    <h3>No source filter selected</h3>
                    <p>Select a music source from the filters above to see music</p>
                  </div>
                ) : (
                  <div className="empty-state">
                    <AiOutlineExclamationCircle size="48px" color="#888" />
                    <h3>No {sourceFilter} music available</h3>
                    <p>Click "Load {sourceFilter.charAt(0).toUpperCase() + sourceFilter.slice(1)}" to get started</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Filtered API Music Load More Button */}
            {hasMoreFiltered && (
              <div className="load-more-container">
                <button 
                  onClick={() => {/* TODO: Implement load more for filtered */}}
                  className="load-more-button"
                  disabled={filteredLoading}
                >
                  <AiOutlineReload size="16px" />
                  Load More {sourceFilter.charAt(0).toUpperCase() + sourceFilter.slice(1)}
                </button>
              </div>
            )}
          </div>

          {/* All Source Music Section */}
          <div className="trending-section all-trending">
            <div className="trending-header">
              <h2>🌟 All Source Music</h2>
              <div className="trending-actions">
                <button 
                  onClick={loadAllSourceMusic}
                  className="load-trending-button"
                  title="Load all music from all sources combined"
                  disabled={allSourceLoading}
                >
                  {allSourceLoading ? (
                    <AiOutlineLoading3Quarters className="spinning" size="16px" />
                  ) : (
                    <AiOutlineReload size="16px" />
                  )}
                  Load All Sources
                </button>
              </div>
            </div>
            
            {/* All Source Music Loading State */}
            {allSourceLoading ? (
              <div className="loading-container">
                <AiOutlineLoading3Quarters className="spinning" size="40px" />
                <p>Loading all source music...</p>
              </div>
            ) : allSourceError ? (
              /* All Source Music Error State */
              <div className="error-container">
                <AiOutlineExclamationCircle size="48px" color="#ff6b6b" />
                <h3>Failed to Load All Source Music</h3>
                <p>{allSourceError}</p>
                <button onClick={loadAllSourceMusic} className="retry-button">
                  <AiOutlineReload size="16px" />
                  Try Again
                </button>
              </div>
            ) : (
              /* All Source Music Content */
              <div className="music-grid">
                {allSourceMusic.length > 0 ? (
                  allSourceMusic.map((track) => (
                    <MusicCard key={track.id} track={track} />
                  ))
                ) : (
                  <div className="empty-state">
                    <AiOutlineExclamationCircle size="48px" color="#888" />
                    <h3>No all source music loaded</h3>
                    <p>Click "Load All Sources" to get music from all available sources combined</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}