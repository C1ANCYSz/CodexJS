import { ModuleClass } from './ClassTypes.js';
import { RequestHandler } from 'express';
export type ModuleRegistration =
  | ModuleClass
  | {
      route?: string; // optional base route for these modules
      middlewares?: RequestHandler[]; // optional middlewares for this group
      modules: ModuleClass[];
    };
