/*
 * Copyright (c) 2024, Phil Miesle
 *
 * Licensed under the MIT License. See LICENSE.txt in the project root for license information.
 *
 */
import { MockCacheManager } from '../mocks/MockCacheManager';
import { MockPaginator } from '../mocks/MockPaginator';

describe('MockPaginator', () => {
  let mockCacheManager: MockCacheManager;
  let mockPaginator: MockPaginator<number>;

  beforeEach(() => {
    mockCacheManager = new MockCacheManager();
    const values = Array.from({ length: 100 }, (_, i) => i + 1);
    mockPaginator = new MockPaginator<number>(mockCacheManager, values, 10);
  });

  it('should return the correct total pages', () => {
    expect(mockPaginator.getTotalPages()).toBe(10);
  });

  it('should allow setting and getting current page data', () => {
    const testData = [1, 2, 3];
    mockPaginator.setCurrentPageData(testData);
    expect(mockPaginator.getPage(1)).toEqual(testData);
  });

  // Add more tests as needed to simulate and verify specific interactions or behaviors
});
