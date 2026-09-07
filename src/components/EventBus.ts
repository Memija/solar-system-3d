export interface SelectCelestialBodyPayload {
    name: string;
    eventName?: string;
    eventImpact?: string;
}

export interface SolarSystemEventMap {
    'tour-focus': string;
    'jump-to-date': string;
    'select-celestial-body': SelectCelestialBodyPayload | string;
}

export type SolarSystemEventType = keyof SolarSystemEventMap;
export type EventHandler<T> = (data: T) => void;

/**
 * Strongly-typed event emitter bus for Solar System 3D.
 * Provides type-safe pub/sub communication with automatic unsubscribe callbacks,
 * maintaining full backwards compatibility with window CustomEvents.
 */
export class EventBus {
    private static listeners: Map<SolarSystemEventType, Set<EventHandler<any>>> = new Map();

    /**
     * Subscribe to a typed event.
     * @returns An unsubscribe callback for simple lifecycle management in dispose()
     */
    static on<K extends SolarSystemEventType>(
        event: K,
        handler: EventHandler<SolarSystemEventMap[K]>
    ): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(handler);

        return () => this.off(event, handler);
    }

    /**
     * Unsubscribe a handler from an event.
     */
    static off<K extends SolarSystemEventType>(
        event: K,
        handler: EventHandler<SolarSystemEventMap[K]>
    ): void {
        const handlers = this.listeners.get(event);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.listeners.delete(event);
            }
        }
    }

    /**
     * Emit a typed event to all registered subscribers.
     * Also dispatches a CustomEvent on window for backward compatibility.
     */
    static emit<K extends SolarSystemEventType>(event: K, payload: SolarSystemEventMap[K]): void {
        const handlers = this.listeners.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(payload);
                } catch (err) {
                    console.error(`[EventBus] Error in handler for event "${event}":`, err);
                }
            });
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(event, { detail: payload }));
        }
    }

    /**
     * Clear all registered listeners. Useful in tests and application teardown.
     */
    static clear(): void {
        this.listeners.clear();
    }
}
