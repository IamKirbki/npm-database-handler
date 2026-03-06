# Kirbkis Database Handler

A TypeScript-first, type-safe database handler library with support for multiple database adapters.

## Features

- 🔒 **Type-Safe** - Full TypeScript support with type inference
- 🎯 **Multi-Database** - PostgreSQL and SQLite adapters included
- 🧩 **Modular** - Use only the packages you need
- 🔄 **Unified API** - Consistent interface across databases
- 📝 **Query Builder** - Type-safe SQL query construction
- 🗄️ **Schema Builder** - Fluent table schema definitions
- 🔗 **Relationships** - JOIN support with automatic result splitting
- ⏱️ **Timestamps** - Automatic created_at/updated_at handling
- 🗑️ **Soft Deletes** - Built-in soft delete support
- 🎭 **Multiple Adapters** - Connect to multiple databases simultaneously

## Packages

| Package                                                                                                                    | Description                      | Version                                                                         |
| -------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------- |
| [@kirbkis/database-handler-core](https://github.com/iamkirbki/database-handler/tree/main/packages/core)                    | Core abstractions and interfaces | ![npm](https://img.shields.io/npm/v/@iamkirbki/database-handler-core)           |
| [@kirbkis/database-handler-better-sqlite3](https://github.com/iamkirbki/database-handler/tree/main/packages/bettersqlite3) | Better-sqlite3 adapter           | ![npm](https://img.shields.io/npm/v/@iamkirbki/database-handler-better-sqlite3) |
| [@kirbkis/database-handler-pg](https://github.com/iamkirbki/database-handler/tree/main/packages/pg)                        | PostgreSQL adapter               | ![npm](https://img.shields.io/npm/v/@iamkirbki/database-handler-pg)             |

## Installation

```bash
# Install core package
npm install @iamkirbki/database-handler-core

# Install database adapter (choose one or both)
npm install @iamkirbki/database-handler-bettersqlite3
npm install @iamkirbki/database-handler-pg
```

## Quick Start

> **Important:** This package requires a database adapter to function. You must install and configure at least one adapter (PostgreSQL or SQLite) before using the core functionality.

### 1. Connect to Database

**PostgreSQL:**

```typescript
import { PostgresAdapter } from '@iamkirbki/database-handler-pg';
import { Container } from '@iamkirbki/database-handler-core';

const db = new PostgresAdapter();
await db.connect({
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  user: 'postgres',
  password: 'secret',
});

// Register as default adapter (required if not specifying adapter names elsewhere)
Container.getInstance().registerAdapter('default', db, true);
```

**SQLite:**

```typescript
import { BetterSqlite3Adapter } from '@iamkirbki/database-handler-bettersqlite3';
import { Container } from '@iamkirbki/database-handler-core';

const db = new BetterSqlite3Adapter('./database.db');
// Register as default adapter (required if not specifying adapter names elsewhere)
Container.getInstance().registerAdapter('default', db, true);
```

> **Note:** When you don't specify an adapter name in your queries or models, the library will use the default adapter. To set a default adapter, pass `true` as the third parameter: `Container.getInstance().registerAdapter('default', adapter, true)`.

### 2. Create Tables

```typescript
import { PostgresSchemaBuilder } from '@iamkirbki/database-handler-pg';
// or
import { BetterSqlite3SchemaBuilder } from '@iamkirbki/database-handler-bettersqlite3';

const schema = new PostgresSchemaBuilder(db); // or new BetterSqlite3SchemaBuilder(db)
await schema.createTable('users', (table) => {
  table.integer('id').primaryKey().increments();
  table.string('name', 100);
  table.string('email', 100).unique();
  table.boolean('is_active').defaultTo(true);
  table.timestamps();
  table.softDeletes();
});
```

### 3. Query Data

```typescript
import { Table } from '@iamkirbki/database-handler-core';

const usersTable = new Table({ name: 'users' });

// Fetch multiple records
const activeUsers = await usersTable.FetchRecords<User>({
  base: {
    where: { is_active: true },
  },
  final: {
    orderBy: { column: 'created_at', direction: 'DESC' },
    limit: 10,
  },
});

// Fetch single record
const user = await usersTable.FetchSingleRecord<User>({
  base: {
    where: { email: 'alice@example.com' },
  },
});

// Insert data
await usersTable.CreateRecord({
  name: 'Bob',
  email: 'bob@example.com',
});

// Count records
const totalUsers = await usersTable.RecordsCount();
```

## Documentation

For comprehensive documentation, guides, and API references, please visit our **[Wiki](wiki/Home.md)**.

## License

ISC License - see [LICENSE](LICENSE) file for details.

## Author

**iamkirbki**

## Links

- [GitHub Repository](https://github.com/iamkirbki/database-handler)
- [npm Package](https://www.npmjs.com/package/@iamkirbki/database-handler-core)
- [Issues](https://github.com/iamkirbki/database-handler/issues)
