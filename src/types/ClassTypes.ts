import { Constructor } from './Constructor.js';
import { IsController, IsModule, IsRepo, IsService } from './Markers.js';
/**
 * Type-safe controller constructor
 */
export type ControllerClass<T = any> = Constructor<T & IsController>;

/**
 * Type-safe service constructor
 */
export type ServiceClass<T = any> = Constructor<T & IsService>;

/**
 * Type-safe repository constructor
 */
export type RepoClass<T = any> = Constructor<T & IsRepo>;

/**
 * Type-safe module constructor
 */
export type ModuleClass<T = any> = Constructor<T & IsModule>;

/**
 * Type for any injectable class (Service or Repo)
 */
export type InjectableClass<T = any> = ServiceClass<T> | RepoClass<T>;
