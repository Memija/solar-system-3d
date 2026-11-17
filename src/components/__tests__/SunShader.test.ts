import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { vertexShader, fragmentShader } from '../SunShader';

describe('SunShader', () => {
    it('should export vertexShader string with logarithmic depth buffer support', () => {
        expect(typeof vertexShader).toBe('string');
        expect(vertexShader.length).toBeGreaterThan(0);
        expect(vertexShader).toContain('void main()');
        expect(vertexShader).toContain('#include <common>');
        expect(vertexShader).toContain('#include <logdepthbuf_pars_vertex>');
        expect(vertexShader).toContain('#include <logdepthbuf_vertex>');

        const glPosIndex = vertexShader.indexOf('gl_Position =');
        const logDepthIndex = vertexShader.indexOf('#include <logdepthbuf_vertex>');
        expect(glPosIndex).toBeGreaterThan(-1);
        expect(logDepthIndex).toBeGreaterThan(glPosIndex);

        const includes = [...vertexShader.matchAll(/#include <(\w+)>/g)].map(m => m[1]);
        for (const chunkName of includes) {
            expect(THREE.ShaderChunk[chunkName as keyof typeof THREE.ShaderChunk]).toBeDefined();
        }
    });

    it('should export opaque fragmentShader string with logarithmic depth buffer support', () => {
        expect(typeof fragmentShader).toBe('string');
        expect(fragmentShader.length).toBeGreaterThan(0);
        expect(fragmentShader).toContain('void main()');
        expect(fragmentShader).toContain('snoise');
        expect(fragmentShader).toContain('#include <logdepthbuf_pars_fragment>');
        expect(fragmentShader).toContain('#include <logdepthbuf_fragment>');
        expect(fragmentShader).toContain('gl_FragColor = vec4(finalColor, 1.0);');

        const includes = [...fragmentShader.matchAll(/#include <(\w+)>/g)].map(m => m[1]);
        for (const chunkName of includes) {
            expect(THREE.ShaderChunk[chunkName as keyof typeof THREE.ShaderChunk]).toBeDefined();
        }
    });
});
