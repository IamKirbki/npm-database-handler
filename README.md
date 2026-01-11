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

| Package | Description | Version |
|---------|-------------|---------|
| [@kirbkis/database-handler-core](https://github.com/iamkirbki/database-handler/tree/main/packages/core) | Core abstractions and interfaces | ![npm](https://img.shields.io/npm/v/@iamkirbki/database-handler-core) |
| [@kirbkis/database-handler-better-sqlite3](https://github.com/iamkirbki/database-handler/tree/main/packages/bettersqlite3) | Better-sqlite3 adapter | ![npm](https://img.shields.io/npm/v/@iamkirbki/database-handler-better-sqlite3) |
| [@kirbkis/database-handler-pg](https://github.com/iamkirbki/database-handler/tree/main/packages/pg) | PostgreSQL adapter | ![npm](https://img.shields.io/npm/v/@iamkirbki/database-handler-pg) |

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
    password: 'secret'
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
await db.createTable('users', (table) => {
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

const usersTable = new Table('users');

// Fetch multiple records
const activeUsers = await usersTable.Records<User>({
    where: { is_active: true },
    orderBy: 'created_at DESC',
    limit: 10
});

// Fetch single record
const user = await usersTable.Record<User>({
    where: { email: 'alice@example.com' }
});

// Insert data
await usersTable.Insert({
    name: 'Bob',
    email: 'bob@example.com'
});

// Count records
const totalUsers = await usersTable.RecordsCount();
```

### 4. Work with Records

```typescript
import { Record } from '@iamkirbki/database-handler-core';

// Create and insert
const newUser = new Record<User>('users', {
    name: 'Alice',
    email: 'alice@example.com'
});
await newUser.Insert();

// Update
const user = await usersTable.Record<User>({ where: { id: 1 } });
if (user) {
    user.values.name = 'Alice Smith';
    await user.Update({ name: user.values.name }, { id: user.values.id });
}

// Delete
await user?.Delete({ id: user.values.id });
```

### 5. Raw SQL Queries

```typescript
import { Query } from '@iamkirbki/database-handler-core';

const query = new Query({
    tableName: 'users',
    query: 'SELECT * FROM users WHERE age > @age',
    parameters: { age: 18 }
});

const users = await query.All<User>();
```

### 6. JOIN Operations

```typescript
const results = await usersTable.Join<User>({
    fromTable: 'posts',
    joinType: 'INNER',
    on: 'users.id = posts.user_id',
    where: { 'posts.status': 'published' }
});

// Access joined data - joined table columns are nested by table name
results.forEach(record => {
    console.log(`${record.values.name} - Post data:`, record.values.posts);
});
```

## Documentation

Comprehensive documentation is available for each component:

### Core Classes

- **[Query](wiki/api/Query.md)** - Execute raw SQL queries with parameter binding
- **[Table](wiki/api/Table.md)** - High-level table interface for CRUD operations
- **[Record](wiki/api/Record.md)** - Represents a single database row with methods
- **[QueryStatementBuilder](wiki/api/QueryStatementBuilder.md)** - Build SQL queries programmatically
- **[SchemaTableBuilder](wiki/api/SchemaTableBuilder.md)** - Fluent API for table schema definition

### Key Concepts

#### Parameter Binding

Always use `@paramName` syntax for parameters (both PostgreSQL and SQLite):

```typescript
// ✅ Correct
query: 'SELECT * FROM users WHERE age > @age'
parameters: { age: 25 }

// ❌ Wrong - will not work
query: 'SELECT * FROM users WHERE age > :age'  // Incorrect
query: 'SELECT * FROM users WHERE age > ?'     // Incorrect
```

#### Type Safety

All methods support TypeScript generics for type-safe results:

```typescript
type User = {
    id: number;
    name: string;
    email: string;
    created_at: Date;
};

const users = await usersTable.Records<User>();
// users is typed as Record<User>[]
```

#### Multiple Adapters

Connect to multiple databases and specify which to use:

```typescript
// Register multiple adapters
Container.getInstance().registerAdapter('main', mainDb, true); // Default
Container.getInstance().registerAdapter('analytics', analyticsDb);

// Use default adapter
const users = await new Table('users').Records<User>();

// Use named adapter
const events = await new Table('events', 'analytics').Records<Event>();
```

## Examples

### Complete CRUD Application

```typescript
import { Container, Table, Record } from '@iamkirbki/database-handler-core';
import { PostgresAdapter } from '@iamkirbki/database-handler-pg';

// Setup
const db = new PostgresAdapter();
await db.connect(config);
Container.getInstance().registerAdapter('default', db, true);

// Create table
await db.createTable('posts', (table) => {
    table.integer('id').primaryKey().increments();
    table.string('title', 200);
    table.text('content');
    table.enum('status', ['draft', 'published']).defaultTo('draft');
    table.integer('user_id').foreignKey('users', 'id');
    table.timestamps();
});

const postsTable = new Table('posts');

// Create
const newPost = new Record<Post>('posts', {
    title: 'Hello World',
    content: 'My first post',
    user_id: 1
});
await newPost.Insert();

// Read
const posts = await postsTable.Records<Post>({
    where: { status: 'published' },
    orderBy: 'created_at DESC'
});

// Update
const post = await postsTable.Record<Post>({ where: { id: 1 } });
if (post) {
    post.values.title = 'Updated Title';
    await post.Update(
        { title: post.values.title },
        { id: post.values.id }
    );
}

// Delete
if (post) {
    await post.Delete({ id: post.values.id });
}
```

### Pagination

```typescript
const pageSize = 20;
const pageNumber = 2;

const posts = await postsTable.Records<Post>({
    limit: pageSize,
    offset: (pageNumber - 1) * pageSize,
    orderBy: 'created_at DESC'
});

const totalPosts = await postsTable.RecordsCount();
const totalPages = Math.ceil(totalPosts / pageSize);
```

### Search & Filter

```typescript
const results = await usersTable.Records<User>({
    where: [
        { column: 'name', operator: 'LIKE', value: '%John%' },
        { column: 'age', operator: '>', value: 18 },
        { column: 'status', operator: '=', value: 'active' }
    ],
    orderBy: 'name ASC'
});
```

## API Reference

### Table Methods

| Method | Description |
|--------|-------------|
| `Records()` | Fetch multiple records with filtering/pagination |
| `Record()` | Fetch a single record |
| `RecordsCount()` | Count records matching criteria |
| `Insert()` | Insert single or multiple records |
| `Join()` | Perform JOIN operations |
| `Drop()` | Drop the table |

### Record Methods

| Method | Description |
|--------|-------------|
| `Insert()` | Insert record into database |
| `Update()` | Update record in database |
| `Delete()` | Delete record (hard or soft) |
| `toJSON()` | Convert to plain object |
| `toString()` | Convert to JSON string |

### Query Methods

| Method | Description |
|--------|-------------|
| `Run()` | Execute INSERT/UPDATE/DELETE |
| `All()` | Execute SELECT, return all rows |
| `Get()` | Execute SELECT, return first row |
| `Count()` | Execute COUNT query |

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

ISC License - see [LICENSE](LICENSE) file for details.

## Author

**iamkirbki**

## Links

- [GitHub Repository](https://github.com/iamkirbki/database-handler)
- [npm Package](https://www.npmjs.com/package/@iamkirbki/database-handler-core)
- [Documentation](https://github.com/iamkirbki/database-handler/tree/main/packages/core/src)
- [Issues](https://github.com/iamkirbki/database-handler/issues)
