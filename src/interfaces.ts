/*
 * Copyright (c) 2024, DataStax (Phil Miesle)
 *
 * Licensed under the MIT License. See LICENSE.txt in the project root for license information.
 *
 */
/**
 * Options for configuring the CacheManager.
 */
export interface CacheManagerOptions {
    /** Time to live in seconds for each cache entry. Optional. */
    ttlSeconds?: number;
}

/**
 * Interface for a cache manager, providing basic cache operations.
 */
export interface ICacheManager {
    /**
     * Sets a value in the cache with an optional TTL (time to live).
     * 
     * @param {string} key The key under which the value is stored.
     * @param {any} value The value to store in the cache.
     * @param {number} [ttl] Optional time to live in seconds.
     */
    set(key: string, value: any, ttl?: number): void;

    /**
     * Retrieves a value from the cache.
     * 
     * @template T The type of the expected value.
     * @param {string} key The key of the value to retrieve.
     * @returns {T | null} The value if found, otherwise null.
     */
    get<T>(key: string): T | null;

    /**
     * Deletes a value from the cache by its key.
     * 
     * @param {string} key The key of the value to delete.
     */
    del(key: string): void;

    /**
     * Flushes all values from the cache.
     */
    flush(): void;
}

/**
 * Options for configuring a Paginator.
 */
export interface PaginatorOptions {
    /** The number of items per page. Optional. */
    pageSize?: number;
}

/**
 * Interface for pagination logic, allowing for adding items and retrieving by page.
 * 
 * @template T The type of items being paginated.
 */
export interface IPaginator<T> {
    /**
     * Retrieves the items for a specific page number.
     * 
     * @param {number} pageNumber The page number to retrieve.
     * @returns {T[] | null} An array of items for the page or null if the page does not exist.
     */
    getPage(pageNumber: number): T[] | null;

    /**
     * Adds new items to the pagination, updating existing pages and creating new ones as needed.
     * 
     * @param {T[]} newItems The new items to add to the pagination.
     */
    addItems(newItems: T[]): void;

    /**
     * Retrieves the total number of pages available.
     * 
     * @returns {number} The total number of pages.
     */
    getTotalPages(): number;
}
