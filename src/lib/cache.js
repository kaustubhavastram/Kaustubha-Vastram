/**
 * Utility for caching data in localStorage with an expiration time.
 */

const CACHE_PREFIX = 'kv_cache_';

export const getCachedData = (key) => {
  try {
    const itemStr = localStorage.getItem(CACHE_PREFIX + key);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);
    const now = new Date();

    // Check if the item has expired
    if (now.getTime() > item.expiry) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return item.value;
  } catch (error) {
    console.warn('Error reading from cache:', error);
    return null;
  }
};

export const setCachedData = (key, value, ttlMinutes = 5) => {
  try {
    const now = new Date();
    const item = {
      value: value,
      expiry: now.getTime() + ttlMinutes * 60000,
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
  } catch (error) {
    console.warn('Error writing to cache:', error);
  }
};

export const clearCachePrefix = (keyPrefix) => {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_PREFIX + keyPrefix)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Error clearing cache:', error);
  }
};
