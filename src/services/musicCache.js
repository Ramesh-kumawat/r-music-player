// Music Cache Service for better performance
class MusicCache {
  constructor() {
    this.cache = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    this.MAX_CACHE_SIZE = 100; // Maximum cached items
  }

  // Generate cache key
  generateKey(operation, params) {
    return `${operation}_${JSON.stringify(params)}`;
  }

  // Get cached data
  get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    // Remove expired cache
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  // Set cache data
  set(key, data) {
    // Check cache size limit
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entries
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Clear expired cache
  clearExpired() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  // Clear all cache
  clear() {
    this.cache.clear();
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: this.calculateHitRate()
    };
  }

  // Calculate cache hit rate (placeholder for now)
  calculateHitRate() {
    return 0.85; // Placeholder
  }
}

// Performance monitoring
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      sourceLoadTimes: {},
      userInteractions: [],
      errorRates: {},
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  trackSourcePerformance(source, loadTime) {
    if (!this.metrics.sourceLoadTimes[source]) {
      this.metrics.sourceLoadTimes[source] = [];
    }
    this.metrics.sourceLoadTimes[source].push(loadTime);
    
    // Keep only last 50 measurements
    if (this.metrics.sourceLoadTimes[source].length > 50) {
      this.metrics.sourceLoadTimes[source] = this.metrics.sourceLoadTimes[source].slice(-50);
    }
  }

  trackCacheHit() {
    this.metrics.cacheHits++;
  }

  trackCacheMiss() {
    this.metrics.cacheMisses++;
  }

  getAverageLoadTime(source) {
    const times = this.metrics.sourceLoadTimes[source];
    if (!times || times.length === 0) return 0;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  getPerformanceReport() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0,
      averageLoadTimes: Object.keys(this.metrics.sourceLoadTimes).reduce((acc, source) => {
        acc[source] = this.getAverageLoadTime(source);
        return acc;
      }, {})
    };
  }
}

// Export instances
export const musicCache = new MusicCache();
export const performanceMonitor = new PerformanceMonitor();

// Auto-cleanup expired cache every minute
setInterval(() => {
  musicCache.clearExpired();
}, 60 * 1000);

export default musicCache;
