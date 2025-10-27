import { ControllerClass, InjectableClass } from './ClassTypes.js';

export interface ModuleMetadata {
  controllers?: ControllerClass[];
  providers?: InjectableClass[];
}
