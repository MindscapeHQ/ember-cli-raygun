import { babel } from '@rollup/plugin-babel';
import { Addon } from '@embroider/addon-dev/rollup';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const addon = new Addon({
  srcDir: 'src',
  destDir: 'dist',
});

const rootDirectory = dirname(fileURLToPath(import.meta.url));
const babelConfig = resolve(rootDirectory, './babel.publish.config.cjs');
const tsConfig = resolve(rootDirectory, './tsconfig.publish.json');

export default {
  output: addon.output(),

  plugins: [
    addon.publicEntrypoints([
      'index.js',
      'services/**/*.js',
      'setup.js',
      'template-registry.js',
    ]),

    // Auto-register the raygun service in the consuming app's namespace.
    addon.appReexports(['services/**/*.js']),

    addon.dependencies(),

    babel({
      extensions: ['.js', '.gjs', '.ts', '.gts'],
      babelHelpers: 'bundled',
      configFile: babelConfig,
    }),

    addon.hbs(),
    addon.gjs(),

    addon.declarations(
      'declarations',
      `pnpm ember-tsc --declaration --project ${tsConfig}`,
    ),

    addon.keepAssets(['**/*.css']),
    addon.clean(),
  ],
};
