import 'reflect-metadata'
import express, {
  Router as ExpressRouter,
  Request,
  Response,
  NextFunction,
  RequestHandler,
  Application as ExpressApplication,
  ErrorRequestHandler,
  Router,
  RequestParamHandler,
} from 'express'

import { Container } from 'typedi'

import * as serveStatic from 'serve-static'
import { ServeStaticOptions } from 'serve-static'
import path from 'path'

//Decorators
import { createRouteDecorator } from './decorators/RouteDecorator.js'
import { Repo, Service, Controller, Inject, Module } from './decorators/DiDecorators.js'

//Types
import { HttpMethod } from './types/HttpMethod.js'
import { ControllerClass, InjectableClass } from './types/ClassTypes.js'
import { ModuleRegistration } from './types/ModuleRegistration.js'
import { RouteMetadata } from './types/RouteMetadata.js'
import { ModuleMetadata } from './types/ModuleMetadata.js'

//Assertion
import { assertController, assertModule } from './assertion/assert.js'

//Core
import CodexProxy from './core/Proxy.js'

const Get = createRouteDecorator('get')
const Post = createRouteDecorator('post')
const Put = createRouteDecorator('put')
const Patch = createRouteDecorator('patch')
const Delete = createRouteDecorator('delete')

export class Codex {
  public app: ExpressApplication = express()

  private config = {
    jsonEnabled: false,
    urlEncodedEnabled: false,
    globalBaseRoute: '',
    globalMiddlewares: [] as RequestHandler[],
    notFoundHandler: null as RequestHandler | null,
  }

  instance() {
    return this.app
  }
  constructor() {
    ;['get', 'post', 'put', 'delete', 'patch'].forEach((method) => {
      ;(this as any)[method] = this.createHttpMethod(method as HttpMethod)
    })
    return new CodexProxy(this) as any
  }

  private createHttpMethod(method: HttpMethod) {
    return (path: string, ...handlers: RequestHandler[]) => {
      const fullPath = this.config.globalBaseRoute + path
      ;(this.app as any)[method](fullPath, ...handlers)
      return this
    }
  }

  baseRoute(path: string) {
    if (!path || path === '/') {
      this.config.globalBaseRoute = ''
    } else {
      this.config.globalBaseRoute = path.startsWith('/') ? path : '/' + path
      this.config.globalBaseRoute = this.config.globalBaseRoute.replace(/\/+$/, '')
    }
    return this
  }

  use(...args: any[]) {
    this.app.use(...args)
    return this
  }

  useBefore(middlewares: RequestHandler[]) {
    if (middlewares.length > 0) {
      this.app.use(...middlewares)
    }
    return this
  }

  handleNotFound(handler?: RequestHandler) {
    const finalHandler =
      handler ||
      this.config.notFoundHandler ||
      ((req: Request, res: Response, next: NextFunction) => {
        res.status(404).json({
          status: 'fail',
          message: `${req.originalUrl} not found`,
        })
      })

    this.app.use(finalHandler)
    return this
  }

  enableJson() {
    if (!this.config.jsonEnabled) {
      this.app.use(express.json())
      this.config.jsonEnabled = true
      console.log('✓ JSON body parsing enabled')
    }
    return this
  }

  enableUrlEncoded(options: Parameters<typeof express.urlencoded>[0] = { extended: true }) {
    if (!this.config.urlEncodedEnabled) {
      this.app.use(express.urlencoded(options))
      this.config.urlEncodedEnabled = true
      console.log('✓ URL-encoded body parsing enabled')
    }
    return this
  }

  serveStatic(dirPath: string, route?: string, options?: ServeStaticOptions) {
    const resolvedPath = path.resolve(process.cwd(), dirPath)

    const mountPath = route ? (route.startsWith('/') ? route : '/' + route) : '/'

    console.log(`Serving static files from "${resolvedPath}" at route "${mountPath}"`)

    this.app.use(mountPath, express.static(resolvedPath, options))
    return this
  }

  registerModules(registrations: ModuleRegistration[]) {
    registrations.forEach((item) => {
      if (typeof item === 'function') {
        assertModule(item)

        const metadata: ModuleMetadata = Reflect.getMetadata('codex:module', item)
        const { controllers = [], providers = [] } = metadata

        providers.forEach((provider) => {
          if (!Container.has(provider)) Container.set(provider, new provider())
        })

        if (controllers.length > 0) {
          this.registerControllers(controllers)
        }

        console.log(`✓ Loaded module: ${item.name}`)
      } else if ('modules' in item && Array.isArray(item.modules)) {
        const routePrefix = item.route || ''
        const middlewares = item.middlewares || []

        item.modules.forEach((mod) => {
          assertModule(mod)

          const metadata: ModuleMetadata = Reflect.getMetadata('codex:module', mod)
          const { controllers = [], providers = [] } = metadata

          providers.forEach((provider) => {
            if (!Container.has(provider)) Container.get(provider)
          })

          if (controllers.length > 0) {
            controllers.forEach((ControllerClass) => {
              assertController(ControllerClass)
              const basePath: string =
                Reflect.getMetadata('codex:controller', ControllerClass) || ''
              const router = ExpressRouter()

              if (middlewares.length > 0) router.use(...middlewares)

              const controllerMiddlewares: RequestHandler[] =
                Reflect.getMetadata('codex:middlewares', ControllerClass) || []
              if (controllerMiddlewares.length > 0) router.use(...controllerMiddlewares)

              const instance = Container.get(ControllerClass)
              const routes: RouteMetadata[] =
                Reflect.getMetadata('codex:routes', ControllerClass) || []
              routes.forEach(({ method, path, handler, middlewares }) => {
                const wrappedHandler = this.createHandler(instance, handler)
                ;(router as any)[method](path, ...middlewares, wrappedHandler)
              })

              this.app.use(this.config.globalBaseRoute + routePrefix + basePath, router)
              console.log(
                `✓ Registered controller: ${ControllerClass.name} at ${
                  this.config.globalBaseRoute + routePrefix + basePath
                }`
              )
            })
          }

          console.log(`✓ Loaded module: ${mod.name}`)
        })
      }
    })

    return this
  }

  private registerControllers(controllers: readonly ControllerClass[]) {
    controllers.forEach((ControllerClass) => {
      assertController(ControllerClass)

      const basePath: string = Reflect.getMetadata('codex:controller', ControllerClass) || ''
      const router = ExpressRouter()

      if (this.config.globalMiddlewares.length > 0) {
        router.use(...this.config.globalMiddlewares)
      }

      const controllerMiddlewares: RequestHandler[] =
        Reflect.getMetadata('codex:middlewares', ControllerClass) || []
      if (controllerMiddlewares.length > 0) {
        router.use(...controllerMiddlewares)
      }

      const instance = Container.get(ControllerClass)
      const routes: RouteMetadata[] = Reflect.getMetadata('codex:routes', ControllerClass) || []
      routes.forEach(({ method, path, handler, middlewares }) => {
        const wrappedHandler = this.createHandler(instance, handler)
        ;(router as any)[method](path, ...middlewares, wrappedHandler)
      })

      this.app.use(this.config.globalBaseRoute + basePath, router)

      console.log(
        `✓ Registered controller: ${ControllerClass.name} at ${
          this.config.globalBaseRoute + basePath
        }`
      )
    })

    return this
  }

  private registerProviders(providers: readonly InjectableClass[]) {
    providers.forEach((provider) => {
      if (!Container.has(provider)) {
        Container.get(provider)
        console.log(`✓ Registered provider: ${provider.name}`)
      }
    })
    return this
  }

  private createHandler(instance: any, handlerKey: string | symbol): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await instance[handlerKey](req, res, next)

        if (result !== undefined && !res.headersSent) {
          res.json(result)
        }
      } catch (error) {
        next(error)
      }
    }
  }
}

type CodexApp = Codex & ExpressApplication

type ExtendedRequest<K extends string, T> = Request & {
  [P in K]?: T
}

type ProtectedRequest<ER extends ExtendedRequest<string, any> = ExtendedRequest<any, any>> =
  Request & {
    [K in Exclude<keyof ER, keyof Request>]-?: NonNullable<ER[K]>
  }

//Decorators
export { Repo, Service, Controller, Inject, Module }

//Methods
export { Get, Post, Put, Patch, Delete }

export default function codex(): CodexApp {
  return new Codex() as CodexApp
}

export type {
  Request,
  Response,
  NextFunction,
  RequestHandler,
  ErrorRequestHandler,
  Router,
  RequestParamHandler,
  ExpressApplication as Application,
  serveStatic,
  ServeStaticOptions,
  ExtendedRequest,
  ProtectedRequest,
  ModuleRegistration,
  RouteMetadata,
}
