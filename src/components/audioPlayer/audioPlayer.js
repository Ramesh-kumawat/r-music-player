import React, { useState, useRef, useEffect } from "react";
import "./audioPlayer.css"
 


export default function AudioPlayer({
     currentTrack,
    currentIndex,
    setCurrentIndex,
    tracks,
    isGlobalPlaying = false,
    setIsGlobalPlaying = () => {} }) {

    
    // console.log("Track Duration:", duration);

    const fallbackImage = "/logo192.png";

    const [isPlaying, setIsPlaying] = useState(isGlobalPlaying);
    const [trackProgress, setTrackProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);
    const [isAudioActuallyPlaying, setIsAudioActuallyPlaying] = useState(false);
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [autoPlayNext, setAutoPlayNext] = useState(true); // Auto-play next track by default
    const [showAutoPlayNotification, setShowAutoPlayNotification] = useState(false);
    const [autoPlayTrackInfo, setAutoPlayTrackInfo] = useState({});
 
    
    // Enhanced to support both Spotify and online streaming URLs
    const audioSrc = tracks && tracks.length > 0 && tracks[currentIndex] ? 
      (tracks[currentIndex]?.track?.preview_url || tracks[currentIndex]?.preview_url) : 
      (currentTrack?.preview_url || null);
    
    // Fallback audio source if none available
    const fallbackAudioSrc = audioSrc || 'https://file-examples.com/storage/fe68c17451deb8b63ffe1ba/2017/11/file_example_MP3_700KB.mp3';
    
    // Ensure audio source is properly loaded
    useEffect(() => {
      if (audioSrc && audioRef.current) {
        console.log('🎵 Setting audio source:', audioSrc);
        
        // Set the source
        audioRef.current.src = audioSrc;
        
        // Load the audio
        audioRef.current.load();
        
        // Add event listeners for this specific source
        const handleCanPlay = () => {
          if (audioRef.current) {
            console.log('✅ Audio can play - readyState:', audioRef.current.readyState);
            console.log('✅ Audio duration:', audioRef.current.duration);
            console.log('✅ Audio paused:', audioRef.current.paused);
          }
        };
        
        const handleLoadedMetadata = () => {
          if (audioRef.current) {
            console.log('📊 Audio metadata loaded - readyState:', audioRef.current.readyState);
            console.log('📊 Audio duration:', audioRef.current.duration);
            setDuration(audioRef.current.duration);
          }
        };
        
        const handleLoadStart = () => {
          console.log('🔄 Audio load started');
        };
        
        const handleError = (e) => {
          if (audioRef.current) {
            console.error('❌ Audio load error:', e);
            console.error('❌ Error details:', audioRef.current.error);
          }
        };
        
        // Add event listeners only if audio element exists
        if (audioRef.current) {
          audioRef.current.addEventListener('canplay', handleCanPlay);
          audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
          audioRef.current.addEventListener('loadstart', handleLoadStart);
          audioRef.current.addEventListener('error', handleError);
        }
        
        // Cleanup function
        return () => {
          if (audioRef.current) {
            audioRef.current.removeEventListener('canplay', handleCanPlay);
            audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audioRef.current.removeEventListener('loadstart', handleLoadStart);
            audioRef.current.removeEventListener('error', handleError);
          }
        };
      }
    }, [audioSrc]);
  
    const intervalRef = useRef();
  
    const isReady = useRef(false);
    
    // Global audio state persistence
    const globalAudioState = useRef({
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      currentSrc: ''
    });
    
    // Load persisted audio state from localStorage
    useEffect(() => {
      try {
        const savedState = localStorage.getItem('globalAudioState');
        if (savedState) {
          const parsed = JSON.parse(savedState);
          globalAudioState.current = { ...globalAudioState.current, ...parsed };
          
          // Restore progress if same source
          if (globalAudioState.current.currentSrc === audioSrc && globalAudioState.current.currentTime > 0) {
            setTrackProgress(globalAudioState.current.currentTime);
            setDuration(globalAudioState.current.duration);
          }
        }
      } catch (e) {
        console.warn('Failed to load audio state:', e);
      }
    }, [audioSrc]);
  
    const currentPercentage = duration ? (trackProgress / duration) * 100 : 0;
  

    console.log("Audio Source:", audioSrc);
    console.log("Fallback Audio Source:", fallbackAudioSrc);
    console.log("Total tracks:", tracks);
    console.log("Current index:", currentIndex);
    console.log("Current track:", tracks && tracks[currentIndex]);
    console.log("Current track from props:", currentTrack);


    const startTimer = () => {
      clearInterval(intervalRef.current);
  
      intervalRef.current = setInterval(() => {
        if (audioRef.current && !audioRef.current.ended) {
          const currentTime = audioRef.current.currentTime;
          const duration = audioRef.current.duration;
          
          setTrackProgress(currentTime);
          
          // Persist global audio state more frequently
          globalAudioState.current = {
            currentTime: currentTime,
            duration: duration || globalAudioState.current.duration,
            isPlaying: !audioRef.current.paused,
            currentSrc: audioSrc || globalAudioState.current.currentSrc
          };
          
          // Save to localStorage every second for better persistence
          if (Math.floor(currentTime) % 1 === 0) {
            try {
              localStorage.setItem('globalAudioState', JSON.stringify(globalAudioState.current));
            } catch (e) {
              console.warn('Failed to save audio state:', e);
            }
          }
          
          // Update global state if audio is actually playing
          if (!audioRef.current.paused && currentTime > 0) {
            setIsAudioActuallyPlaying(true);
            setIsGlobalPlaying(true);
          }
        } else if (audioRef.current && audioRef.current.ended) {
          handleNext();
        }
      }, 100); // Update more frequently for smoother progress bar
    };
  
    // Sync with global playing state and check actual audio state
    useEffect(() => {
      setIsPlaying(isGlobalPlaying);
      
      // Restore audio state from global state if available
      if (globalAudioState.current.currentSrc === audioSrc && globalAudioState.current.currentTime > 0) {
        console.log('🔄 Restoring audio state from global state:', {
          currentTime: globalAudioState.current.currentTime,
          duration: globalAudioState.current.duration,
          isPlaying: globalAudioState.current.isPlaying
        });
        
        setTrackProgress(globalAudioState.current.currentTime);
        setDuration(globalAudioState.current.duration);
        
        // Restore playing state if it was playing
        if (globalAudioState.current.isPlaying) {
          setIsPlaying(true);
          setIsGlobalPlaying(true);
          setIsAudioActuallyPlaying(true);
        }
      }
      
      // Also check if the audio element is actually playing and sync progress
      if (audioRef.current && audioRef.current.readyState >= 2) {
        const isActuallyPlaying = !audioRef.current.paused && audioRef.current.currentTime > 0;
        const actualCurrentTime = audioRef.current.currentTime;
        const actualDuration = audioRef.current.duration;
        
        console.log('🔍 Audio element state:', {
          isActuallyPlaying,
          actualCurrentTime,
          actualDuration,
          readyState: audioRef.current.readyState
        });
        
        setIsAudioActuallyPlaying(isActuallyPlaying);
        
        // Update global state if it's out of sync
        if (isActuallyPlaying !== isGlobalPlaying) {
          setIsGlobalPlaying(isActuallyPlaying);
        }
        
        // Always sync progress bar with actual audio position
        if (actualCurrentTime > 0) {
          setTrackProgress(actualCurrentTime);
          setDuration(actualDuration);
          
          // Update global state with actual values
          globalAudioState.current = {
            ...globalAudioState.current,
            currentTime: actualCurrentTime,
            duration: actualDuration,
            isPlaying: isActuallyPlaying
          };
          
          // Persist to localStorage
          try {
            localStorage.setItem('globalAudioState', JSON.stringify(globalAudioState.current));
          } catch (e) {
            console.warn('Failed to save audio state:', e);
          }
        }
      }
    }, [isGlobalPlaying, audioSrc]);

    // Volume control effect
    useEffect(() => {
      if (audioRef.current) {
        audioRef.current.volume = isMuted ? 0 : volume;
      }
    }, [volume, isMuted]);

    useEffect(() => {
        const effectiveAudioSrc = audioSrc || fallbackAudioSrc;
        
        if (!effectiveAudioSrc) {
          console.warn("No audio source available");
          return;
        }

        console.log("🎵 useEffect triggered - isPlaying:", isPlaying, "audioSrc:", effectiveAudioSrc);

        if (isPlaying) {
          console.log("▶️ useEffect: Attempting to play:", effectiveAudioSrc);
          
          // Ensure audio element exists before proceeding
          if (!audioRef.current) {
            console.warn("⚠️ Audio element not available, cannot play");
            return;
          }
          
          // Ensure audio source is set
          if (audioRef.current.src !== effectiveAudioSrc) {
            audioRef.current.src = effectiveAudioSrc;
            audioRef.current.load();
          }
          
          // Wait for audio to be ready before playing
          const playAudio = async () => {
            try {
              console.log("🎵 useEffect: Starting playback...");
              if (audioRef.current) {
                await audioRef.current.play();
                console.log("✅ useEffect: Playback started successfully");
                setIsAudioActuallyPlaying(true);
                setIsGlobalPlaying(true);
                startTimer();
              }
            } catch (err) {
              console.error("❌ useEffect: Play failed:", err.message);
              // Only reset state if this wasn't a manual pause
              if (isPlaying) {
                setIsPlaying(false);
                setIsAudioActuallyPlaying(false);
                setIsGlobalPlaying(false);
              }
            }
          };
          
          if (audioRef.current.readyState >= 2) {
            // Audio is ready, play immediately
            playAudio();
          } else {
            // Wait for audio to load
            console.log("⏳ useEffect: Audio not ready, waiting for canplay event...");
            if (audioRef.current) {
              audioRef.current.addEventListener('canplay', playAudio, { once: true });
              audioRef.current.load();
            }
          }
        } else {
          console.log("⏸️ useEffect: Pausing playback");
          clearInterval(intervalRef.current);
          // Don't call pause() here as it might interfere with manual pause
          // Just update the state
          setIsAudioActuallyPlaying(false);
          setIsGlobalPlaying(false);
        }
      }, [isPlaying, audioSrc]);

      useEffect(() => {
        const updateDuration = () => {
          if (audioRef.current) {
            setTrackProgress(audioRef.current.currentTime);
            setDuration(audioRef.current.duration);
          }
        };
      
        if (audioRef.current) {
          audioRef.current.addEventListener("loadedmetadata", updateDuration);
          
          // Also update when audio can play
          audioRef.current.addEventListener("canplay", updateDuration);
          
          // Update progress immediately if audio is already loaded
          if (audioRef.current.readyState >= 2) {
            updateDuration();
          }
        }
      
        return () => {
          if (audioRef.current) {
            audioRef.current.removeEventListener("loadedmetadata", updateDuration);
            audioRef.current.removeEventListener("canplay", updateDuration);
          }
        };
      }, [audioSrc]);

      useEffect(() => {
        const effectiveAudioSrc = audioSrc || fallbackAudioSrc;
        if (!effectiveAudioSrc) {
          console.warn("No audio source available");
          return;
        }
      
        console.log("Audio source changed to:", effectiveAudioSrc);
        
        // Only change source if it's different
        if (audioRef.current && audioRef.current.src !== effectiveAudioSrc) {
          const wasPlaying = audioRef.current.paused ? false : true;
          const currentTime = audioRef.current.currentTime;
          
          console.log("Updating audio source from", audioRef.current.src, "to", effectiveAudioSrc);
          
          // Update source without recreating audio element
          audioRef.current.src = effectiveAudioSrc;
          audioRef.current.load();
          
          // Restore position if it's the same track
          if (globalAudioState.current.currentSrc === effectiveAudioSrc && globalAudioState.current.currentTime > 0) {
            audioRef.current.currentTime = globalAudioState.current.currentTime;
          }
          
          // Don't auto-play on source change - let user control it
          if (wasPlaying) {
            console.log("Audio was playing, but not auto-restarting");
          }
        }
        
        // Add event listeners if not already added
        if (audioRef.current && !audioRef.current.hasEventListener) {
          audioRef.current.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            console.log('Failed to load audio from:', effectiveAudioSrc);
          });
          
          audioRef.current.addEventListener('canplay', () => {
            if (audioRef.current) {
              console.log('Audio ready to play:', effectiveAudioSrc);
              setDuration(audioRef.current.duration);
            }
          });

          audioRef.current.addEventListener('loadedmetadata', () => {
            if (audioRef.current) {
              console.log('Audio metadata loaded, duration:', audioRef.current.duration);
              setDuration(audioRef.current.duration);
              // Restore progress if available
              if (globalAudioState.current.currentSrc === effectiveAudioSrc && globalAudioState.current.currentTime > 0) {
                setTrackProgress(globalAudioState.current.currentTime);
              }
            }
          });
          
          audioRef.current.addEventListener('play', () => {
            console.log('Audio play event fired');
            setIsAudioActuallyPlaying(true);
            setIsGlobalPlaying(true);
          });
          
          audioRef.current.addEventListener('pause', () => {
            console.log('Audio pause event fired');
            setIsAudioActuallyPlaying(false);
            setIsGlobalPlaying(false);
          });
          
          audioRef.current.hasEventListener = true;
        }
    
        if (isReady.current && isPlaying) {
          startTimer();
        } else {
          isReady.current = true;
        }
      }, [currentIndex, audioSrc]);
    
      useEffect(() => {
        return () => {
          // Persist audio state before unmounting
          if (audioRef.current) {
            globalAudioState.current = {
              currentTime: audioRef.current.currentTime,
              duration: audioRef.current.duration,
              isPlaying: !audioRef.current.paused,
              currentSrc: audioRef.current.src
            };
            
            // Save to localStorage
            try {
              localStorage.setItem('globalAudioState', JSON.stringify(globalAudioState.current));
            } catch (e) {
              console.warn('Failed to save audio state:', e);
            }
          }
          
          clearInterval(intervalRef.current);
        };
      }, []);

    const handleNext = () => {
      if (tracks && tracks.length > 0) {
        let nextIndex;
        if (currentIndex < tracks.length - 1) {
          nextIndex = currentIndex + 1;
        } else {
          nextIndex = 0; // Loop back to first track
        }
        
        console.log(`Auto-advancing to next track: ${nextIndex + 1}/${tracks.length}`);
        setCurrentIndex(nextIndex);
        
        // Show auto-play notification
        if (autoPlayNext && (isPlaying || isGlobalPlaying)) {
          const nextTrack = tracks[nextIndex];
          const trackName = nextTrack?.track?.name || nextTrack?.name || nextTrack?.title || 'Unknown Track';
          const artistName = nextTrack?.track?.artist || nextTrack?.artist || nextTrack?.artists?.[0] || 'Unknown Artist';
          
          setAutoPlayTrackInfo({
            name: trackName,
            artist: artistName,
            index: nextIndex + 1,
            total: tracks.length
          });
          setShowAutoPlayNotification(true);
          
          // Auto-hide notification after 3 seconds
          setTimeout(() => setShowAutoPlayNotification(false), 3000);
        }
      }
    };
    
      const handlePrev = () => {
        if (tracks && tracks.length > 0) {
          if (currentIndex - 1 < 0) setCurrentIndex(tracks.length - 1);
          else setCurrentIndex(currentIndex - 1);
        }
      };

    const ensureAudioLoaded = () => {
      const effectiveAudioSrc = audioSrc || fallbackAudioSrc;
      if (!effectiveAudioSrc) return false;
      
      if (!audioRef.current) {
        console.warn("Audio element not available");
        return false;
      }
      
      if (audioRef.current.src !== effectiveAudioSrc) {
        audioRef.current.src = effectiveAudioSrc;
        audioRef.current.load();
        return false; // Not ready yet
      }
      
      return audioRef.current.readyState >= 2; // Ready to play
    };

    const forcePlay = async () => {
      const effectiveAudioSrc = audioSrc || fallbackAudioSrc;
      if (!effectiveAudioSrc) {
        console.warn("No audio source available for force play");
        return;
      }
      
      if (!audioRef.current) {
        console.warn("Audio element not available for force play");
        return;
      }
      
      try {
        // Ensure audio is loaded
        if (!ensureAudioLoaded()) {
          console.log("Audio not ready, waiting for load...");
          if (audioRef.current) {
            audioRef.current.addEventListener('canplay', () => {
              console.log("Audio ready, attempting to play...");
              if (audioRef.current) {
                audioRef.current.play();
              }
            }, { once: true });
          }
          return;
        }
        
        console.log("Audio ready, playing immediately");
        if (audioRef.current) {
          await audioRef.current.play();
          console.log("Force play successful");
        }
      } catch (error) {
        console.error("Force play failed:", error);
        setIsPlaying(false);
        setIsGlobalPlaying(false);
      }
    };

    const testAudioSource = () => {
      const effectiveAudioSrc = audioSrc || fallbackAudioSrc;
      if (!effectiveAudioSrc) {
        console.warn("No audio source to test");
        return;
      }
      
      console.log("Testing audio source:", effectiveAudioSrc);
      
      // Create a temporary audio element to test
      const testAudio = new Audio();
      testAudio.crossOrigin = "anonymous";
      
      testAudio.addEventListener('loadstart', () => console.log("Audio load started"));
      testAudio.addEventListener('durationchange', () => console.log("Duration changed:", testAudio.duration));
      testAudio.addEventListener('loadedmetadata', () => console.log("Metadata loaded, duration:", testAudio.duration));
      testAudio.addEventListener('canplay', () => console.log("Audio can play"));
      testAudio.addEventListener('canplaythrough', () => console.log("Audio can play through"));
      testAudio.addEventListener('error', (e) => console.error("Audio error:", e));
      
      testAudio.src = effectiveAudioSrc;
      testAudio.load();
    };
    
      const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      };

      const addZero = (n) => {
        return n > 9 ? "" + n : "0" + n;
      };

    // Restore audio state from multiple sources when component mounts
    useEffect(() => {
      const restoreAudioState = () => {
        console.log('🚀 Component mounted - restoring audio state from multiple sources');
        
        // 1. Try to restore from global audio manager
        if (window.globalAudioManager && window.globalAudioManager.currentSrc === audioSrc) {
          const globalState = window.globalAudioManager;
          console.log('🌐 Restoring from global manager:', globalState);
          
          if (globalState.currentTime > 0 && globalState.duration > 0) {
            setTrackProgress(globalState.currentTime);
            setDuration(globalState.duration);
            setIsPlaying(globalState.isPlaying);
            setIsGlobalPlaying(globalState.isPlaying);
            return;
          }
        }
        
        // 2. Try to restore from localStorage
        try {
          const savedState = localStorage.getItem('globalAudioState');
          if (savedState) {
            const parsed = JSON.parse(savedState);
            console.log('💾 Restoring from localStorage:', parsed);
            
            if (parsed.currentSrc === audioSrc && parsed.currentTime > 0) {
              setTrackProgress(parsed.currentTime);
              setDuration(parsed.duration);
              setIsPlaying(parsed.isPlaying);
              setIsGlobalPlaying(parsed.isPlaying);
              
              // Update global manager
              if (window.globalAudioManager) {
                window.globalAudioManager.updateState(parsed);
              }
              return;
            }
          }
        } catch (e) {
          console.warn('Failed to restore from localStorage:', e);
        }
        
        // 3. Try to restore from actual audio element
        if (audioRef.current && audioRef.current.readyState >= 2) {
          const currentTime = audioRef.current.currentTime;
          const duration = audioRef.current.duration;
          const isPlaying = !audioRef.current.paused;
          
          console.log('🔍 Restoring from audio element:', { currentTime, duration, isPlaying });
          
          if (currentTime > 0 && duration > 0) {
            setTrackProgress(currentTime);
            setDuration(duration);
            setIsPlaying(isPlaying);
            setIsGlobalPlaying(isPlaying);
            
            // Update global manager and localStorage
            if (window.globalAudioManager) {
              window.globalAudioManager.updateState({
                currentTime,
                duration,
                isPlaying,
                currentSrc: audioSrc
              });
            }
            
            try {
              localStorage.setItem('globalAudioState', JSON.stringify({
                currentTime,
                duration,
                isPlaying,
                currentSrc: audioSrc
              }));
            } catch (e) {
              console.warn('Failed to save restored state:', e);
            }
          }
        }
      };
      
      // Try to restore immediately and after delays
      restoreAudioState();
      setTimeout(restoreAudioState, 100);
      setTimeout(restoreAudioState, 500);
      setTimeout(restoreAudioState, 1000);
      
      return () => {
        // Cleanup if needed
      };
    }, [audioSrc]);

    // Force sync progress with actual audio state
    const forceSyncProgress = () => {
      if (audioRef.current && audioRef.current.readyState >= 2) {
        const currentTime = audioRef.current.currentTime;
        const duration = audioRef.current.duration;
        
        console.log('🔄 Force syncing progress:', { currentTime, duration });
        
        if (currentTime > 0 && duration > 0) {
          setTrackProgress(currentTime);
          setDuration(duration);
          
          // Update global state
          globalAudioState.current = {
            ...globalAudioState.current,
            currentTime,
            duration,
            currentSrc: audioSrc,
            isPlaying: !audioRef.current.paused
          };
          
          // Save to localStorage
          try {
            localStorage.setItem('globalAudioState', JSON.stringify(globalAudioState.current));
          } catch (e) {
            console.warn('Failed to save audio state:', e);
          }
        }
      }
    };
    
    // Expose forceSyncProgress to parent component
    useEffect(() => {
      if (window.forceSyncAudioProgress) {
        window.forceSyncAudioProgress = forceSyncProgress;
      } else {
        window.forceSyncAudioProgress = forceSyncProgress;
      }
      
      return () => {
        if (window.forceSyncAudioProgress === forceSyncProgress) {
          delete window.forceSyncAudioProgress;
        }
      };
    }, []);

    // Listen for visibility changes to sync progress when user returns to tab
    useEffect(() => {
      const handleVisibilityChange = () => {
        if (!document.hidden && audioRef.current) {
          console.log('👁️ Tab became visible - syncing audio progress');
          
          // Force sync with global audio state
          if (window.globalAudioManager && window.globalAudioManager.currentSrc === audioSrc) {
            const globalState = window.globalAudioManager;
            console.log('🌐 Restoring from global state:', globalState);
            
            setTrackProgress(globalState.currentTime);
            setDuration(globalState.duration);
            setIsPlaying(globalState.isPlaying);
            setIsGlobalPlaying(globalState.isPlaying);
          }
          
          // Also check actual audio element state
          setTimeout(() => {
            if (audioRef.current && audioRef.current.readyState >= 2) {
              const currentTime = audioRef.current.currentTime;
              const duration = audioRef.current.duration;
              const isPlaying = !audioRef.current.paused;
              
              console.log('🔍 Actual audio element state:', {
                currentTime,
                duration,
                isPlaying,
                readyState: audioRef.current.readyState
              });
              
              if (currentTime > 0 && duration > 0) {
                setTrackProgress(currentTime);
                setDuration(duration);
                setIsPlaying(isPlaying);
                setIsGlobalPlaying(isPlaying);
                
                // Update global state
                if (window.globalAudioManager) {
                  window.globalAudioManager.updateState({
                    currentTime,
                    duration,
                    isPlaying,
                    currentSrc: audioSrc
                  });
                }
              }
            }
          }, 100);
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }, [audioSrc]);

    // Periodic sync to ensure progress stays accurate
    useEffect(() => {
      const syncInterval = setInterval(() => {
        if (audioRef.current && audioRef.current.readyState >= 2) {
          const currentTime = audioRef.current.currentTime;
          const duration = audioRef.current.duration;
          
          // Only sync if there's a significant difference
          if (Math.abs(currentTime - trackProgress) > 0.1 && currentTime > 0 && duration > 0) {
            console.log('🔄 Periodic sync - updating progress:', { 
              old: trackProgress, 
              new: currentTime, 
              difference: Math.abs(currentTime - trackProgress) 
            });
            
            setTrackProgress(currentTime);
            setDuration(duration);
            
            // Update global state
            globalAudioState.current = {
              ...globalAudioState.current,
              currentTime,
              duration,
              currentSrc: audioSrc,
              isPlaying: !audioRef.current.paused
            };
          }
        }
      }, 2000); // Check every 2 seconds
      
      return () => clearInterval(syncInterval);
    }, [trackProgress, audioSrc]);

    // Global audio state persistence across page navigation
    useEffect(() => {
      // Create a global audio state manager if it doesn't exist
      if (!window.globalAudioManager) {
        window.globalAudioManager = {
          audioElement: audioRef.current,
          currentTime: 0,
          duration: 0,
          isPlaying: false,
          currentSrc: '',
          updateState: (newState) => {
            window.globalAudioManager = { ...window.globalAudioManager, ...newState };
            // Broadcast state change to all components
            window.dispatchEvent(new CustomEvent('globalAudioStateChanged', { 
              detail: window.globalAudioManager 
            }));
          }
        };
      }
      
      // Listen for global audio state changes
      const handleGlobalStateChange = (event) => {
        const globalState = event.detail;
        console.log('🌐 Global audio state changed:', globalState);
        
        // Update local state if it's for the same audio source
        if (globalState.currentSrc === audioSrc) {
          setTrackProgress(globalState.currentTime);
          setDuration(globalState.duration);
          setIsPlaying(globalState.isPlaying);
          setIsGlobalPlaying(globalState.isPlaying);
        }
      };
      
      window.addEventListener('globalAudioStateChanged', handleGlobalStateChange);
      
      // Update global state when local state changes
      if (audioRef.current && audioRef.current.readyState >= 2) {
        const currentTime = audioRef.current.currentTime;
        const duration = audioRef.current.duration;
        const isPlaying = !audioRef.current.paused;
        
        window.globalAudioManager.updateState({
          audioElement: audioRef.current,
          currentTime,
          duration,
          isPlaying,
          currentSrc: audioSrc
        });
      }
      
      return () => {
        window.removeEventListener('globalAudioStateChanged', handleGlobalStateChange);
      };
    }, [audioSrc]);

    // Continuous audio state monitoring and syncing
    useEffect(() => {
      const monitorInterval = setInterval(() => {
        if (audioRef.current && audioRef.current.readyState >= 2) {
          const currentTime = audioRef.current.currentTime;
          const duration = audioRef.current.duration;
          const isPlaying = !audioRef.current.paused;
          
          // Check if state is out of sync
          const timeDrift = Math.abs(currentTime - trackProgress);
          const playingDrift = isPlaying !== isPlaying;
          
          if (timeDrift > 0.1 || playingDrift) {
            console.log('🔄 State drift detected, syncing:', {
              timeDrift,
              playingDrift,
              oldProgress: trackProgress,
              newProgress: currentTime,
              oldPlaying: isPlaying,
              newPlaying: isPlaying
            });
            
            setTrackProgress(currentTime);
            setDuration(duration);
            setIsPlaying(isPlaying);
            setIsGlobalPlaying(isPlaying);
            
            // Update global state
            if (window.globalAudioManager) {
              window.globalAudioManager.updateState({
                currentTime,
                duration,
                isPlaying,
                currentSrc: audioSrc
              });
            }
            
            // Update localStorage
            try {
              localStorage.setItem('globalAudioState', JSON.stringify({
                currentTime,
                duration,
                isPlaying,
                currentSrc: audioSrc
              }));
            } catch (e) {
              console.warn('Failed to save audio state:', e);
            }
          }
        }
      }, 500); // Check every 500ms
      
      return () => clearInterval(monitorInterval);
    }, [trackProgress, isPlaying, audioSrc]);

    // Manual sync function to ensure state consistency
    const syncAudioState = () => {
      if (audioRef.current && audioRef.current.readyState >= 2) {
        const actualPaused = audioRef.current.paused;
        const actualCurrentTime = audioRef.current.currentTime;
        const actualDuration = audioRef.current.duration;
        
        console.log('🔄 Manual sync - Audio element state:', {
          actualPaused,
          actualCurrentTime,
          actualDuration,
          localIsPlaying: isPlaying,
          localIsGlobalPlaying: isGlobalPlaying
        });
        
        // Sync playing state
        if (actualPaused !== !isPlaying) {
          console.log('🔄 Syncing playing state:', { was: isPlaying, is: !actualPaused });
          setIsPlaying(!actualPaused);
          setIsGlobalPlaying(!actualPaused);
          setIsAudioActuallyPlaying(!actualPaused);
        }
        
        // Sync progress
        if (actualCurrentTime > 0) {
          setTrackProgress(actualCurrentTime);
        }
        if (actualDuration > 0) {
          setDuration(actualDuration);
        }
        
        // Update global state
        if (window.globalAudioManager) {
          window.globalAudioManager.updateState({
            currentTime: actualCurrentTime,
            duration: actualDuration,
            isPlaying: !actualPaused,
            currentSrc: audioSrc
          });
        }
      }
    };
    
    // Call sync function periodically to maintain consistency
    useEffect(() => {
      const syncInterval = setInterval(syncAudioState, 1000);
      return () => clearInterval(syncInterval);
    }, [audioSrc]);

    // Test function to verify audio element functionality
    const testAudioElement = () => {
      console.log('🧪 Testing audio element...');
      
      // First check the status
      const isReady = checkAndFixAudioStatus();
      
      if (!isReady) {
        console.log('🧪 Audio not ready, cannot test');
        return;
      }
      
      // Test pause functionality
      if (!audioRef.current.paused) {
        console.log('🧪 Testing pause...');
        audioRef.current.pause();
        console.log('🧪 After pause:', {
          paused: audioRef.current.paused,
          currentTime: audioRef.current.currentTime
        });
      } else {
        console.log('🧪 Audio is already paused, testing play...');
        audioRef.current.play().then(() => {
          console.log('🧪 Play test successful');
        }).catch((error) => {
          console.error('🧪 Play test failed:', error);
        });
      }
    };
    
    // Expose test function globally for debugging
    useEffect(() => {
      window.testAudioElement = testAudioElement;
      return () => {
        delete window.testAudioElement;
      };
    }, []);

    // Function to check and fix audio element status
    const checkAndFixAudioStatus = () => {
      if (!audioRef.current) {
        console.log('❌ No audio element available');
        return false;
      }
      
      console.log('🔍 Checking audio element status:', {
        readyState: audioRef.current.readyState,
        networkState: audioRef.current.networkState,
        paused: audioRef.current.paused,
        currentTime: audioRef.current.currentTime,
        duration: audioRef.current.duration,
        src: audioRef.current.src,
        error: audioRef.current.error
      });
      
      // Check if audio is in a usable state
      if (audioRef.current.readyState < 2) {
        console.log('⚠️ Audio not ready, attempting to reload...');
        
        if (audioSrc) {
          // Force reload the audio source
          audioRef.current.src = audioSrc;
          audioRef.current.load();
          console.log('🔄 Audio source reloaded');
          return false; // Not ready yet
        } else {
          console.log('❌ No audio source available');
          return false;
        }
      }
      
      if (audioRef.current.error) {
        console.error('❌ Audio has error:', audioRef.current.error);
        return false;
      }
      
      console.log('✅ Audio element is ready');
      return true;
    };
    
    // Call this function before any audio operations
    const ensureAudioReady = () => {
      return checkAndFixAudioStatus();
    };

    // General safety check function
    const isAudioElementValid = () => {
      return audioRef.current && audioRef.current instanceof HTMLAudioElement;
    };
    
    // Safe audio operations
    const safeAudioOperation = (operation) => {
      try {
        if (isAudioElementValid()) {
          return operation();
        } else {
          console.warn('Audio element not valid for operation');
          return false;
        }
      } catch (error) {
        console.error('Audio operation failed:', error);
        return false;
      }
    };

    // Use a global audio element that persists across navigation
    const audioRef = useRef(null);
    
    // Initialize audio element properly
    useEffect(() => {
      if (!audioRef.current) {
        console.log('🎵 Creating new audio element');
        audioRef.current = new Audio();
        audioRef.current.crossOrigin = "anonymous";
        audioRef.current.preload = "metadata";
        
        // Add event listeners for better debugging
        audioRef.current.addEventListener('play', () => {
          console.log('🎵 Audio play event fired');
          setIsAudioActuallyPlaying(true);
          setIsGlobalPlaying(true);
        });
        
        audioRef.current.addEventListener('pause', () => {
          console.log('⏸️ Audio pause event fired');
          setIsAudioActuallyPlaying(false);
          setIsGlobalPlaying(false);
        });
        
        audioRef.current.addEventListener('ended', () => {
          console.log('🔚 Audio ended event fired');
          setIsAudioActuallyPlaying(false);
          setIsGlobalPlaying(false);
          setIsPlaying(false);
        });
        
        audioRef.current.addEventListener('error', (e) => {
          console.error('❌ Audio error event:', e);
        });
        
        audioRef.current.addEventListener('loadstart', () => {
          console.log('🔄 Audio loadstart event');
        });
        
        audioRef.current.addEventListener('canplay', () => {
          console.log('✅ Audio canplay event');
        });
        
        audioRef.current.addEventListener('loadedmetadata', () => {
          console.log('📊 Audio loadedmetadata event');
        });
      }
      
      // Return cleanup function
      return () => {
        // Don't destroy the audio element on unmount to preserve state
        // Just clean up any temporary references if needed
      };
    }, []);


    return (
        <div className="audio-player">
          {/* Auto-play Notification */}
          {showAutoPlayNotification && (
            <div className="auto-play-notification">
              <div className="notification-content">
                <div className="notification-icon">▶️</div>
                <div className="notification-text">
                  <div className="notification-title">Now Playing</div>
                  <div className="notification-track">{autoPlayTrackInfo.name}</div>
                  <div className="notification-artist">{autoPlayTrackInfo.artist}</div>
                  <div className="notification-position">Track {autoPlayTrackInfo.index} of {autoPlayTrackInfo.total}</div>
                </div>
              </div>
            </div>
          )}

          {/* Main Player Controls */}
          <div className="progress-section">
            <div className="time-display">
              <span className="current-time">{formatTime(trackProgress)}</span>
              <span className="total-time">
              {duration ? formatTime(duration) : 
               (tracks && tracks[currentIndex] ? formatTime((tracks[currentIndex]?.duration || 0) / 1000) : '0:00')}
            </span>
            </div>
            
            <div className="progress-container" onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const clickPercentage = (clickX / rect.width) * 100;
              const newTime = (clickPercentage / 100) * duration;
              if (audioRef.current && duration) {
                audioRef.current.currentTime = newTime;
                setTrackProgress(newTime);
              }
            }}>
              <div 
                className="progress-bar" 
                style={{ width: `${currentPercentage}%` }}
              ></div>
            </div>
          </div>
          
          {/* Main Controls */}
          <div className="controls-section">
            <button 
              className="control-btn"
              onClick={handlePrev}
              disabled={!tracks || tracks.length <= 1}
              title="Previous"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>
            
            <button 
              className="play-btn"
              onClick={async () => {
                console.log("🎵 Play/Pause button clicked!");
                
                // Check if audio element exists
                if (!audioRef.current) {
                  console.error("❌ No audio element available");
                  return;
                }
                
                // Check if audio source is available
                if (!audioSrc) {
                  console.error("❌ No audio source available");
                  return;
                }
                
                // Ensure audio is ready before proceeding
                if (!ensureAudioReady()) {
                  console.log("⏳ Audio not ready, please wait...");
                  return;
                }
                
                // Disable button temporarily to prevent rapid clicking
                setIsButtonDisabled(true);
                setTimeout(() => setIsButtonDisabled(false), 300);
                
                try {
                  if (isPlaying) {
                    // Pause audio
                    console.log("⏸️ Pausing audio...");
                    
                    // Direct pause call
                    audioRef.current.pause();
                    
                    // Update states
                    setIsPlaying(false);
                    setIsGlobalPlaying(false);
                    setIsAudioActuallyPlaying(false);
                    
                    // Clear timer
                    clearInterval(intervalRef.current);
                    
                    console.log("✅ Audio paused successfully");
                    
                  } else {
                    // Play audio
                    console.log("▶️ Starting audio...");
                    
                    // Set source if needed
                    if (audioRef.current.src !== audioSrc) {
                      audioRef.current.src = audioSrc;
                      audioRef.current.load();
                    }
                    
                    // Update states first
                    setIsPlaying(true);
                    setIsGlobalPlaying(true);
                    
                    // Try to play
                    try {
                      await audioRef.current.play();
                      console.log("✅ Audio started successfully");
                      setIsAudioActuallyPlaying(true);
                    } catch (playError) {
                      console.error("❌ Play failed:", playError);
                      // Reset states on error
                      setIsPlaying(false);
                      setIsGlobalPlaying(false);
                      setIsAudioActuallyPlaying(false);
                    }
                  }
                } catch (error) {
                  console.error("❌ Error in play/pause:", error);
                  // Reset states on error
                  setIsPlaying(false);
                  setIsGlobalPlaying(false);
                  setIsAudioActuallyPlaying(false);
                }
              }}
              disabled={isButtonDisabled}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
            
            <button 
              className="control-btn"
              onClick={handleNext}
              disabled={!tracks || tracks.length <= 1}
              title="Next"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
          </div>
          
          {/* Auto-play Toggle */}
          <div className="auto-play-section">
            <button 
              className={`auto-play-btn ${autoPlayNext ? 'enabled' : 'disabled'}`}
              onClick={() => setAutoPlayNext(!autoPlayNext)}
              title={autoPlayNext ? "Disable auto-play next" : "Enable auto-play next"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                {autoPlayNext ? (
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                ) : (
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                )}
              </svg>
              <span className="auto-play-label">{autoPlayNext ? 'Auto-play ON' : 'Auto-play OFF'}</span>
            </button>
          </div>

          {/* Volume Control */}
          <div className="volume-section">
            <button 
              className="volume-btn"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                </svg>
              ) : volume < 0.5 ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              )}
            </button>
            
            <div className="volume-slider-container">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const newVolume = parseFloat(e.target.value);
                  setVolume(newVolume);
                  if (newVolume > 0) setIsMuted(false);
                }}
                className="volume-slider"
                style={{
                  background: `linear-gradient(to right, #667eea 0%, #667eea ${(isMuted ? 0 : volume) * 100}%, #333 ${(isMuted ? 0 : volume) * 100}%, #333 100%)`
                }}
              />
            </div>
          </div>
        </div>
  )
}
