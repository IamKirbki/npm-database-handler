# Kirbkis Database Handler

A TypeScript-first, type-safe database handler library with support for multiple database adapters.

## Overview

This monorepo contains a collection of database handler packages that provide a unified, type-safe interface for working with different database systems. Built with TypeScript and designed for modern applications.

## Packages

- **[@kirbkis/database-handler-core](packages/core)** - Core abstractions and interfaces
- **[@kirbkis/database-handler-better-sqlite3](packages/bettersqlite3)** - Better-sqlite3 adapter
- **[@kirbkis/database-handler-pg](packages/pg)** - PostgreSQL adapter

## Features

- 🔒 **Type-safe** - Full TypeScript support with type inference
- 🎯 **Unified API** - Consistent interface across different databases
- 📦 **Modular** - Use only the packages you need
- 🚀 **Modern** - Built with ES modules and latest JavaScript features
- 🧪 **Tested** - Comprehensive test coverage

## Installation

```bash
# Install core package
npm install @iamkirbki/database-handler-core

# Install database-specific adapter
npm install @kirbkis/database-handler-better-sqlite3
# or
npm install @kirbkis/database-handler-pg
```

## Quick Start

Initialize PostgreSQL adapter:
```typescript
import { PostgresAdapter } from '@iamkirbki/database-handler-pg';
import type { PoolConfig } from 'pg';

const poolConfig: PoolConfig = {
    host: YOUR_POSTGRES_HOST,
    port: YOUR_POSTGRES_PORT,
    database: YOUR_POSTGRES_DB,
    user: YOUR_POSTGRES_USER,
    password: YOUR_POSTGRES_PASSWORD,
    max: MAX_CONNECTIONS,
    idleTimeoutMillis: IDLE_TIMEOUT_MILLIS,
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MILLIS,
}

const adapter = new PostgresAdapter();
adapter.connect(poolConfig);
```

Alternatively, initialize Better-sqlite3 adapter:
```typescript
import { BetterSqlite3Adapter } from '@iamkirbki/database-handler-better-sqlite3';
const adapter = new BetterSqlite3Adapter();
adapter.connect('path/to/database.db');
```

The container can then be used to register and manage adapters:
```typescript
import { Container } from '@iamkirbki/database-handler-core';
const container: Container = Container.getInstance();
container.registerAdapter('postgres', adapter, true);
```