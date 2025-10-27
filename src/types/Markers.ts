/**
 * Marker interface for classes decorated with @Controller
 */
export interface IsController {
  readonly __isController: unique symbol;
}

/**
 * Marker interface for classes decorated with @Service
 */
export interface IsService {
  readonly __isService: unique symbol;
}

/**
 * Marker interface for classes decorated with @Repo
 */
export interface IsRepo {
  readonly __isRepo: unique symbol;
}

/**
 * Marker interface for classes decorated with @Module
 */
export interface IsModule {
  readonly __isModule: unique symbol;
}
