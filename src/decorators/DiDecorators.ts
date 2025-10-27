import "reflect-metadata"
import { RequestHandler } from 'express';
import { Constructor } from '../types/Constructor.js';
import { Service as TypeDiService, Inject as TypeDiInject } from 'typedi';
import { IsRepo, IsController, IsModule, IsService } from '../types/Markers.js';
import { ModuleMetadata } from '../types/ModuleMetadata.js';
export function Repo(): <T extends Constructor>(target: T) => T & Constructor<IsRepo> {
  return <T extends Constructor>(target: T) => {
    TypeDiService()(target);
    return target as T & Constructor<IsRepo>;
  };
}

export function Service(): <T extends Constructor>(target: T) => T & Constructor<IsService> {
  return <T extends Constructor>(target: T) => {
    TypeDiService()(target);
    return target as T & Constructor<IsService>;
  };
}

export function Controller(
  basePath: string = '',
  middlewares: RequestHandler[] = []
): <T extends Constructor>(target: T) => T & Constructor<IsController> {
  return <T extends Constructor>(target: T) => {
    Reflect.defineMetadata('codex:controller', basePath, target);
    Reflect.defineMetadata('codex:middlewares', middlewares, target);
    TypeDiService()(target);
    return target as T & Constructor<IsController>;
  };
}

export function Inject(typeOrIdentifier?: any): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const resolvedType =
      typeof typeOrIdentifier === 'function' && typeOrIdentifier.prototype ? () => typeOrIdentifier : typeOrIdentifier;

    const finalType = resolvedType || (() => Reflect.getMetadata('design:type', target, propertyKey));
    TypeDiInject(finalType)(target, propertyKey);
  };
}

export function Module(metadata: ModuleMetadata): <T extends Constructor>(target: T) => T & Constructor<IsModule> {
  return <T extends Constructor>(target: T) => {
    Reflect.defineMetadata('codex:module', metadata, target);
    TypeDiService()(target);
    return target as T & Constructor<IsModule>;
  };
}
