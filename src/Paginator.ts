/*
 * Copyright (c) 2024, Phil Miesle
 *
 * Licensed under the MIT License. See LICENSE.txt in the project root for license information.
 *
 */

import { ICacheManager, IPaginator, PaginatorOptions } from './interfaces';

export class Paginator<T> implements IPaginator<T> {
  private cacheManager: ICacheManager;
  private pageSize: number;
  private totalPages: number;

  constructor(cacheManager: ICacheManager, values: T[], options: PaginatorOptions = {}) {
    this.cacheManager = cacheManager;
    this.pageSize = options.pageSize || 10;

    // Initialize totalPages to 0 and let addItems handle the initial load
    this.totalPages = 0;
    this.addItems(values);
  }

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

public getPage(pageNumber: number): T[] | null {
    if (pageNumber < 1 || pageNumber > this.totalPages) {
      return null; // Page number out of range
    }
    return this.cacheManager.get<T[]>(`page_${pageNumber}`);
  }

  public getTotalPages(): number {
    return this.totalPages;
  }
}
