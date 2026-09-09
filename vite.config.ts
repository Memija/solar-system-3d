import { defineConfig } from 'vite';

export default defineConfig({
    base: '/solar-system-3d/',
    build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules/three/examples') || id.includes('node_modules/three/addons')) {
                        return 'three-addons';
                    }
                    if (id.includes('node_modules/three')) {
                        return 'three-core';
                    }
                    if (id.includes('node_modules/dat.gui')) {
                        return 'dat-gui';
                    }
                }
            }
        }
    }
});
