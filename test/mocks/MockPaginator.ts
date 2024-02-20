/*
 * Copyright (c) 2024, DataStax (Phil Miesle)
 *
 * Licensed under the MIT License. See LICENSE.txt in the project root for license information.
 *
 */
import { IPaginator } from '../../src/interfaces';

export class MockPaginator<T> implements IPaginator<T> {
    private totalPages: number;
    private currentPageData: T[] | null = null;

    constructor(values: T[], totalPages: number) {
        this.currentPageData = values;
        this.totalPages = totalPages;
    }

    public addItems(newItems: T[]): void {
        // Simulate adding items to the paginator
        // This is a no-op for the mock
    }

    public getPage(pageNumber: number): T[] | null {
        // Simulate getting a page.
        if (pageNumber < 1 || pageNumber > this.totalPages) {
            return null;
        }
        return this.currentPageData;
    }

    public getTotalPages(): number {
        return this.totalPages;
    }

    // Utility method for tests to set expected data for getPage method
    public setCurrentPageData(data: T[] | null, totalPages?: number): void {
        this.currentPageData = data;
        this.totalPages = totalPages || this.totalPages;
    }

    // Utility method for tests to set expected totalPages
    public setTotalPages(totalPages: number): void {
        this.totalPages = totalPages;
    }
}
