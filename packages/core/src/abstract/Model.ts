import IDatabaseAdapter from "@core/interfaces/IDatabaseAdapter";
import { QueryParameters } from "../types/query";
import Table from "@core/Table";
import Record from "@core/Record";

/**
 * **Model** - Abstract base class for database models providing a fluent ORM-like interface.
 * 
 * This abstract class serves as the foundation for all database models in the application,
 * providing a complete CRUD (Create, Read, Update, Delete) interface with a chainable query
 * builder pattern. It abstracts away the complexity of direct database operations while
 * maintaining type safety through TypeScript generics.
 * 
 * ### Key Features:
 * - **Type-Safe Operations**: Fully typed CRUD operations using TypeScript generics
 * - **Fluent Interface**: Chainable query methods for intuitive query building
 * - **Automatic Table Mapping**: Table name derived from class name
 * - **Zero Configuration**: Minimal setup required for basic operations
 * - **Consistent API**: Uniform interface across all models
 * 
 * ### Architecture:
 * The Model class acts as a bridge between your application code and the underlying
 * Table/Record infrastructure. It maintains internal state for query parameters and
 * provides a clean, high-level API that feels natural for application developers.
 * 
 * ### Type Parameter:
 * @template T - The shape of your model data. Must extend `{ id: string }` to ensure
 *               all models have a primary key. This generic type flows through all
 *               operations, providing compile-time type checking.
 * 
 * @example Basic Model Definition
 * ```typescript
 * import Model from './abstract/Model';
 * 
 * interface UserData {
 *   id: string;
 *   name: string;
 *   email: string;
 *   createdAt: string;
 * }
 * 
 * export default class User extends Model<UserData> {
 *   // Add custom methods here if needed
 *   public findByEmail(email: string): UserData | undefined {
 *     return this.where({ email }).get();
 *   }
 * }
 * ```
 * 
 * @example CRUD Operations
 * ```typescript
 * const db = new Database('./app.db');
 * const user = new User(db);
 * 
 * // CREATE - Insert new record
 * const newUser = user.create({
 *   id: '1',
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   createdAt: new Date().toISOString()
 * });
 * 
 * // READ - Fetch single record
 * const foundUser = user.where({ id: '1' }).get();
 * console.log(foundUser?.name); // "John Doe"
 * 
 * // READ - Fetch all records
 * const allUsers = user.all();
 * console.log(allUsers.length); // Number of users
 * 
 * // UPDATE - Modify existing record
 * user.where({ id: '1' }).update({
 *   id: '1',
 *   name: 'John Updated',
 *   email: 'john@example.com',
 *   createdAt: new Date().toISOString()
 * });
 * 
 * // DELETE - Remove record
 * user.where({ id: '1' }).delete();
 * ```
 * 
 * @example Advanced Query Patterns
 * ```typescript
 * // Find user by email
 * const user = userModel.where({ email: 'jane@example.com' }).get();
 * 
 * // Update user by email
 * userModel
 *   .where({ email: 'jane@example.com' })
 *   .update({ id: '2', name: 'Jane Smith', email: 'jane@example.com', createdAt: '...' });
 * 
 * // Delete user by name
 * userModel.where({ name: 'Bob Wilson' }).delete();
 * 
 * // Check if user exists
 * const exists = userModel.where({ id: '123' }).get() !== undefined;
 * ```
 * 
 * @example Custom Model Methods
 * ```typescript
 * export default class User extends Model<UserData> {
 *   // Find active users
 *   public findActive(): UserData[] {
 *     return this.all().filter(user => user.status === 'active');
 *   }
 *   
 *   // Soft delete by setting status
 *   public softDelete(id: string): void {
 *     const user = this.where({ id }).get();
 *     if (user) {
 *       this.where({ id }).update({ ...user, status: 'deleted' });
 *     }
 *   }
 *   
 *   // Count total users
 *   public count(): number {
 *     return this.all().length;
 *   }
 * }
 * ```
 * 
 * ### Best Practices:
 * 1. **Always extend Model**: Never instantiate Model directly - it's abstract
 * 2. **Define clear interfaces**: Create TypeScript interfaces for your data shapes
 * 3. **Use where() before mutations**: Always call where() before update() or delete()
 * 4. **Handle undefined**: get() can return undefined - check before using
 * 5. **Keep models focused**: Add domain logic, but avoid bloated models
 * 6. **Reset state**: Model maintains query state - create new instances for independent queries
 * 
 * ### Limitations:
 * - Query parameters persist between operations on the same instance
 * - Complex queries (joins, aggregations) may require custom methods
 * - Batch operations should be implemented in subclasses if needed
 * - No built-in validation - implement in subclasses or use separate validators
 * 
 * @abstract
 * @since 1.0.0
 * @see Table - Underlying table management class
 * @see Record - Individual record manipulation class
 */
export default abstract class Model<T extends object> {
    /**
     * Internal Table instance managing database operations.
     * 
     * This property holds a reference to the Table class that performs the actual
     * database operations. The table name is automatically derived from the class name
     * (e.g., a `User` model will interact with a `User` table).
     * 
     * @private
     * @readonly
     */
    private Table: Table;

    /**
     * Current query parameters for filtering operations.
     * 
     * This object stores the WHERE clause conditions set via the where() method.
     * It persists across method calls on the same instance, allowing for chainable
     * query building. Reset by calling where() with new parameters or creating
     * a new model instance.
     * 
     * @private
     * @example
     * ```typescript
     * // Internal state after: user.where({ id: '1' })
     * // QueryParams = { id: '1' }
     * ```
     */
    private QueryParams: QueryParameters = {};

    /**
     * Protected constructor - use static create() factory instead
     * 
     * @param table - Table instance for database operations
     */
    protected constructor(table: Table) {
        this.Table = table;
    }

    /**
     * Create a new Model instance (async factory method).
     * 
     * Creates a new model connected to the specified database. The table name is
     * automatically derived from the class name (via this.constructor.name), so a
     * class named `User` will interact with a table named `User`.
     * 
     * **Important**: Ensure the table exists in the database before creating a model
     * instance. The Model class does not create tables automatically.
     * 
     * @param adapter - Database adapter instance to use for all operations
     * @returns Promise resolving to the model instance
     * 
     * @example
     * ```typescript
     * import { createDatabase } from '@handler/better-sqlite3';
     * import User from './models/User';
     * 
     * const db = createDatabase('./app.db');
     * await db.exec(`CREATE TABLE IF NOT EXISTS User (
     *   id TEXT PRIMARY KEY,
     *   name TEXT NOT NULL,
     *   email TEXT UNIQUE
     * )`);
     * 
     * const userModel = await User.create(db);
     * ```
     */
    public static async create<M extends Model<any>>(
        this: new (table: Table) => M,
        adapter: IDatabaseAdapter
    ): Promise<M> {
        const table = await Table.create(this.name, adapter);
        return new this(table);
    }

    /**
     * Get the Record instance for the current query parameters.
     * 
     * This method provides access to the Record instance matching the current
     * QueryParams. It's used internally by get(), update(), and delete() methods.
     * Returns undefined if no matching record exists.
     * 
     * @private
     * @returns Promise resolving to the matching Record instance or undefined
     */
    private async RecordGet(): Promise<Record<T> | undefined> {
        return await this.Table.Record<T>({ where: this.QueryParams });
    }

    /**
     * Retrieve a single record matching the current query parameters.
     * 
     * Returns the data for the first record that matches the WHERE conditions set
     * by where(). If no where() was called, behavior is undefined (typically returns
     * the first record, but this is not guaranteed). Returns undefined if no matching
     * record exists.
     * 
     * **Best Practice**: Always call where() before get() to ensure predictable results.
     * 
     * @returns Promise resolving to the matching record's data, or undefined if not found
     * 
     * @example
     * ```typescript
     * // Find user by ID
     * const user = await userModel.where({ id: '123' }).get();
     * if (user) {
     *   console.log(user.name);
     * } else {
     *   console.log('User not found');
     * }
     * 
     * // Find user by email
     * const user = await userModel.where({ email: 'john@example.com' }).get();
     * 
     * // Check existence
     * const exists = await userModel.where({ id: '456' }).get() !== undefined;
     * ```
     */
    public async get(): Promise<T | undefined> {
        const record = await this.RecordGet();
        return record?.values;
    }

    /**
     * Retrieve all records from the table.
     * 
     * Returns an array containing the data for every record in the table. This method
     * ignores any where() conditions - it always returns the complete table contents.
     * The array will be empty if the table has no records.
     * 
     * **Performance Note**: For large tables, consider implementing pagination or
     * filtering in a custom method to avoid loading excessive data into memory.
     * 
     * @returns Promise resolving to array of all records in the table
     * 
     * @example
     * ```typescript
     * // Get all users
     * const allUsers = await userModel.all();
     * console.log(`Total users: ${allUsers.length}`);
     * 
     * // Iterate over all records
     * allUsers.forEach(user => {
     *   console.log(`${user.name} - ${user.email}`);
     * });
     * 
     * // Filter in memory
     * const activeUsers = (await userModel.all()).filter(u => u.status === 'active');
     * 
     * // Map to simpler structure
     * const userNames = (await userModel.all()).map(u => u.name);
     * ```
     */
    public async all(): Promise<T[]> {
        const records = await this.Table.Records<T>();
        return records.map(record => record.values);
    }

    /**
     * Set WHERE clause conditions for subsequent operations.
     * 
     * This method configures the query parameters that will be used by get(), update(),
     * and delete() operations. It follows a fluent interface pattern, returning the
     * model instance to allow method chaining.
     * 
     * The parameters are stored internally and persist until where() is called again
     * with different parameters or a new model instance is created.
     * 
     * **Important**: Calling where() replaces any previous query parameters - it does
     * not merge them. For AND conditions with multiple fields, pass all conditions in
     * a single where() call.
     * 
     * @param QueryParameters - Object mapping column names to their expected values.
     *                          All conditions are combined with AND logic.
     * @returns The model instance for method chaining
     * 
     * @example Basic Usage
     * ```typescript
     * // Single condition
     * const user = userModel.where({ id: '123' }).get();
     * 
     * // Multiple conditions (AND logic)
     * const user = userModel.where({ 
     *   email: 'john@example.com',
     *   status: 'active'
     * }).get();
     * ```
     * 
     * @example Chaining Pattern
     * ```typescript
     * // Chain where() with other operations
     * userModel
     *   .where({ id: '123' })
     *   .update({ id: '123', name: 'Updated Name', email: 'new@email.com' });
     * 
     * userModel
     *   .where({ status: 'inactive' })
     *   .delete();
     * ```
     * 
     * @example State Persistence
     * ```typescript
     * // Query parameters persist
     * const model = new User(db);
     * model.where({ id: '123' });
     * const user1 = model.get(); // Uses id: '123'
     * const user2 = model.get(); // Still uses id: '123'
     * 
     * // Reset with new where() call
     * model.where({ id: '456' });
     * const user3 = model.get(); // Now uses id: '456'
     * ```
     */
    public where(QueryParameters: QueryParameters): this {
        this.QueryParams = QueryParameters;
        return this;
    }

    /**
     * Insert a new record into the table.
     * 
     * Creates a new database record with the provided data. The data object must
     * include all required fields as defined by your table schema. Returns a Record
     * instance wrapping the newly created data, or undefined if the insert fails.
     * 
     * **Note**: This method does not use the where() query parameters - it always
     * inserts a new record. Duplicate IDs or constraint violations will throw errors.
     * 
     * @param data - Complete record data to insert. Must satisfy type T constraints.
     * @returns Promise resolving to Record instance wrapping the created data, or undefined on failure
     * @throws Database errors on constraint violations (duplicate IDs, etc.)
     * 
     * @example Basic Insert
     * ```typescript
     * const newUser = await userModel.create({
     *   id: '123',
     *   name: 'John Doe',
     *   email: 'john@example.com',
     *   createdAt: new Date().toISOString()
     * });
     * 
     * if (newUser) {
     *   console.log('User created:', newUser.values);
     * }
     * ```
     * 
     * @example Handling Duplicates
     * ```typescript
     * try {
     *   const user = await userModel.create({
     *     id: 'existing-id',
     *     name: 'Test',
     *     email: 'test@example.com'
     *   });
     * } catch (error) {
     *   console.error('Failed to create user:', error.message);
     *   // Handle duplicate ID or constraint violation
     * }
     * ```
     * 
     * @example Batch Insert
     * ```typescript
     * const usersData = [
     *   { id: '1', name: 'User 1', email: 'user1@example.com' },
     *   { id: '2', name: 'User 2', email: 'user2@example.com' },
     *   { id: '3', name: 'User 3', email: 'user3@example.com' }
     * ];
     * 
     * const createdUsers = await Promise.all(usersData.map(data => userModel.create(data)));
     * console.log(`Created ${createdUsers.filter(u => u).length} users`);
     * ```
     */
    public async create(data: T): Promise<Record<T> | undefined> {
        return await this.Table.Insert(data as unknown as QueryParameters);
    }

    /**
     * Update the record matching the current query parameters.
     * 
     * Modifies the database record that matches the WHERE conditions set by where().
     * The entire record is replaced with the new data - this is not a partial update.
     * If no record matches the query parameters, this method does nothing silently.
     * 
     * **Important**: Always call where() before update() to specify which record to modify.
     * Without where(), the behavior is undefined and may update an arbitrary record.
     * 
     * @param data - Complete replacement data for the record. Must satisfy type T.
     * @returns void - No return value. Check with get() if you need confirmation.
     * 
     * @example Basic Update
     * ```typescript
     * // Update user by ID
     * userModel.where({ id: '123' }).update({
     *   id: '123',
     *   name: 'Updated Name',
     *   email: 'updated@example.com',
     *   createdAt: '2024-01-01T00:00:00Z'
     * });
     * ```
     * 
     * @example Update with Verification
     * ```typescript
     * // Get current data
     * const user = userModel.where({ id: '123' }).get();
     * 
     * if (user) {
     *   // Modify specific field
     *   userModel.where({ id: '123' }).update({
     *     ...user,
     *     name: 'New Name'
     *   });
     *   
     *   // Verify update
     *   const updated = userModel.where({ id: '123' }).get();
     *   console.log('Updated successfully:', updated?.name === 'New Name');
     * }
     * ```
     * 
     * @example Conditional Update
     * ```typescript
     * // Update by email instead of ID
     * const user = userModel.where({ email: 'old@example.com' }).get();
     * 
     * if (user) {
     *   userModel.where({ email: 'old@example.com' }).update({
     *     ...user,
     *     email: 'new@example.com'
     *   });
     * }
     * ```
     */
    public async update(data: T): Promise<void> {
        const record = await this.RecordGet();
        if (record) {
            await record.Update(data);
        }
    }

    /**
     * Delete the record matching the current query parameters.
     * 
     * Permanently removes the database record that matches the WHERE conditions set
     * by where(). This operation cannot be undone. If no record matches the query
     * parameters, this method does nothing silently.
     * 
     * **Important**: Always call where() before delete() to specify which record to remove.
     * Without where(), the behavior is undefined and may delete an arbitrary record.
     * 
     * **Warning**: This is a permanent deletion. Consider implementing soft deletes
     * (status flags) in your models if you need to recover deleted records.
     * 
     * @returns Promise that resolves when deletion is complete
     * 
     * @example Basic Deletion
     * ```typescript
     * // Delete user by ID
     * await userModel.where({ id: '123' }).delete();
     * 
     * // Verify deletion
     * const deleted = await userModel.where({ id: '123' }).get();
     * console.log('Deleted:', deleted === undefined); // true
     * ```
     * 
     * @example Safe Deletion with Confirmation
     * ```typescript
     * // Check before deleting
     * const user = await userModel.where({ id: '123' }).get();
     * 
     * if (user) {
     *   console.log(`Deleting user: ${user.name}`);
     *   await userModel.where({ id: '123' }).delete();
     *   console.log('User deleted successfully');
     * } else {
     *   console.log('User not found');
     * }
     * ```
     * 
     * @example Batch Deletion
     * ```typescript
     * // Delete all inactive users
     * const inactiveUsers = (await userModel.all()).filter(u => u.status === 'inactive');
     * 
     * for (const user of inactiveUsers) {
     *   await userModel.where({ id: user.id }).delete();
     * }
     * 
     * console.log(`Deleted ${inactiveUsers.length} inactive users`);
     * ```
     * 
     * @example Soft Delete Alternative
     * ```typescript
     * // Instead of permanent deletion, mark as deleted
     * export default class User extends Model<UserData> {
     *   public async softDelete(id: string): Promise<void> {
     *     const user = await this.where({ id }).get();
     *     if (user) {
     *       await this.where({ id }).update({
     *         ...user,
     *         status: 'deleted',
     *         deletedAt: new Date().toISOString()
     *       });
     *     }
     *   }
     * }
     * ```
     */
    public async delete(): Promise<void> {
        const record = await this.RecordGet();
        if (record) {
            await record.Delete();
        }
    }
}