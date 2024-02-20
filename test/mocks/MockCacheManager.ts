/*
 * Copyright (c) 2024, Phil Miesle
 *
 * Licensed under the MIT License. See LICENSE.txt in the project root for license information.
 *
 */
import { ICacheManager } from '../../src/interfaces';

export class MockCacheManager implements ICacheManager {
    private storage: Record<string, any> = {};

    constructor() {
        this.set = jest.fn(this.set.bind(this));

        const originalGet = this.get.bind(this);
        this.get = jest.fn((key: string) => originalGet(key));

        this.del = jest.fn(this.del.bind(this));
        this.flush = jest.fn(this.flush.bind(this));
    }

    set(key: string, value: any, ttl?: number): void {
        this.storage[key] = { value, ttl };
    }

    get<T>(key: string): T | null {
        const item = this.storage[key];
        return item ? item.value : null;
    }

    del(key: string): void {
        delete this.storage[key];
    }

    flush(): void {
        this.storage = {};
    }
}
