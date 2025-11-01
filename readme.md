# Codex JS

![Codex JS](https://raw.githubusercontent.com/C1ANCYSz/CodexJS/main/assets/codex-wide.png)

A TypeScript-first web framework built on Express.js that brings decorator-based routing and dependency injection to Node.js applications.

## Overview

Codex combines the type safety and modern patterns of TypeScript with the flexibility and ecosystem of Express.js. It emphasizes clean architecture through decorators, dependency injection, and modular design—eliminating boilerplate while maintaining full Express compatibility.

### Key Features

- **Decorator-based routing** — Define routes using intuitive TypeScript decorators
- **Dependency injection** — Built-in DI container powered by TypeDI
- **Modular architecture** — Organize applications into reusable, testable modules
- **Type-safe** — Full TypeScript support with advanced type utilities
- **Express compatible** — Access the entire Express middleware ecosystem
- **Auto promise handling** — Automatic async/await resolution and error propagation
- **Fluent API** — Chainable methods for clean, readable configuration

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
  - [Controllers](#controllers)
  - [Services](#services)
  - [Repositories](#repositories)
  - [Modules](#modules)
- [Decorators Reference](#decorators-reference)
  - [Class Decorators](#class-decorators)
  - [HTTP Method Decorators](#http-method-decorators)
  - [Property Decorators](#property-decorators)
- [API Reference](#api-reference)
- [Advanced Usage](#advanced-usage)
- [Type Utilities](#type-utilities)
- [Examples](#examples)
- [Best Practices](#best-practices)

---

## Installation

### Quick Setup (Recommended)

Create a new Codex application with the scaffolding tool:

```bash
npx create-codex-app my-app
cd my-app
npm install
```

### Manual Installation

Install Codex and required dependencies:

```bash
npm install @codex-js/core
npm install -D @types/express @types/node typescript
```

Configure TypeScript by ensuring your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strict": true,
    "esModuleInterop": true
  }
}
```

> **Note:** The `experimentalDecorators` and `emitDecoratorMetadata` flags are required for decorator support.

---

## Quick Start

### Recommended Project Structure

The scaffolding tool creates this structure automatically:

```
my-app/
├── src/
│   ├── core/              # Core utilities
│   │   ├── constants/
│   │   ├── errors/
│   │   ├── middlewares/
│   │   ├── types/
│   │   └── utils/
│   ├── integrations/      # External service integrations
│   │   ├── db/
│   │   ├── redis/
│   │   ├── sockets/
│   │   └── .../
│   ├── modules/           # Feature modules
│   │    ├── users/
│   │    ├── products/
│   │    └── .../
│   │
│   ├── app.ts             # Application entry point
│   │
│   └── server.ts          # Server configuration
│
└── package.json


```

### Hello World Example

```typescript
import codex, { Controller, Get, Module } from '@codex-js/core'

@Controller('/api/users')
class UserController {
  @Get('/')
  getAllUsers() {
    return { message: 'List of users' }
  }

  @Get('/:id')
  getUserById(req: Request) {
    return { id: req.params.id, name: 'John Doe' }
  }
}

@Module({
  controllers: [UserController],
})
class AppModule {}

const app = codex()

app.enableJson().registerModules([AppModule]).handleNotFound()

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
```

---

## Core Concepts

### Controllers

Controllers handle HTTP requests and return responses. They are classes decorated with `@Controller()` that contain route handler methods.

**Key characteristics:**

- Decorated with `@Controller(basePath, middlewares?)`
- Contain route handlers decorated with HTTP method decorators
- Can inject services via constructor or `@Inject()` decorator
- Automatically serialize returned objects to JSON

**Example:**

```typescript
@Controller('/api/products')
class ProductController {
  @Get('/')
  listProducts() {
    return { products: [] }
  }

  @Post('/')
  createProduct(req: Request) {
    return { created: req.body }
  }

  @Get('/:id')
  getProduct(req: Request) {
    return { id: req.params.id }
  }
}
```

### Services

Services encapsulate business logic and can be injected into controllers or other services. They promote separation of concerns and testability.

**Key characteristics:**

- Decorated with `@Service()`
- Registered automatically when included in a module's `providers` array
- Singleton instances managed by the DI container
- Can inject other services

**Example:**

```typescript
@Service()
class ProductService {
  findAll() {
    return [
      { id: 1, name: 'Product 1' },
      { id: 2, name: 'Product 2' },
    ]
  }

  findById(id: string) {
    return { id, name: `Product ${id}` }
  }
}

@Controller('/api/products')
class ProductController {
  constructor(private productService: ProductService) {}

  @Get('/')
  listProducts() {
    return this.productService.findAll()
  }

  @Get('/:id')
  getProduct(req: Request) {
    return this.productService.findById(req.params.id)
  }
}
```

### Repositories

Repositories handle data access logic, abstracting database operations from business logic. Use the `@Repo()` decorator for database-related classes.

**Key characteristics:**

- Decorated with `@Repo()`
- Focus on data persistence and retrieval
- Can be injected into services
- Promotes clean architecture and testability

**Example:**

```typescript
@Repo()
class UserRepository {
  private users = new Map<string, User>()

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values())
  }

  async findById(id: string): Promise<User | undefined> {
    return this.users.get(id)
  }

  async create(user: User): Promise<User> {
    this.users.set(user.id, user)
    return user
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const user = this.users.get(id)
    if (!user) return null
    Object.assign(user, data)
    return user
  }

  async delete(id: string): Promise<boolean> {
    return this.users.delete(id)
  }
}
```

### Modules

Modules organize related controllers, services, and repositories into cohesive, reusable units. They define the boundaries of your application features.

**Key characteristics:**

- Decorated with `@Module(options)`
- Group related functionality together
- Can be registered with route prefixes and middleware
- Support hierarchical organization

**Example:**

```typescript
@Module({
  controllers: [UserController, AuthController],
  providers: [UserService, AuthService, UserRepository],
})
class UserModule {}

// Register module
app.registerModules([UserModule])

// Register with prefix and middleware
app.registerModules([
  {
    route: '/api',
    middlewares: [authenticate, logger],
    modules: [UserModule, ProductModule],
  },
])
```

---

## Decorators Reference

### Class Decorators

#### `@Controller(basePath?: string, middlewares?: RequestHandler[])`

Marks a class as a controller and defines its base route path.

**Parameters:**

- `basePath` (optional): Base path for all routes in this controller
- `middlewares` (optional): Array of Express middleware functions to apply to all routes

**Examples:**

```typescript
// Simple controller
@Controller('/api/users')
class UserController {}

// Controller with middleware
@Controller('/api/admin', [authenticate, adminOnly])
class AdminController {}

// Root controller
@Controller()
class HealthController {
  @Get('/health')
  checkHealth() {
    return { status: 'ok' }
  }
}
```

#### `@Service()`

Marks a class as a service that can be injected via dependency injection.

**Example:**

```typescript
@Service()
class EmailService {
  async sendEmail(to: string, subject: string, body: string) {
    // Email sending logic
    console.log(`Sending email to ${to}`)
  }
}
```

#### `@Repo()`

Marks a class as a repository for data access operations.

**Example:**

```typescript
@Repo()
class ProductRepository {
  async findAll() {
    // Database query
  }

  async findById(id: string) {
    // Database query
  }
}
```

#### `@Module(options)`

Defines a module with its controllers and providers.

**Options:**

- `controllers`: Array of controller classes
- `providers`: Array of service and repository classes

**Example:**

```typescript
@Module({
  controllers: [UserController, ProfileController],
  providers: [UserService, UserRepository, EmailService],
})
class UserModule {}
```

### HTTP Method Decorators

All HTTP method decorators follow the same pattern:

```typescript
@Method(path: string, middlewares?: RequestHandler[])
```

**Parameters:**

- `path`: Route path (can include Express route parameters like `:id`)
- `middlewares` (optional): Array of middleware functions for this specific route

#### `@Get(path, middlewares?)`

Defines a GET route handler.

```typescript
@Get('/profile')
getProfile() {
  return { name: 'John Doe' }
}

@Get('/users/:id', [cacheMiddleware])
getUser(req: Request) {
  return { id: req.params.id }
}
```

#### `@Post(path, middlewares?)`

Defines a POST route handler.

```typescript
@Post('/login')
login(req: Request) {
  const { email, password } = req.body
  return { token: 'jwt-token' }
}

@Post('/users', [validateUser, authenticate])
createUser(req: Request) {
  return { created: true, user: req.body }
}
```

#### `@Put(path, middlewares?)`

Defines a PUT route handler for full resource updates.

```typescript
@Put('/:id')
updateUser(req: Request) {
  return { id: req.params.id, ...req.body }
}
```

#### `@Patch(path, middlewares?)`

Defines a PATCH route handler for partial resource updates.

```typescript
@Patch('/:id')
patchUser(req: Request) {
  return { id: req.params.id, updated: req.body }
}
```

#### `@Delete(path, middlewares?)`

Defines a DELETE route handler.

```typescript
@Delete('/:id')
deleteUser(req: Request) {
  return { deleted: true, id: req.params.id }
}
```

### Property Decorators

#### `@Inject(token?)`

Injects a dependency into a class property.

**Parameters:**

- `token` (optional): Service class or token to inject

**Examples:**

```typescript
class UserController {
  // Automatic injection based on type
  @Inject()
  private userService!: UserService

  // Explicit token injection
  @Inject(LoggerService)
  private logger!: LoggerService
}
```

---

## API Reference

### Codex Class Methods

#### `instance(): ExpressApplication`

Returns the underlying Express application instance for advanced configuration.

```typescript
const app = codex()
const expressApp = app.instance()

// Use Express features directly
expressApp.set('view engine', 'ejs')
```

#### `baseRoute(path: string): Codex`

Sets a global base route prefix for all registered routes.

```typescript
app.baseRoute('/api/v1')
// All routes will be prefixed with /api/v1
```

#### `use(...args: any[]): Codex`

Adds Express middleware to the application.

```typescript
import cors from 'cors'
import helmet from 'helmet'

app.use(cors()).use(helmet()).use(customMiddleware)
```

#### `useBefore(middlewares: RequestHandler[]): Codex`

Adds middleware that will be executed before route registration. Useful for global middleware that should run before all routes.

```typescript
app.useBefore([requestLogger, rateLimiter])
```

#### `enableJson(): Codex`

Enables JSON body parsing middleware (`express.json()`).

```typescript
app.enableJson()
// Now req.body will parse JSON payloads
```

#### `enableUrlEncoded(options?): Codex`

Enables URL-encoded body parsing middleware.

**Options:**

- `extended`: Boolean for using querystring (false) or qs (true) library

```typescript
app.enableUrlEncoded({ extended: true })
// Now req.body will parse URL-encoded payloads
```

#### `serveStatic(dirPath: string, route?: string, options?: ServeStaticOptions): Codex`

Serves static files from a directory.

**Parameters:**

- `dirPath`: Path to the directory containing static files
- `route` (optional): URL path to mount the static files (default: '/')
- `options` (optional): Express static middleware options

```typescript
// Serve files from 'public' directory at root
app.serveStatic('public')

// Serve files at custom route
app.serveStatic('public', '/static')

// With options
app.serveStatic('uploads', '/files', {
  maxAge: '1d',
  dotfiles: 'deny',
})
```

#### `registerModules(registrations: ModuleRegistration[]): Codex`

Registers application modules. Supports simple registration or registration with route prefixes and middleware.

**Simple registration:**

```typescript
app.registerModules([UserModule, ProductModule])
```

**Registration with configuration:**

```typescript
app.registerModules([
  {
    route: '/api',
    middlewares: [authenticate, logger],
    modules: [UserModule, ProductModule],
  },
  {
    route: '/admin',
    middlewares: [authenticate, adminOnly],
    modules: [AdminModule],
  },
])
```

#### `handleNotFound(handler?: RequestHandler): Codex`

Adds a 404 Not Found handler for unmatched routes. If no handler is provided, uses a default JSON response.

```typescript
// Default handler
app.handleNotFound()

// Custom handler
app.handleNotFound((req, res) => {
  res.status(404).render('404', { url: req.originalUrl })
})
```

#### HTTP Method Shortcuts

Register routes directly on the Codex instance without controllers.

```typescript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

app.post('/webhook', webhookMiddleware, (req, res) => {
  res.json({ received: true })
})

// Available methods: get, post, put, patch, delete
```

---

## Advanced Usage

### Middleware Configuration

Codex supports middleware at multiple levels:

**Global middleware:**

```typescript
app.use(cors())
app.use(helmet())
```

**Module-level middleware:**

```typescript
app.registerModules([
  {
    route: '/api',
    middlewares: [authenticate, rateLimit],
    modules: [UserModule],
  },
])
```

**Controller-level middleware:**

```typescript
@Controller('/api/admin', [authenticate, adminOnly])
class AdminController {
  @Get('/dashboard')
  getDashboard() {
    return { message: 'Admin dashboard' }
  }
}
```

**Route-level middleware:**

```typescript
@Controller('/api/posts')
class PostController {
  @Get('/', [cacheMiddleware])
  getPosts() {
    return { posts: [] }
  }

  @Post('/', [validatePost, authenticate])
  createPost(req: Request) {
    return { created: true }
  }
}
```

### Dependency Injection Patterns

**Constructor injection (recommended):**

```typescript
@Service()
class UserService {
  constructor(private userRepo: UserRepository, private logger: LoggerService) {}

  async getUser(id: string) {
    this.logger.log(`Fetching user ${id}`)
    return this.userRepo.findById(id)
  }
}
```

**Property injection:**

```typescript
@Service()
class UserService {
  @Inject()
  private userRepo!: UserRepository

  @Inject(LoggerService)
  private logger!: LoggerService

  async getUser(id: string) {
    this.logger.log(`Fetching user ${id}`)
    return this.userRepo.findById(id)
  }
}
```

### Async Route Handlers

Codex automatically handles promises and async functions. Simply return data or throw errors—no need to manually call `res.json()` or `next()`.

**Automatic JSON response:**

```typescript
@Controller('/api/users')
class UserController {
  constructor(private userService: UserService) {}

  @Get('/:id')
  async getUser(req: Request) {
    // Codex automatically sends JSON response
    const user = await this.userService.findById(req.params.id)
    return user
  }

  @Post('/')
  async createUser(req: Request) {
    // Errors are automatically caught and passed to error middleware
    const user = await this.userService.create(req.body)
    return { success: true, user }
  }
}
```

**Manual response control:**

When you need full control over the response (file downloads, redirects, etc.), don't return anything:

```typescript
@Get('/download/:id')
async downloadFile(req: Request, res: Response) {
  const filePath = await this.fileService.getPath(req.params.id)
  res.download(filePath)
  // Don't return anything
}

@Get('/redirect')
redirectToHome(req: Request, res: Response) {
  res.redirect('/home')
  // Don't return anything
}
```

### Error Handling

Add global error handling middleware:

```typescript
import { ErrorRequestHandler } from 'express'

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err.stack)

  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

app.registerModules([AppModule])
app.use(errorHandler) // Add after modules
```

**Custom error classes:**

```typescript
class NotFoundError extends Error {
  status = 404
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

@Service()
class UserService {
  async findById(id: string) {
    const user = await this.userRepo.findById(id)
    if (!user) {
      throw new NotFoundError(`User ${id} not found`)
    }
    return user
  }
}
```

---

## Type Utilities

### `ExtendedRequest<K, T>`

Extends the Express Request type with custom optional properties. Useful for adding data attached by middleware.

**Type signature:**

```typescript
type ExtendedRequest<K extends string, T> = Request & {
  [P in K]?: T
}
```

**Example:**

```typescript
import { Request, ExtendedRequest } from '@codex-js/core'

// Define custom request type
type AuthRequest = ExtendedRequest<'user', {
  id: string
  email: string
  role: string
}>

// Use in route handler
@Get('/profile')
getProfile(req: AuthRequest) {
  // req.user is optional (can be undefined)
  const user = req.user
  if (!user) {
    return { error: 'Not authenticated' }
  }
  return { profile: user }
}
```

### `ProtectedRequest<ER>`

Makes custom properties on an ExtendedRequest required and non-nullable. Use this when you know middleware has added the property.

**Type signature:**

```typescript
type ProtectedRequest<ER extends ExtendedRequest<string, any>> = Request & {
  [K in Exclude<keyof ER, keyof Request>]-?: NonNullable<ER[K]>
}
```

**Example:**

```typescript
// Define extended request
type AuthRequest = ExtendedRequest<'user', { id: string; email: string }>

// Make user property required
type RequiredAuthRequest = ProtectedRequest<AuthRequest>

// Use after authentication middleware
@Get('/dashboard', [authenticate])
getDashboard(req: RequiredAuthRequest) {
  // req.user is guaranteed to exist (non-nullable)
  const userId = req.user.id
  return { userId }
}
```

**Practical workflow:**

```typescript
// Middleware that adds user to request
const authenticate: RequestHandler = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const user = await verifyToken(token)
  (req as any).user = user
  next()
}

// Types
type AuthRequest = ExtendedRequest<'user', User>
type ProtectedAuthRequest = ProtectedRequest<AuthRequest>

@Controller('/api')
class ProfileController {
  // Without middleware - user is optional
  @Get('/maybe-auth')
  maybeAuth(req: AuthRequest) {
    if (req.user) {
      return { authenticated: true, user: req.user }
    }
    return { authenticated: false }
  }

  // With middleware - user is required
  @Get('/protected', [authenticate])
  protected(req: ProtectedAuthRequest) {
    // req.user is guaranteed to exist
    return { message: `Hello ${req.user.email}` }
  }
}
```

---

## Examples

### Complete REST API

A full CRUD application with repository, service, and controller layers:

```typescript
import codex, {
  Controller,
  Service,
  Repo,
  Module,
  Get,
  Post,
  Put,
  Delete,
  Request,
  Response,
} from '@codex-js/core'

// Models
interface User {
  id: string
  name: string
  email: string
  createdAt: Date
}

// Repository Layer
@Repo()
class UserRepository {
  private users = new Map<string, User>()

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values())
  }

  async findById(id: string): Promise<User | undefined> {
    return this.users.get(id)
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.email === email)
  }

  async create(user: User): Promise<User> {
    this.users.set(user.id, user)
    return user
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const user = this.users.get(id)
    if (!user) return null
    Object.assign(user, data)
    return user
  }

  async delete(id: string): Promise<boolean> {
    return this.users.delete(id)
  }
}

// Service Layer
@Service()
class UserService {
  constructor(private userRepo: UserRepository) {}

  async getAllUsers(): Promise<User[]> {
    return this.userRepo.findAll()
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await this.userRepo.findById(id)
    if (!user) return null
    return user
  }

  async createUser(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const existing = await this.userRepo.findByEmail(data.email)
    if (existing) {
      throw new Error('Email already exists')
    }

    const user: User = {
      id: Date.now().toString(),
      createdAt: new Date(),
      ...data,
    }

    return this.userRepo.create(user)
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    return this.userRepo.update(id, data)
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.userRepo.delete(id)
  }
}

// Controller Layer
@Controller('/api/users')
class UserController {
  constructor(private userService: UserService) {}

  @Get('/')
  async getAll() {
    const users = await this.userService.getAllUsers()
    return { users, count: users.length }
  }

  @Get('/:id')
  async getOne(req: Request) {
    const user = await this.userService.getUserById(req.params.id)
    if (!user) {
      return { error: 'User not found' }
    }
    return { user }
  }

  @Post('/')
  async create(req: Request) {
    try {
      const user = await this.userService.createUser(req.body)
      return { success: true, user }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  @Put('/:id')
  async update(req: Request) {
    const user = await this.userService.updateUser(req.params.id, req.body)
    if (!user) {
      return { error: 'User not found' }
    }
    return { success: true, user }
  }

  @Delete('/:id')
  async delete(req: Request) {
    const deleted = await this.userService.deleteUser(req.params.id)
    if (!deleted) {
      return { error: 'User not found' }
    }
    return { success: true, deleted }
  }
}

// Module
@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository],
})
class UserModule {}

// Application
const app = codex()

app.enableJson().baseRoute('/api/v1').registerModules([UserModule]).handleNotFound()

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
```

### Multi-Module Application

Organizing a larger application with multiple modules:

```typescript
import codex from '@codex-js/core'
import cors from 'cors'
import helmet from 'helmet'

// Auth Module
@Module({
  controllers: [AuthController, SessionController],
  providers: [AuthService, TokenService],
})
class AuthModule {}

// User Module
@Module({
  controllers: [UserController, ProfileController],
  providers: [UserService, UserRepository],
})
class UserModule {}

// Product Module
@Module({
  controllers: [ProductController, CategoryController],
  providers: [ProductService, ProductRepository, CategoryService],
})
class ProductModule {}

// Application
const app = codex()

// Global middleware
app.use(cors()).use(helmet()).enableJson().enableUrlEncoded()

// Register modules with different configurations
app.registerModules([
  // Public API - no authentication
  {
    route: '/api/v1',
    middlewares: [rateLimiter],
    modules: [ProductModule],
  },
  // Protected API - requires authentication
  {
    route: '/api/v1',
    middlewares: [authenticate, rateLimiter],
    modules: [UserModule],
  },
  // Admin API - requires admin role
  {
    route: '/api/v1/admin',
    middlewares: [authenticate, requireAdmin],
    modules: [AdminModule],
  },
  // Auth routes - special handling
  {
    route: '/auth',
    modules: [AuthModule],
  },
])

// Static files and 404
app.serveStatic('public', '/static').handleNotFound()

// Error handling
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({
    error: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
```

### Middleware Integration Example

```typescript
import { Request, Response, NextFunction, RequestHandler } from 'express'
import { ExtendedRequest, ProtectedRequest } from '@codex-js/core'

// Custom middleware
const requestLogger: RequestHandler = (req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
}

// Authentication middleware
type AuthRequest = ExtendedRequest<'user', { id: string; role: string }>

const authenticate: RequestHandler = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const user = await verifyToken(token)
    ;(req as AuthRequest).user = user
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// Authorization middleware
const requireAdmin: RequestHandler = (req, res, next) => {
  const user = (req as AuthRequest).user
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

// Use in controllers
type ProtectedAuthRequest = ProtectedRequest<AuthRequest>

@Controller('/api/admin', [authenticate, requireAdmin])
class AdminController {
  @Get('/users')
  getAllUsers(req: ProtectedAuthRequest) {
    // req.user is guaranteed to exist
    console.log(`Admin ${req.user.id} accessing users`)
    return { users: [] }
  }
}
```

---

## Best Practices

### Architecture

1. **Separation of concerns** — Keep controllers thin, move business logic to services, and isolate data access in repositories

2. **Dependency injection** — Use constructor injection over property injection when possible. Avoid manual instantiation

3. **Feature-based organization** — Group related files by feature (module) rather than by type

```
src/modules/users/
  ├── user.controller.ts
  ├── user.service.ts
  ├── user.repository.ts
  ├── user.types.ts
  └── user.module.ts
```

4. **Module boundaries** — Each module should be self-contained with clear interfaces. Modules should depend on abstractions, not concrete implementations

5. **Single responsibility** — Each class should have one reason to change. Controllers handle HTTP, services handle business logic, repositories handle data

### Type Safety

1. **Type your requests** — Use `ExtendedRequest` and `ProtectedRequest` for type-safe middleware data

```typescript
// Define once, use everywhere
type AuthRequest = ExtendedRequest<'user', User>
type ProtectedAuthRequest = ProtectedRequest<AuthRequest>

@Get('/profile', [authenticate])
getProfile(req: ProtectedAuthRequest) {
  // req.user is type-safe and required
  return { user: req.user }
}
```

2. **Define interfaces** — Create explicit interfaces for your data models

```typescript
interface User {
  id: string
  email: string
  name: string
  createdAt: Date
}

interface CreateUserDTO {
  email: string
  name: string
  password: string
}
```

3. **Use strict TypeScript** — Enable strict mode in your tsconfig.json for maximum type safety

### Error Handling

1. **Use custom error classes** — Create specific error types for different scenarios

```typescript
class ValidationError extends Error {
  status = 400
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

class NotFoundError extends Error {
  status = 404
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`)
    this.name = 'NotFoundError'
  }
}
```

2. **Centralized error handling** — Use a global error handler middleware

```typescript
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const status = err.status || 500
  const message = err.message || 'Internal server error'

  logger.error({
    error: err.name,
    message,
    stack: err.stack,
    path: req.path,
  })

  res.status(status).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
    }),
  })
}

app.use(errorHandler)
```

3. **Validate early** — Use validation middleware at the route level

```typescript
const validateUser = (req: Request, res: Response, next: NextFunction) => {
  const { email, name } = req.body

  if (!email || !email.includes('@')) {
    return next(new ValidationError('Invalid email'))
  }

  if (!name || name.length < 2) {
    return next(new ValidationError('Name must be at least 2 characters'))
  }

  next()
}

@Post('/', [validateUser])
createUser(req: Request) {
  // Body is guaranteed to be valid
  return this.userService.create(req.body)
}
```

### Testing

1. **Unit test services** — Services should be the primary focus of unit testing

```typescript
import { UserService } from './user.service'
import { UserRepository } from './user.repository'

describe('UserService', () => {
  let userService: UserService
  let userRepo: jest.Mocked<UserRepository>

  beforeEach(() => {
    userRepo = {
      findById: jest.fn(),
      create: jest.fn(),
      // ... other methods
    } as any

    userService = new UserService(userRepo)
  })

  it('should get user by id', async () => {
    const mockUser = { id: '1', name: 'John' }
    userRepo.findById.mockResolvedValue(mockUser)

    const result = await userService.getUserById('1')

    expect(result).toEqual(mockUser)
    expect(userRepo.findById).toHaveBeenCalledWith('1')
  })
})
```

2. **Integration test controllers** — Test the full HTTP request/response cycle

```typescript
import request from 'supertest'
import codex from '@codex-js/core'
import { AppModule } from './app.module'

describe('UserController', () => {
  let app: any

  beforeAll(() => {
    app = codex().enableJson().registerModules([AppModule]).instance()
  })

  it('should create a user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'John', email: 'john@example.com' })
      .expect(200)

    expect(response.body.user).toHaveProperty('id')
    expect(response.body.user.name).toBe('John')
  })
})
```

3. **Mock external dependencies** — Use dependency injection to swap real implementations with mocks

### Performance

1. **Use async/await consistently** — Codex handles promises automatically

```typescript
@Get('/:id')
async getUser(req: Request) {
  // All async operations are properly handled
  const user = await this.userService.findById(req.params.id)
  const posts = await this.postService.findByUser(user.id)
  return { user, posts }
}
```

2. **Implement caching** — Add caching middleware for expensive operations

```typescript
import { cacheMiddleware } from './middleware/cache'

@Get('/expensive', [cacheMiddleware({ ttl: 300 })])
async expensiveOperation() {
  // Result will be cached for 5 minutes
  return await this.performExpensiveCalculation()
}
```

3. **Batch database operations** — Minimize database round trips

```typescript
@Service()
class UserService {
  async getUsersWithPosts(userIds: string[]) {
    // Bad: N+1 query problem
    // const users = await Promise.all(
    //   userIds.map(id => this.userRepo.findById(id))
    // )

    // Good: Single query
    const users = await this.userRepo.findByIds(userIds)
    const posts = await this.postRepo.findByUserIds(userIds)

    return users.map((user) => ({
      ...user,
      posts: posts.filter((p) => p.userId === user.id),
    }))
  }
}
```

---

## Troubleshooting

### Common Issues

**Issue: "Decorators are not valid here"**

Solution: Ensure `experimentalDecorators` and `emitDecoratorMetadata` are enabled in tsconfig.json

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

**Issue: "Cannot inject service into controller"**

Solution: Make sure you import `reflect-metadata` at the top of your entry file

```typescript
// Must be first import
import codex from '@codex-js/core'
```

**Issue: "Route not found after registration"**

Solution: Check the order of operations. Register modules before calling `handleNotFound()`

```typescript
app
  .registerModules([AppModule]) // First
  .handleNotFound() // Then
```

**Issue: "Middleware not executing"**

Solution: Ensure middleware is added in the correct order and check for early responses

```typescript
// Global middleware before modules
app.use(cors())
app.registerModules([AppModule])

// Or route-level
@Get('/', [middleware1, middleware2]) // Executes in order
```

**Issue: "Type errors with Request object"**

Solution: Use ExtendedRequest type for custom properties

```typescript
// Instead of
function handler(req: Request) {
  const user = (req as any).user // Bad
}

// Use
type AuthRequest = ExtendedRequest<'user', User>
function handler(req: AuthRequest) {
  const user = req.user // Type-safe
}
```

---

## Migration Guide

### From Express

Migrating from plain Express to Codex is straightforward:

**Before (Express):**

```typescript
import express from 'express'

const app = express()
app.use(express.json())

app.get('/api/users', async (req, res) => {
  const users = await getUsersFromDB()
  res.json({ users })
})

app.post('/api/users', async (req, res) => {
  const user = await createUser(req.body)
  res.json({ user })
})

app.listen(3000)
```

**After (Codex):**

```typescript
import codex, { Controller, Service, Module, Get, Post } from '@codex-js/core'

@Service()
class UserService {
  async getUsers() {
    return getUsersFromDB()
  }

  async createUser(data: any) {
    return createUser(data)
  }
}

@Controller('/api/users')
class UserController {
  constructor(private userService: UserService) {}

  @Get('/')
  async getAll() {
    const users = await this.userService.getUsers()
    return { users }
  }

  @Post('/')
  async create(req: Request) {
    const user = await this.userService.createUser(req.body)
    return { user }
  }
}

@Module({
  controllers: [UserController],
  providers: [UserService],
})
class AppModule {}

const app = codex()

app.enableJson().registerModules([AppModule])

app.listen(3000)
```

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

---

## License

MIT

---

## Acknowledgments

Codex is built on the shoulders of giants:

- **Express.js** - The fast, unopinionated web framework
- **TypeDI** - Dependency injection container
- **TypeScript** - Typed superset of JavaScript

---

_mic drop._
