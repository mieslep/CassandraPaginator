/*
 * Copyright (c) 2024, DataStax (Phil Miesle)
 *
 * Licensed under the MIT License. See LICENSE.txt in the project root for license information.
 *
 */

import NodeCache from 'node-cache';
import { CacheManagerOptions, ICacheManager } from './interfaces';

/**
 * CacheManager provides a simple caching mechanism based on NodeCache.
 * It allows setting, getting, deleting, and flushing cached values with optional TTL (Time To Live).
 */
export class CacheManager implements ICacheManager {
    private cache: NodeCache;

    /**
     * Creates an instance of CacheManager with optional cache options.
     * 
     * @param {CacheManagerOptions} options Configuration options for the cache, including TTL.
     */
    constructor(options: CacheManagerOptions = {}) {
        const ttlSeconds = options.ttlSeconds || 60; // Default TTL is 60 seconds
        this.cache = new NodeCache({ stdTTL: ttlSeconds });
    }

    /**
     * Sets a value in the cache with an optional TTL.
     * 
     * @param {string} key The cache key to set.
     * @param {unknown} value The value to cache.
     * @param {number} [ttl] Optional TTL (Time To Live) for the cache entry in seconds.
     */
    set(key: string, value: unknown, ttl?: number): void {
        if (ttl) {
            this.cache.set(key, value, ttl);
        } else {
            this.cache.set(key, value);
        }
    }

    /**
     * Retrieves a value from the cache by key.
     * 
     * @template T The expected type of the cached value.
     * @param {string} key The cache key to retrieve.
     * @returns {T | null} The cached value if found and not expired, or null if not found.
     */
    get<T>(key: string): T | null {
        const value = this.cache.get<T>(key);
        return value !== undefined ? value : null;
    }

    /**
     * Deletes a value from the cache by key.
     * 
     * @param {string} key The cache key to delete.
     */
    del(key: string): void {
        this.cache.del(key);
    }

    /**
     * Flushes all data from the cache.
     */
    flush(): void {
        this.cache.flushAll();
    }
}
