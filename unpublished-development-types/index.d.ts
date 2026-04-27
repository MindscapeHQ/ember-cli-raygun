// Place ambient type declarations only used during local development here.

import type { RaygunV2 } from 'raygun4js';

export {};

declare global {
  interface Window {
    // raygun4js attaches this global once the loader has run.
    rg4js?: RaygunV2;
  }
}
