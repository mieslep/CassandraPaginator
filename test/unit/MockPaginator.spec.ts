/*
 * Copyright (c) 2024, DataStax (Phil Miesle)
 *
 * Licensed under the MIT License. See LICENSE.txt in the project root for license information.
 *
 */
import { MockPaginator } from '../mocks/MockPaginator';

describe('MockPaginator Tests', () => {
    let mockPaginator: MockPaginator<number>;

    beforeEach(() => {
        // Initialize MockPaginator with an empty array and 0 totalPages for simplicity
        mockPaginator = new MockPaginator<number>([], 0);
    });

    it('should allow setting and getting current page data', () => {
        const testData = [1, 2, 3];
        mockPaginator.setCurrentPageData(testData, 1);        

        // Directly test that getPage returns what we've set, simulating a getPage call
        expect(mockPaginator.getPage(1)).toEqual(testData);
    });

    it('should reflect updated total pages when set', () => {
        const totalPages = 5;
        mockPaginator.setTotalPages(totalPages);

        // Verify getTotalPages reflects the manually set total pages
        expect(mockPaginator.getTotalPages()).toBe(totalPages);
    });

    it('addItems should not affect currentPageData directly', () => {
        const initialData = [1, 2, 3];
        mockPaginator.setCurrentPageData(initialData, 1);

        // Attempt to add items, which in a mock, doesn't directly change currentPageData
        mockPaginator.addItems([4, 5, 6]);

        // Verify currentPageData remains unchanged, as addItems is a no-op in the mock
        expect(mockPaginator.getPage(1)).toEqual(initialData);
    });

    it('should simulate calling addItems with spyOn', () => {
        const spy = jest.spyOn(mockPaginator, 'addItems');
        const newItems = [4, 5, 6];

        // Simulate calling addItems on the mock
        mockPaginator.addItems(newItems);

        // Check that addItems was called with the correct parameters
        expect(spy).toHaveBeenCalledWith(newItems);
    });

    it('getPage should return null for pages out of range', () => {
        // Assuming the mock paginator has 0 totalPages initially
        expect(mockPaginator.getPage(1)).toBeNull(); // Page 1 is out of range for 0 totalPages

        // Set totalPages to simulate a populated paginator
        mockPaginator.setTotalPages(3);

        // Verify getPage returns null for a page number beyond the set totalPages
        expect(mockPaginator.getPage(4)).toBeNull();
    });
});
