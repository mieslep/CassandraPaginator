/*
 * Copyright (c) 2024, DataStax (Phil Miesle)
 *
 * Licensed under the MIT License. See LICENSE.txt in the project root for license information.
 *
 */
import { Client, QueryOptions, types, ArrayOrObject } from 'cassandra-driver';
import { Paginator } from './Paginator';
import { CacheManager } from './CacheManager';
import { PaginatorOptions, CacheManagerOptions } from './interfaces';

const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_FETCH_SIZE = 1000;

/**
 * CassandraPaginator provides pagination functionality for Cassandra query results.
 * It allows fetching query results page by page with a specified page size.
 */
export class CassandraPaginator {
    private client: Client;
    private query: string;
    private queryParams: ArrayOrObject;
    private queryOptions: QueryOptions;
    private paginator: Paginator<types.Row>;
    private queryPageState: string | Buffer | undefined = undefined;
    private isQueryStarted: boolean = false;
    private isQueryExhausted: boolean = false;
    private fetchSize: number;
    private currentPageNumber: number = 0;

    /**
     * Constructs a new CassandraPaginator instance.
     * 
     * @param {Client} client The Cassandra client instance to use for queries.
     * @param {string} query The CQL query string.
     * @param {ArrayOrObject} queryParams Parameters for the CQL query.
     * @param {QueryOptions} queryOptions Additional options for the query execution.
     * @param {PaginatorOptions} paginatorOptions Options to customize pagination behavior, including page size.
     * @param {CacheManagerOptions} cacheManagerOptions Options for the underlying cache manager.
     */
    constructor(
        client: Client,
        query: string,
        queryParams: ArrayOrObject = [],
        queryOptions: QueryOptions = {},
        paginatorOptions: PaginatorOptions = {},
        cacheManagerOptions: CacheManagerOptions = {}
    ) {
        this.client = client;
        this.query = query;
        this.queryParams = queryParams;
        const pageSize = paginatorOptions.pageSize || DEFAULT_PAGE_SIZE;
        this.paginator = new Paginator<types.Row>(new CacheManager(cacheManagerOptions), [], { ...paginatorOptions, pageSize: pageSize });
        this.fetchSize = this._calculateAdjustedFetchSize(queryOptions.fetchSize || DEFAULT_FETCH_SIZE, pageSize);
        this.queryOptions = { ...queryOptions, fetchSize: this.fetchSize, autoPage: false, prepare: true };
    }

    /**
     * Fetches a specific page of query results based on the page number.
     * 
     * @param {number} pageNumber The number of the page to fetch.
     * @returns {Promise<types.Row[] | null>} A promise that resolves to an array of rows for the page or null if the page does not exist.
     */
    async getPage(pageNumber: number): Promise<types.Row[] | null> {
        while (this.paginator.getTotalPages() < pageNumber && !this.isQueryExhausted) {
            await this.fetchNextBatch();
        }

        const pageData = this.paginator.getPage(pageNumber);
        if (pageData) {
            this.currentPageNumber = pageNumber;
        }
    
        return pageData;
    }

    /**
     * Fetches the next page of query results based on the current page.
     * 
     * @returns {Promise<types.Row[] | null>} A promise that resolves to an array of rows for the next page or null if there are no more pages.
     */
    async getNextPage(): Promise<types.Row[] | null> {
        // Increment the current page number to get the next page
        this.currentPageNumber++;
    
        // Try to fetch the next page
        const nextPageData = await this.getPage(this.currentPageNumber);
    
        // If nextPageData is null, it means we are past the last page
        if (!nextPageData) {
            this.currentPageNumber =this.getTotalPages() || 0;
            return null;
        }
    
        return nextPageData;
    }

    /**
     * Returns the current page number being viewed.
     * 
     * @returns {number | null} The current page number if available, or null if no pages have been fetched yet.
     */
    getCurrentPageNumber(): number | null {
        return this.isQueryStarted ? this.currentPageNumber : null;
    }        

    /**
     * Returns the total number of pages available.
     * 
     * @returns {number | null} The total number of pages if known, or null if the query results are not fully exhausted yet.
     */
    getTotalPages(): number | null {
        // Return null if the query isn't exhausted yet, indicating total pages are unknown
        return this.isQueryExhausted ? this.paginator.getTotalPages() : null;
    }

    /**
     * Fetches the next batch of rows from the query results.
     * This method updates internal state to keep track of pagination progress.
     * 
     * @private
     */
    private async fetchNextBatch(): Promise<void> {
        if (this.isQueryExhausted) return;

        let result: types.ResultSet;
        if (!this.isQueryStarted) {
            result = await this.client.execute(this.query, this.queryParams, this.queryOptions);
            this.isQueryStarted = true;
        }
        else {
            const execOptions: QueryOptions = { ...this.queryOptions, pageState: this.queryPageState };
            result = await this.client.execute(this.query, this.queryParams, execOptions);
        }
        this.queryPageState = result.pageState;
        this.paginator.addItems(result.rows);

        if (result.rows.length < this.fetchSize || !this.queryPageState) {
            this.isQueryExhausted = true;
        }
    }

    /**
     * Calculates an adjusted fetch size based on the provided fetch size and page size.
     * This ensures that the fetch size is always a multiple of the page size to maintain consistent pagination.
     * 
     * @param {number} fetchSize The initial fetch size.
     * @param {number} pageSize The page size.
     * @returns {number} The adjusted fetch size.
     * @private
     */
    private _calculateAdjustedFetchSize(fetchSize: number, pageSize: number): number {
        const remainder = fetchSize % pageSize;
        if (remainder === 0) {
            return fetchSize;
        } else {
            return fetchSize + pageSize - remainder; // Round up to the next multiple of pageSize
        }
    }
}
