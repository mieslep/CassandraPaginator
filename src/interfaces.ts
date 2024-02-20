/*
 * Copyright (c) 2024, Phil Miesle
 *
 * Licensed under the MIT License. See LICENSE.txt in the project root for license information.
 *
 */
export interface CacheManagerOptions {
    ttlSeconds?: number;
}

export interface ICacheManager {
    set(key: string, value: any, ttl?: number): void;
    get<T>(key: string): T | null;
    del(key: string): void;
    flush(): void;
}

export interface PaginatorOptions {
    pageSize?: number;

}

export interface IPaginator<T> {
    getPage(pageNumber: number): T[] | null;
    addItems(newItems: T[]): void;
    getTotalPages(): number;
}
  