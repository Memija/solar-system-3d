/**
 * SvgIcons.ts
 * Unified monochrome vector telemetry icon system for Observatory HUD,
 * Control Center, Header Quick-Access Slots, and Modals.
 */

export type SvgIconName =
    | 'attach-camera'
    | 'surface-view'
    | 'free-camera'
    | 'cinematic-tour'
    | 'bloom'
    | 'lighting'
    | 'grid'
    | 'habitable'
    | 'axes'
    | 'scale'
    | 'orbits'
    | 'moons'
    | 'constellations'
    | 'asteroids'
    | 'kuiper'
    | 'dwarf'
    | 'comets'
    | 'spacecraft'
    | 'meteors'
    | 'trails'
    | 'minimap'
    | 'snapshot'
    | 'audio-on'
    | 'audio-off'
    | 'telemetry'
    | 'shortcuts'
    | 'measure'
    | 'fullscreen'
    | 'target'
    | 'time'
    | 'layers'
    | 'camera'
    | 'optics'
    | 'system'
    | 'controls-sliders'
    | 'plus'
    | 'close'
    | 'calendar'
    | 'clock'
    | 'play'
    | 'pause'
    | 'globe'
    | 'sun'
    | 'earth'
    | 'planet'
    | 'rocket'
    | 'headphones'
    | 'info'
    | 'lock'
    | 'reset'
    | 'check';

const ICON_PATHS: Record<SvgIconName, string> = {
    'attach-camera': '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    'surface-view': '<path d="M2 18c3.2-2.4 6.5-3.6 10-3.6s6.8 1.2 10 3.6"/><circle cx="12" cy="8" r="3"/><path d="M12 2v1.5M6.5 8H5M19 8h-1.5M8.1 4.1l1.1 1.1M15.9 4.1l-1.1 1.1"/>',
    'free-camera': '<path d="M12 3l3 3h-6l3-3zM12 21l3-3H9l3 3zM3 12l3-3v6l-3-3zM21 12l-3-3v6l3-3z"/><circle cx="12" cy="12" r="2"/>',
    'cinematic-tour': '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M10 9.5l5 2.5-5 2.5V9.5z"/><path d="M7 5l2 3.5M12 5l2 3.5M17 5l1.5 2.8"/>',
    'bloom': '<path d="M12 2.5l2.1 6.4 6.4 2.1-6.4 2.1-2.1 6.4-2.1-6.4-6.4-2.1 6.4-2.1L12 2.5z"/><path d="M19 3v3M17.5 4.5h3"/>',
    'lighting': '<circle cx="12" cy="12" r="7.5"/><path d="M12 4.5a7.5 7.5 0 0 1 0 15V4.5z" fill="currentColor" fill-opacity="0.28"/><path d="M12 1.8v1.4M12 20.8v1.4M20.8 12h1.4M1.8 12h1.4"/>',
    'grid': '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3.5 9h17M3.5 15h17"/>',
    'habitable': '<circle cx="12" cy="12" r="9" stroke-dasharray="2.5 2.5"/><circle cx="12" cy="12" r="5"/><circle cx="17" cy="12" r="1.4" fill="currentColor"/>',
    'axes': '<path d="M12 12V3M12 12l7.8 4.5M12 12l-7.8 4.5"/><path d="M10 5l2-2 2 2M18.8 14.3l1 2.2-2.3.5M6.5 17l-2.3-.5 1-2.2"/>',
    'scale': '<path d="M3 16h18v3H3z"/><path d="M6 16v-3M10 16v-2M14 16v-3M18 16v-2"/><path d="M4 9h16M4 9l2.5-2.5M4 9l2.5 2.5M20 9l-2.5-2.5M20 9l-2.5 2.5"/>',
    'orbits': '<circle cx="12" cy="12" r="3.2"/><ellipse cx="12" cy="12" rx="9.5" ry="4.2" transform="rotate(-24 12 12)"/>',
    'moons': '<path d="M19.5 14.5A7.8 7.8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
    'constellations': '<circle cx="5" cy="7" r="1.6"/><circle cx="12" cy="5" r="1.6"/><circle cx="19" cy="9" r="1.6"/><circle cx="15" cy="18" r="1.6"/><circle cx="7" cy="16" r="1.6"/><path d="M6.5 6.6l3.9-1.2M13.4 5.8l4.2 2.4M18.3 10.5l-2.6 6M13.4 17.6l-4.8-1.2M6.5 14.4L5.4 8.6"/>',
    'asteroids': '<path d="M8.5 4.5l6.2-1 4.8 4.2-1.2 6.8-5.6 4.5-6.4-1.8-2.3-6.2 4.5-6.5z"/><circle cx="10" cy="10" r="1.2"/><circle cx="14.5" cy="13.5" r="1.6"/>',
    'kuiper': '<path d="M12 2v20M4.9 4.9l14.2 14.2M2 12h20M4.9 19.1L19.1 4.9"/><circle cx="12" cy="12" r="3"/>',
    'dwarf': '<circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="8.5" stroke-dasharray="2 3"/><circle cx="19.2" cy="7.5" r="1.3" fill="currentColor"/>',
    'comets': '<circle cx="7" cy="17" r="3"/><path d="M9.3 14.7L20.5 3.5M10 17.5l9.5-5.5M6.5 14l5.5-9.5"/>',
    'spacecraft': '<circle cx="12" cy="12" r="2.6"/><path d="M9.4 12H3v-2.5h4.5M9.4 12H3v2.5h4.5M14.6 12H21v-2.5h-4.5M14.6 12H21v2.5h-4.5M12 9.4V5M9.5 5h5"/>',
    'meteors': '<path d="M21 3l-9.5 9.5M17 3l-5 5M21 7l-5 5"/><path d="M9 12.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5z"/>',
    'trails': '<circle cx="18.5" cy="8.5" r="2.8"/><path d="M16 10.2C12.5 14 8 16.5 3 17"/><path d="M14.5 14.5c-3 2.2-6.5 3.6-10.5 4" stroke-dasharray="2.5 2.5"/>',
    'minimap': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12l6.2-6.2"/><circle cx="15.5" cy="14" r="1.2" fill="currentColor"/>',
    'snapshot': '<path d="M4 7h3l1.6-2h6.8L17 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"/><circle cx="12" cy="13" r="3.6"/>',
    'audio-on': '<path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/>',
    'audio-off': '<path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M22 9l-6 6M16 9l6 6"/>',
    'telemetry': '<path d="M2.5 12h4l2.4-6.5 4.2 13 2.6-6.5h5.8"/>',
    'shortcuts': '<rect x="2.5" y="5" width="19" height="14" rx="2.2"/><path d="M6.5 9h1.5M11.2 9h1.6M16 9h1.5M6.5 12.2h1.5M11.2 12.2h1.6M16 12.2h1.5M8 15.5h8"/>',
    'measure': '<path d="M3 20L20 3v17H3z"/><path d="M10.5 16.5h6v-6M7.5 19.5v-1.8M11 19.5v-1.8M14.5 19.5v-1.8"/>',
    'fullscreen': '<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/>',
    'target': '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>',
    'time': '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.8 1.8M9.5 2h5M12 2v3"/>',
    'layers': '<path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z"/><path d="M3 12l9 4.5 9-4.5M3 16.5L12 21l9-4.5"/>',
    'camera': '<path d="M3 16l13-7.5 2.5 4.3L5.5 20.3 3 16z"/><path d="M16 8.5l3.2-1.8 1.8 3.1-3.2 1.8M11.5 16.8L14 21M11.5 16.8L8.5 21"/>',
    'optics': '<path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2L12 3z"/><circle cx="18.5" cy="5.5" r="1.2"/>',
    'system': '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.08a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.08a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.08a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    'controls-sliders': '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2" fill="currentColor"/><circle cx="15" cy="12" r="2" fill="currentColor"/><circle cx="8" cy="18" r="2" fill="currentColor"/>',
    'plus': '<path d="M12 5v14M5 12h14"/>',
    'close': '<path d="M18 6L6 18M6 6l12 12"/>',
    'calendar': '<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M16 2.5v4M8 2.5v4M3 9.5h18"/>',
    'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    'play': '<path d="M7 5.5l11 6.5-11 6.5V5.5z" fill="currentColor"/>',
    'pause': '<rect x="6.5" y="5.5" width="3.5" height="13" rx="0.8" fill="currentColor"/><rect x="14" y="5.5" width="3.5" height="13" rx="0.8" fill="currentColor"/>',
    'globe': '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    'sun': '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"/>',
    'earth': '<circle cx="12" cy="12" r="9"/><path d="M4.5 9.5c2.5 0 3.5-2 6-2s2.5 2.5 1.5 4.5-2.5 2-2 4.5M16 5.5c-1 2 0 3.5 1.8 4.5s2.5 1 2.7 2.5"/>',
    'planet': '<circle cx="12" cy="12" r="5.2"/><ellipse cx="12" cy="12" rx="10" ry="3.4" transform="rotate(-22 12 12)"/>',
    'rocket': '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    'headphones': '<path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/>',
    'info': '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4.5M12 8h.01"/>',
    'lock': '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    'reset': '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    'check': '<path d="M20 6L9 17l-5-5"/>'
};

export function svgIcon(name: SvgIconName, className: string = 'obs-svg-icon'): string {
    const inner = ICON_PATHS[name] || ICON_PATHS.planet;
    return `<svg class="${className}" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" data-icon="${name}">${inner}</svg>`;
}

/**
 * Strips leading non-ASCII pictographs/emojis so localized strings like "🔭 Camera Controls"
 * can be paired cleanly with monochrome vector icons without duplicate symbols.
 */
export function stripLeadingEmoji(label: string): string {
    return label.replace(/^[\p{Extended_Pictographic}\uFE0F\u200D]+\s*/u, '').trim();
}
