import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from '../EventBus';

describe('EventBus', () => {
    beforeEach(() => {
        EventBus.clear();
    });

    it('should subscribe and receive emitted events with typed payload', () => {
        const handler = vi.fn();
        const unsubscribe = EventBus.on('tour-focus', handler);

        EventBus.emit('tour-focus', 'Jupiter');

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith('Jupiter');

        unsubscribe();
        EventBus.emit('tour-focus', 'Saturn');
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should support object payloads for select-celestial-body', () => {
        const handler = vi.fn();
        EventBus.on('select-celestial-body', handler);

        const payload = {
            name: 'Mars',
            eventName: 'Perseverance Landing',
            eventImpact: 'Rover arrived at Jezero Crater'
        };

        EventBus.emit('select-celestial-body', payload);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(payload);
    });

    it('should dispatch window CustomEvent for backward compatibility', () => {
        const windowListener = vi.fn();
        window.addEventListener('jump-to-date', windowListener);

        EventBus.emit('jump-to-date', '2024-04-08');

        expect(windowListener).toHaveBeenCalledTimes(1);
        const event = windowListener.mock.calls[0][0] as CustomEvent;
        expect(event.detail).toBe('2024-04-08');

        window.removeEventListener('jump-to-date', windowListener);
    });

    it('should clear all listeners on clear()', () => {
        const handler1 = vi.fn();
        const handler2 = vi.fn();
        EventBus.on('tour-focus', handler1);
        EventBus.on('jump-to-date', handler2);

        EventBus.clear();

        EventBus.emit('tour-focus', 'Earth');
        EventBus.emit('jump-to-date', '2000-01-01');

        expect(handler1).not.toHaveBeenCalled();
        expect(handler2).not.toHaveBeenCalled();
    });
});
