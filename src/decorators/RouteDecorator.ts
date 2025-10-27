import { RequestHandler } from 'express';
import { HttpMethod } from '../types/HttpMethod.js';
import { RouteMetadata } from '../types/RouteMetadata.js';

export function createRouteDecorator(method: HttpMethod) {
  return (path: string = '/', middlewares: RequestHandler[] = []): MethodDecorator => {
    return (target, propertyKey) => {
      const routes: RouteMetadata[] = Reflect.getMetadata('codex:routes', target.constructor) || [];
      routes.push({ method, path, handler: propertyKey, middlewares });
      Reflect.defineMetadata('codex:routes', routes, target.constructor);
    };
  };
}
