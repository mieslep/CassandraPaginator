/*
 * Copyright (c) 2024, Phil Miesle
 *
 * Licensed under the MIT License. See LICENSE.txt in the project root for license information.
 *
 */
import { MockCacheManager } from '../mocks/MockCacheManager';

describe('MockCacheManager', () => {
    let cacheManager: MockCacheManager;

    beforeEach(() => {
        // Instantiate a new MockCacheManager for each test to ensure isolation
        cacheManager = new MockCacheManager();
    });

    it('should store and retrieve an item', () => {
        cacheManager.set('key', 'value');
        expect(cacheManager.get('key')).toBe('value');
    });

    it('should return null for an unset key', () => {
        expect(cacheManager.get('nonexistentKey')).toBeNull();
    });

    it('should delete an item', () => {
        cacheManager.set('key', 'value');
        cacheManager.del('key');
        expect(cacheManager.get('key')).toBeNull();
    });

    it('should flush all items', () => {
        cacheManager.set('key1', 'value1');
        cacheManager.set('key2', 'value2');
        cacheManager.flush();
        expect(cacheManager.get('key1')).toBeNull();
        expect(cacheManager.get('key2')).toBeNull();
    });
});
