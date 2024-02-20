/*
 * Copyright (c) 2024, Phil Miesle
 *
 * Licensed under the MIT License. See LICENSE.txt in the project root for license information.
 *
 */
import { ICacheManager, IPaginator } from '../../src/interfaces';

export class MockPaginator<T> implements IPaginator<T> {
  private pageSize: number;
  private totalPages: number;
  private currentPageData: T[] | null = null;

  constructor(private cacheManager: ICacheManager, values: T[], pageSize: number = 10) {
    this.pageSize = pageSize;
    this.totalPages = Math.ceil(values.length / pageSize);
  }

  public getPage(pageNumber: number): T[] | null {
    // Simulate getting a page.
    return this.currentPageData;
  }

  public getTotalPages(): number {
    return this.totalPages;
  }

  // Utility method for tests to set expected data for getPage method
  public setCurrentPageData(data: T[] | null): void {
    this.currentPageData = data;
  }
}
