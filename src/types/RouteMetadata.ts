import { HttpMethod } from './HttpMethod.js';
import { RequestHandler } from 'express';
export interface RouteMetadata {
  method: HttpMethod;
  path: string;
  handler: string | symbol;
  middlewares: RequestHandler[];
}
