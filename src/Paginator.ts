/*
 * Copyright (c) 2024, Phil Miesle
 *
 * Licensed under the MIT License. See LICENSE.txt in the project root for license information.
 *
 */

import { ICacheManager, IPaginator } from './interfaces';

export class Paginator<T> implements IPaginator<T> {
  private cacheManager: ICacheManager;
  private pageSize: number;
  private totalPages: number;

  constructor(cacheManager: ICacheManager, values: T[], pageSize: number = 10) {
    this.cacheManager = cacheManager;
    this.pageSize = pageSize;

    // preload pages into the cache and calculate total pages
    this.totalPages = Math.ceil(values.length / pageSize);
    this.loadPages(values);
  }

  private loadPages(values: T[]): void {
    for (let i = 0; i < this.totalPages; i++) {
      const pageData = values.slice(i * this.pageSize, (i + 1) * this.pageSize);
      this.cacheManager.set(`page_${i + 1}`, pageData);
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
