import { describe, it, expect } from 'vitest';
import { vertexShader, fragmentShader } from '../SunShader';

describe('SunShader', () => {
    it('should export vertexShader string', () => {
        expect(typeof vertexShader).toBe('string');
        expect(vertexShader.length).toBeGreaterThan(0);
        expect(vertexShader).toContain('void main()');
    });

    it('should export fragmentShader string', () => {
        expect(typeof fragmentShader).toBe('string');
        expect(fragmentShader.length).toBeGreaterThan(0);
        expect(fragmentShader).toContain('void main()');
        expect(fragmentShader).toContain('snoise');
    });
});
