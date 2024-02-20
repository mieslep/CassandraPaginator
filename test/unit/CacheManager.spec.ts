/*
 * Copyright (c) 2024, DataStax (Phil Miesle)
 *
 * Licensed under the MIT License. See LICENSE.txt in the project root for license information.
 *
 */

import { CacheManager } from '../../src/CacheManager';

describe('SimpleCacheManager', () => {
    let cacheManager: CacheManager;
  
    beforeEach(() => {
      cacheManager = new CacheManager();
    });
  
    it('should set and get a value', () => {
      cacheManager.set('key', 'value');
      expect(cacheManager.get<string>('key')).toBe('value');
    });
  
    it('should return null for non-existent keys', () => {
      expect(cacheManager.get('nonexistent')).toBeNull();
    });
  
    it('should delete a value', () => {
      cacheManager.set('key', 'value');
      cacheManager.del('key');
      expect(cacheManager.get('key')).toBeNull();
    });
  
    it('should flush all values', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');
      cacheManager.flush();
      expect(cacheManager.get('key1')).toBeNull();
      expect(cacheManager.get('key2')).toBeNull();
    });
  
    // Example of testing TTL functionality - adjust based on actual TTL capabilities
    it('should expire an item after TTL seconds', done => {
      cacheManager.set('expiringKey', 'value', 1); // 1 second TTL
      setTimeout(() => {
        expect(cacheManager.get('expiringKey')).toBeNull();
        done(); // Call done to signal Jest that async test is complete
      }, 1100); // Wait a bit more than 1 second to ensure TTL has passed
    });
  
    // Testing retrieval with correct type
    it('should retrieve values with correct type', () => {
      cacheManager.set('numberKey', 100);
      const value = cacheManager.get<number>('numberKey');
      expect(value).toBe(100);
      expect(typeof value).toBe('number');
    });
  });
  