import { Constructor } from '../types/Constructor.js';
import { ModuleClass, ControllerClass } from '../types/ClassTypes.js';
/**
 * Runtime check if a class has controller metadata
 */
function isController(target: Constructor): target is ControllerClass {
  return Reflect.hasMetadata('codex:controller', target);
}

/**
 * Runtime check if a class has module metadata
 */
function isModule(target: Constructor): target is ModuleClass {
  return Reflect.hasMetadata('codex:module', target);
}

/**
 * Type-safe assertion for controllers
 */
export function assertController(target: Constructor): asserts target is ControllerClass {
  if (!isController(target)) {
    const className = (target as any).name || '(anonymous class)';
    throw new Error(
      `${className} is missing @Controller decorator. ` + `Did you forget to add @Controller() to the class?`
    );
  }
}

/**
 * Type-safe assertion for modules
 */
export function assertModule(target: Constructor): asserts target is ModuleClass {
  if (!isModule(target)) {
    const className = (target as any).name || '(anonymous class)';
    throw new Error(` ${className} is missing @Module() metadata.`);
  }
}
