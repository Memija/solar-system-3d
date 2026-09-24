import { describe, it, expect, beforeEach } from 'vitest';
import { i18n } from '../../i18n/index';
import { EventBus } from '../EventBus';

describe('Measurement Localization', () => {
    beforeEach(() => {
        i18n.setLanguage('en');
    });

    it('has measurement keys populated across all 6 locales', () => {
        const locales = ['en', 'bs', 'de', 'sr', 'pl', 'id'] as const;

        for (const lang of locales) {
            i18n.setLanguage(lang);

            const measureTool = i18n.t('controls.measureTool');
            const measureMode = i18n.t('controls.measureMode');
            const distLabel = i18n.t('measurement.distLabel');
            const unitAU = i18n.t('measurement.unitAU');
            const unitMkm = i18n.t('measurement.unitMkm');
            const selectFirst = i18n.t('measurement.selectFirstPrompt');
            const selectSecond = i18n.t('measurement.selectSecondPrompt');
            const measuredPrompt = i18n.t('measurement.measuredDistancePrompt', {
                bodyA: 'Earth',
                bodyB: 'Mars',
                distanceAU: '0.52',
                unitAU: unitAU,
                distanceMkm: '78.3',
                unitMkm: unitMkm,
            });
            const clear = i18n.t('measurement.clear');
            const close = i18n.t('measurement.close');

            expect(measureTool).toBeTruthy();
            expect(measureMode).toBeTruthy();
            // Verify measureTool and measureMode are distinct in each language
            expect(measureTool).not.toBe(measureMode);

            expect(distLabel).toBeTruthy();
            expect(unitAU).toBeTruthy();
            expect(unitMkm).toBeTruthy();
            expect(selectFirst).toBeTruthy();
            expect(selectSecond).toBeTruthy();
            expect(measuredPrompt).toContain('Earth');
            expect(measuredPrompt).toContain('Mars');
            expect(clear).toBeTruthy();
            expect(close).toBeTruthy();
        }
    });

    it('formats numbers according to active locale', () => {
        const opts = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

        // In English: 1.52
        i18n.setLanguage('en');
        expect(i18n.formatNumber(1.52, opts)).toBe('1.52');

        // In German: 1,52
        i18n.setLanguage('de');
        expect(i18n.formatNumber(1.52, opts)).toBe('1,52');

        // In Bosnian: 1,52
        i18n.setLanguage('bs');
        expect(i18n.formatNumber(1.52, opts)).toBe('1,52');

        // In Polish: 1,52
        i18n.setLanguage('pl');
        expect(i18n.formatNumber(1.52, opts)).toBe('1,52');
    });

    it('produces correct localized measurement string in each language', () => {
        const testDistance = (lang: 'en' | 'bs' | 'de' | 'sr' | 'pl' | 'id', distanceAU: number, distanceMkm: number) => {
            i18n.setLanguage(lang);
            const auFormatted = i18n.formatNumber(distanceAU, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const mkmFormatted = i18n.formatNumber(distanceMkm, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
            const unitAU = i18n.t('measurement.unitAU');
            const unitMkm = i18n.t('measurement.unitMkm');
            return i18n.t('measurement.distLabel', {
                au: auFormatted,
                mkm: mkmFormatted,
                unitAU,
                unitMkm
            });
        };

        // English
        expect(testDistance('en', 1.52, 227.9)).toBe('Dist: 1.52 AU / 227.9 Mkm');

        // German
        expect(testDistance('de', 1.52, 227.9)).toBe('Abstand: 1,52 AE / 227,9 Mio. km');

        // Bosnian
        expect(testDistance('bs', 1.52, 227.9)).toBe('Udaljenost: 1,52 AJ / 227,9 mil. km');

        // Serbian
        expect(testDistance('sr', 1.52, 227.9)).toBe('Удаљеност: 1,52 АЈ / 227,9 мил. км');

        // Polish
        expect(testDistance('pl', 1.52, 227.9)).toBe('Odległość: 1,52 j.a. / 227,9 mln km');

        // Indonesian
        expect(testDistance('id', 1.52, 227.9)).toBe('Jarak: 1,52 SA / 227,9 jt km');
    });

    it('handles EventBus measurement events', () => {
        let modeActive = false;
        const modeListener = (data: { active: boolean; targetA?: any; targetB?: any }) => {
            modeActive = data.active;
        };
        EventBus.on('measure-mode-changed', modeListener);

        EventBus.emit('measure-mode-changed', { active: true });
        expect(modeActive).toBe(true);

        EventBus.emit('measure-mode-changed', { active: false });
        expect(modeActive).toBe(false);

        EventBus.off('measure-mode-changed', modeListener);

        let receivedTargetA: any = null;
        let receivedTargetB: any = null;
        const targetsListener = (data: { targetA?: any; targetB?: any }) => {
            receivedTargetA = data.targetA;
            receivedTargetB = data.targetB;
        };
        EventBus.on('measure-targets-changed', targetsListener);

        EventBus.emit('measure-targets-changed', { targetA: { name: 'Earth' } });
        expect(receivedTargetA?.name).toBe('Earth');
        expect(receivedTargetB).toBeUndefined();

        EventBus.emit('measure-targets-changed', { targetA: { name: 'Earth' }, targetB: { name: 'Mars' } });
        expect(receivedTargetA?.name).toBe('Earth');
        expect(receivedTargetB?.name).toBe('Mars');

        EventBus.off('measure-targets-changed', targetsListener);
    });
});
