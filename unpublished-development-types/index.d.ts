// Place ambient type declarations only used during local development here.

export {};

declare global {
  interface Window {
    // raygun4js attaches this global once the loader has run. We type it
    // loosely since the call signatures vary by command — tighten if you
    // need stricter safety in your application code.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rg4js?: (...args: any[]) => any;
  }
}
