/*
 * Copyright (c) 2024, DataStax (Phil Miesle)
 *
 * Licensed under the MIT License. See LICENSE.txt in the project root for license information.
 *
 */
import { CassandraPaginator } from '../../src/CassandraPaginator'; 
import { Client } from 'cassandra-driver';

const PAGE_SIZE = 25;
const FETCH_SIZE = PAGE_SIZE * 2;

let executeMockBehavior: (query: string, params: any[], options: any) => Promise<any>;

jest.mock('cassandra-driver', () => ({
    Client: jest.fn().mockImplementation(() => ({
        execute: jest.fn((query, params, options) => executeMockBehavior(query, params, options)),
    })),
}));

describe('CassandraPaginator - Main Tests', () => {
    let client: Client;
    let paginator: CassandraPaginator;
  
    beforeEach(() => {
      // The mock setup from the initial script remains unchanged here
      client = new Client({
        contactPoints: ['localhost'],
        localDataCenter: 'datacenter1',
        keyspace: 'mykeyspace',
      });
  
      paginator = new CassandraPaginator(client, 'SELECT * FROM myTable', [], {fetchSize: FETCH_SIZE}, {pageSize: PAGE_SIZE});
  
      // Default behavior reset, to be overridden in each test as needed
      executeMockBehavior = jest.fn(() => Promise.resolve({
        rows: [],
        pageState: undefined,
      }));
    });
  
    it('handles a full page of results correctly', async () => {
        const recordCount = 2 * PAGE_SIZE - 5;

        // Simulate exactly PAGE_SIZE rows returned on the first fetch
        executeMockBehavior = jest.fn().mockResolvedValueOnce({
          rows: Array.from({ length: recordCount }, (_, i) => ({ id: i, name: `item${i + 1}` })),
          pageState: undefined,
        })
      
        // Requesting the first page, expecting it to trigger fetching of the first batch
        const page = await paginator.getPage(1);
        expect(page).toHaveLength(PAGE_SIZE); // First fetch should fill a full page
      
        // To verify the behavior when query is considered exhausted after the next fetch
        const nextPage = await paginator.getPage(2);
        expect(nextPage).toHaveLength(recordCount - PAGE_SIZE); // Second fetch returns fewer rows, indicating end
        expect(paginator.getTotalPages()).toBe(2); // Now totalPages should be known
      });
        
    it('first page less than full', async () => {
      // Simulate less than PAGE_SIZE rows returned
      const partialPageSize = PAGE_SIZE - 10;
      executeMockBehavior = jest.fn(() => Promise.resolve({
        rows: Array.from({ length: partialPageSize }, (_, i) => ({ id: i, name: `item${i + 1}` })),
        pageState: undefined,
      }));
  
      const page = await paginator.getPage(1);
      expect(page).toHaveLength(partialPageSize);
      expect(paginator.getTotalPages()).toBe(1);
    });
  
    it('handles an empty result set correctly', async () => {
      // Simulate no rows returned
      executeMockBehavior = jest.fn(() => Promise.resolve({
        rows: [],
        pageState: undefined,
      }));
  
      const page = await paginator.getPage(1);
      expect(page).toBeNull();
      expect(paginator.getTotalPages()).toBe(0); // As no data implies query exhaustion
    });
  
    it('handles multiple sequential fetches with more data available', async () => {
        const totalFetches = 3; // Simulate data enough for three fetches
        let fetchCount = 0;
    
        executeMockBehavior = jest.fn(() => {
            fetchCount++;
            return Promise.resolve({
                rows: Array.from({ length: FETCH_SIZE }, (_, i) => ({ id: i + FETCH_SIZE * (fetchCount - 1), name: `item${i + 1}` })),
                pageState: fetchCount < totalFetches ? 'hasMoreData' : undefined,
            });
        });
    
        const expectedPages = totalFetches * FETCH_SIZE / PAGE_SIZE;
        let totalPagesFound = 0;
        let currentPage = 1;
        let pageData;
    
        // Loop until getTotalPages() returns a concrete number, indicating the data is exhausted
        do {
            pageData = await paginator.getPage(currentPage);
            if (pageData) {
                expect(pageData.length).toBeLessThanOrEqual(PAGE_SIZE); // Each page should have PAGE_SIZE or fewer records
                totalPagesFound++;
                currentPage++;
            }
        } while (paginator.getTotalPages() === null); // Continue until the total pages are known
    
        // Now that the data is exhausted, getTotalPages() should return the total pages found
        expect(paginator.getTotalPages()).toBe(expectedPages);
    });
        
    it('skip first page', async () => {
        // Simulate initial fetch with data but indicate no more data afterwards
        executeMockBehavior = jest.fn().mockResolvedValueOnce({
            rows: Array.from({ length: FETCH_SIZE }, (_, i) => ({ id: i, name: `item${i + 1}` })),
            pageState: undefined,
        }).mockResolvedValueOnce({
            rows: [],
            pageState: undefined,
        });
    
        const page = await paginator.getPage(2);
        expect(page).toHaveLength(PAGE_SIZE);
    
        const nextPage = await paginator.getPage(3);
        expect(nextPage).toBeNull();
        expect(paginator.getTotalPages()).toBe(2);
    });

    it('first call is to a non-existing page', async () => {
        // Simulate initial fetch with data but indicate no more data afterwards
        executeMockBehavior = jest.fn().mockResolvedValueOnce({
            rows: Array.from({ length: FETCH_SIZE }, (_, i) => ({ id: i, name: `item${i + 1}` })),
            pageState: undefined,
        }).mockResolvedValueOnce({
            rows: [],
            pageState: undefined,
        });
    
        const nextPage = await paginator.getPage(3);
        expect(nextPage).toBeNull();
        expect(paginator.getTotalPages()).toBe(2);
    });

    it('fetches next page sequentially', async () => {
        // Setup mock to return specific data for first two pages
        executeMockBehavior = jest.fn()
            .mockResolvedValueOnce({
                rows: Array.from({ length: PAGE_SIZE * 2 }, (_, i) => ({ id: i, name: `item${i + 1}` })),
                pageState: undefined,
            });
    
        // Fetch first page using getNextPage()
        const firstPage = await paginator.getNextPage();
        expect(paginator.getCurrentPageNumber()).toBe(1);
        expect(firstPage).not.toBeNull();
        expect(firstPage).toHaveLength(PAGE_SIZE);
        if (firstPage) {
            expect(firstPage[0].name).toBe('item1'); // Check first item of first page
        }
    
        // Fetch second page using getNextPage()
        const secondPage = await paginator.getNextPage();
        expect(paginator.getCurrentPageNumber()).toBe(2);
        expect(secondPage).not.toBeNull();
        expect(secondPage).toHaveLength(PAGE_SIZE);
        if (secondPage) {
            expect(secondPage[0].name).toBe(`item${PAGE_SIZE + 1}`); // Check first item of second page
        }
    });

    it('returns null when no more pages are available', async () => {
        // Setup mock to return just enough data for one page
        executeMockBehavior = jest.fn().mockResolvedValueOnce({
            rows: Array.from({ length: PAGE_SIZE }, (_, i) => ({ id: i, name: `item${i + 1}` })),
            pageState: undefined, 
        });
    
        // Fetch first page
        await paginator.getNextPage();
        expect(paginator.getCurrentPageNumber()).toBe(1);

        // Attempt to fetch beyond the last page
        const beyondLastPage = await paginator.getNextPage();
        expect(beyondLastPage).toBeNull();
    });
    
    it('handles initial call to getNextPage() correctly', async () => {
        // Setup mock to return data for the first page
        executeMockBehavior = jest.fn().mockResolvedValueOnce({
            rows: Array.from({ length: PAGE_SIZE }, (_, i) => ({ id: i, name: `item${i + 1}` })),
            pageState: undefined,
        });
    
        // Directly call getNextPage() without a prior getPage() call
        expect(paginator.getCurrentPageNumber()).toBeNull();
        const firstPage = await paginator.getNextPage();
        expect(paginator.getCurrentPageNumber()).toBe(1);
        expect(firstPage).toHaveLength(PAGE_SIZE);
    });

    it('interacts correctly with direct getPage() calls', async () => {
        // Assume PAGE_SIZE items per page and setup mock behavior
        executeMockBehavior = jest.fn()
            .mockResolvedValueOnce({
                rows: Array.from({ length: PAGE_SIZE*2 }, (_, i) => ({ id: i, name: `item${i + 1}` })),
                pageState: undefined,
            });
    
        // Directly access the second page
        const directSecondPage = await paginator.getPage(2);
        expect(directSecondPage).not.toBeNull();
        expect(directSecondPage).toHaveLength(PAGE_SIZE);
        expect(paginator.getCurrentPageNumber()).toBe(2);
        if(directSecondPage) {
            expect(directSecondPage[0].name).toBe(`item${PAGE_SIZE + 1}`);
        }
    
        // Then try to fetch the next page, which should be null since we are at the end
        const nextPageAfterDirect = await paginator.getNextPage();
        expect(nextPageAfterDirect).toBeNull();
        expect(paginator.getCurrentPageNumber()).toBe(2);
    });
        
});

// This describe simply confirms that the basic approach to smoke testing is working.
describe.skip('CassandraPaginator - Mock smoke test', () => {
    let client: Client;
    let paginator: CassandraPaginator;
  
    beforeEach(() => {
      // Reset the mock behavior before each test
      executeMockBehavior = jest.fn(() => Promise.resolve({
        rows: [],
        pageState: undefined,
      }));

      client = new Client({
        contactPoints: ['localhost'],
        localDataCenter: 'datacenter1',
        keyspace: 'mykeyspace',
      });

      paginator = new CassandraPaginator(client, 'SELECT * FROM myTable', [], {fetchSize: FETCH_SIZE}, {pageSize: PAGE_SIZE});
    });

    // Example test
    it('fetches and paginates results correctly', async () => {
      // Define the behavior for this test
      executeMockBehavior = jest.fn(() => Promise.resolve({
        rows: Array.from({ length: PAGE_SIZE + 1}, (_, i) => ({ id: i, name: `item${i + 1}` })),
        pageState: undefined,
      }));

      const page = await paginator.getPage(1);
      expect(page).not.toBeNull();
      expect(page).toHaveLength(PAGE_SIZE);
    });
});

describe.skip('CassandraPaginator - Debug Tests', () => {
    let client: Client;
    let paginator: CassandraPaginator;
  
    beforeEach(() => {
      // The mock setup from the initial script remains unchanged here
      client = new Client({
        contactPoints: ['localhost'],
        localDataCenter: 'datacenter1',
        keyspace: 'mykeyspace',
      });
  
      paginator = new CassandraPaginator(client, 'SELECT * FROM myTable', [], {fetchSize: FETCH_SIZE}, {pageSize: PAGE_SIZE});
  
      // Default behavior reset, to be overridden in each test as needed
      executeMockBehavior = jest.fn(() => Promise.resolve({
        rows: [],
        pageState: undefined,
      }));
    });

    it('handles initial call to getNextPage() correctly', async () => {
        // Setup mock to return data for the first page
        executeMockBehavior = jest.fn().mockResolvedValueOnce({
            rows: Array.from({ length: PAGE_SIZE }, (_, i) => ({ id: i, name: `item${i + 1}` })),
            pageState: undefined,
        });
    
        // Directly call getNextPage() without a prior getPage() call
        expect(paginator.getCurrentPageNumber()).toBeNull();
        const firstPage = await paginator.getNextPage();
        expect(paginator.getCurrentPageNumber()).toBe(1);
        expect(firstPage).toHaveLength(PAGE_SIZE);
    });

});
