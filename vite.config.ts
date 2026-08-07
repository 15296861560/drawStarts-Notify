import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main.ts'),
      name: 'notifyClient',
      formats: ['es', 'umd'],
      fileName: (format) => `draw-starts-notify.${format}.js`,
    },
    sourcemap: true,
    rollupOptions: {
      external: ['eventemitter3'],
      output: {
        globals: {
          eventemitter3: 'EventEmitter3',
        },
        exports: 'named',
      },
    },
  },
  plugins: [],
})
