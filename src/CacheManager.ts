/*
 * Copyright (c) 2024, Phil Miesle
 *
 * Licensed under the MIT License. See LICENSE.txt in the project root for license information.
 *
 */

import NodeCache from 'node-cache';
import { ICacheManager } from './interfaces';

export class CacheManager implements ICacheManager {
    private cache: NodeCache;

    constructor(ttlSeconds: number = 0) {
        this.cache = new NodeCache({ stdTTL: ttlSeconds });
    }

    set(key: string, value: unknown, ttl?: number): void {
        if (ttl) {
            this.cache.set(key, value, ttl);
        } 
        else {
            this.cache.set(key, value);
        }
    }

    get<T>(key: string): T | null {
        const value = this.cache.get<T>(key);
        return value !== undefined ? value : null;
    }

    del(key: string): void {
        this.cache.del(key);
    }

    flush(): void {
        this.cache.flushAll();
    }
}
