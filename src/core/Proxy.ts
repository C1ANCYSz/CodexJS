class CodexProxy {
  constructor(private target: any) {
    return new Proxy(target, {
      get: this.proxyHandler.bind(this),
    });
  }

  private proxyHandler(target: any, prop: string | symbol, receiver: any): any {
    // If Codex has it, return it directly
    if (prop in target) {
      return Reflect.get(target, prop, receiver);
    }

    // Blocked props that must always come from Codex
    const blocked = ['use', 'enableJson', 'enableUrlEncoded', 'registerModules'];
    if (blocked.includes(prop as string)) {
      return Reflect.get(target, prop, receiver);
    }

    // If it's a function on Express, bind it correctly (handles `.get()` safely)
    const value = (target.app as any)[prop];
    if (typeof value === 'function') {
      return (...args: any[]) => {
        const result = value.apply(target.app, args);
        // Return Codex instance if Express method returns the app (for chaining)
        return result === target.app ? receiver : result;
      };
    }

    return value;
  }
}

export default CodexProxy;
