/*
 * Copyright (c) 2024, DataStax (Phil Miesle)
 *
 * Licensed under the MIT License. See LICENSE.txt in the project root for license information.
 *
 */
import { Paginator } from '../../src/Paginator';
import { MockCacheManager } from '../mocks/MockCacheManager';

describe('Paginator', () => {
    let mockCacheManager: MockCacheManager;
    const pageSize = 10;

    beforeEach(() => {
        mockCacheManager = new MockCacheManager();
    });

    it('correctly calculates total pages', () => {
        const values = Array.from({ length: 104 }, (_, i) => i + 1);
        const paginator = new Paginator<number>(mockCacheManager, values, {pageSize: pageSize});
        expect(paginator.getTotalPages()).toBe(11);
    });

    it('loads and retrieves pages with correct values', () => {
        const values = Array.from({ length: 104 }, (_, i) => i + 1);
        const paginator = new Paginator<number>(mockCacheManager, values, {pageSize: pageSize});
        expect(paginator.getPage(1)).toEqual(values.slice(0, pageSize));
        // Now we can directly check if 'get' was called with 'page_1'
        expect(mockCacheManager.get).toHaveBeenCalledWith('page_1');
    });

    it('ensures cache manager set method is called correctly', () => {
        const values = Array.from({ length: 104 }, (_, i) => i + 1);
        new Paginator<number>(mockCacheManager, values, {pageSize: pageSize});
        // Check if 'set' was called 11 times
        expect(mockCacheManager.set).toHaveBeenCalledTimes(11);
    });

    it('retrieves correct values for all pages', () => {
        const values = Array.from({ length: 45 }, (_, i) => i + 1); // 45 items
        const paginator = new Paginator<number>(mockCacheManager, values, {pageSize: pageSize});

        for (let i = 1; i <= paginator.getTotalPages(); i++) {
            const expectedPage = values.slice((i - 1) * pageSize, i * pageSize);
            expect(paginator.getPage(i)).toEqual(expectedPage);
        }
    });

    it('handles empty values array gracefully', () => {
        const paginator = new Paginator<number>(mockCacheManager, [], {pageSize: pageSize});
        expect(paginator.getTotalPages()).toBe(0);
        expect(paginator.getPage(1)).toBeNull();
    });

    it('behaves correctly when page size is larger than total items', () => {
        const values = Array.from({ length: 5 }, (_, i) => i + 1); // 5 items
        const paginator = new Paginator<number>(mockCacheManager, values, {pageSize: 10}); // Page size of 10
        expect(paginator.getTotalPages()).toBe(1);
        expect(paginator.getPage(1)).toEqual(values);
        expect(paginator.getPage(2)).toBeNull(); // Out of bounds
    });

    it('handles single-item scenario correctly', () => {
        const paginator = new Paginator<number>(mockCacheManager, [42], {pageSize: pageSize});
        expect(paginator.getTotalPages()).toBe(1);
        expect(paginator.getPage(1)).toEqual([42]);
    });

});
