/*
 * Copyright (c) 2024, DataStax (Phil Miesle)
 *
 * Licensed under the MIT License. See LICENSE.txt in the project root for license information.
 *
 */

import { ICacheManager, IPaginator, PaginatorOptions } from './interfaces';

/**
 * Paginator manages pagination logic for a dataset, allowing for efficient retrieval
 * of items by page. It leverages an underlying cache manager for storing paginated data.
 *
 * @template T The type of items being paginated.
 */
export class Paginator<T> implements IPaginator<T> {
    private cacheManager: ICacheManager;
    private pageSize: number;
    private totalPages: number;

    /**
     * Creates an instance of Paginator.
     *
     * @param {ICacheManager} cacheManager An instance of a cache manager for storing pagination data.
     * @param {T[]} values Initial set of items to paginate.
     * @param {PaginatorOptions} [options={}] Configuration options for pagination.
     */
    constructor(cacheManager: ICacheManager, values: T[], options: PaginatorOptions = {}) {
        this.cacheManager = cacheManager;
        this.pageSize = options.pageSize || 10;

        // Initialize totalPages to 0 and let addItems handle the initial load
        this.totalPages = 0;
        this.addItems(values);
    }

    /**
     * Adds new items to the pagination structure, updating existing pages and creating new ones as necessary.
     *
     * @param {T[]} newItems The new items to add to the pagination.
     */
    public addItems(newItems: T[]): void {
        if (newItems.length === 0) return; // No items to add

        // Calculate how many items can be added to the current last page, if it exists
        let spaceAvailableInLastPage = this.pageSize;
        if (this.totalPages > 0) {
            const lastPageItems = this.cacheManager.get<T[]>(`page_${this.totalPages}`);
            if (lastPageItems) {
                spaceAvailableInLastPage -= lastPageItems.length;
            }
        }

        let itemsToAddDirectly = newItems.slice(0, spaceAvailableInLastPage);
        let remainingItems = newItems.slice(spaceAvailableInLastPage);

        // Add items to the last page if there's space available
        if (itemsToAddDirectly.length > 0) {
            if (this.totalPages === 0) {
                // If there were no pages before, start the first page
                this.totalPages = 1;
            }
            const lastPageItems = this.cacheManager.get<T[]>(`page_${this.totalPages}`) || [];
            this.cacheManager.set(`page_${this.totalPages}`, lastPageItems.concat(itemsToAddDirectly));
        }

        // Handle remaining items by creating new pages
        while (remainingItems.length > 0) {
            const nextPageItems = remainingItems.slice(0, this.pageSize);
            remainingItems = remainingItems.slice(this.pageSize);

            // Increment totalPages as we're adding a new page
            this.totalPages++;
            this.cacheManager.set(`page_${this.totalPages}`, nextPageItems);
        }
    }

    /**
     * Retrieves the items for a specific page number.
     *
     * @param {number} pageNumber The number of the page to retrieve.
     * @returns {T[] | null} An array of items for the requested page, or null if the page number is out of range.
     */
    public getPage(pageNumber: number): T[] | null {
        if (pageNumber < 1 || pageNumber > this.totalPages) {
            return null; // Page number out of range
        }
        return this.cacheManager.get<T[]>(`page_${pageNumber}`);
    }

    /**
     * Gets the total number of pages available in the pagination.
     *
     * @returns {number} The total number of pages.
     */
    public getTotalPages(): number {
        return this.totalPages;
    }
}
