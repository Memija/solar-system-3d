import { CelestialBodyData, MoonData, StarData, ConstellationData, CometData, SpacecraftData, SolarSystemData } from './SolarSystemData';
import { i18n } from '../i18n/index';
import { EventBus } from './EventBus';
import { AudioNarrator } from './AudioNarrator';

type ModalData = CelestialBodyData | MoonData | StarData | ConstellationData | CometData | SpacecraftData;

export interface CustomModalData {
    name: string;
    description: string;
    images?: string[];
    imageUrl?: string;
    links?: any[];
}

export class Modal {
    container: HTMLElement;
    modalElement: HTMLElement;
    contentElement: HTMLElement;
    tooltipElement: HTMLElement;
    public audioNarrator: AudioNarrator;
    private audioGuideBtn: HTMLButtonElement | null = null;
    public isOpen: boolean = false;
    private currentData: ModalData | CustomModalData | null = null;
    private unregisterI18n: (() => void) | null = null;
    private hideTooltipHandler: () => void;

    constructor(container: HTMLElement) {
        this.container = container;
        this.audioNarrator = new AudioNarrator();
        this.modalElement = this.createModal();
        this.contentElement = this.modalElement.querySelector('#modal-content') as HTMLElement;
        this.tooltipElement = this.createTooltipModal();

        // Listen for language changes to immediately re-render active modal
        this.unregisterI18n = i18n.onLanguageChange(() => {
            if (this.isOpen && this.currentData) {
                this.show(this.currentData);
            }
        });

        // Hide tooltip when clicking anywhere else (handle touch and click)
        this.hideTooltipHandler = () => {
            if (this.tooltipElement.style.display === 'block') {
                this.tooltipElement.style.display = 'none';
            }
        };
        document.addEventListener('click', this.hideTooltipHandler);
        document.addEventListener('touchstart', this.hideTooltipHandler, { passive: true });
    }

    private createTooltipModal(): HTMLElement {
        const tooltip = document.createElement('div');
        tooltip.className = 'modal-tooltip';
        this.container.appendChild(tooltip);
        return tooltip;
    }

    private createModal(): HTMLElement {
        const modal = document.createElement('div');
        modal.className = 'dossier-modal';
        modal.style.display = 'none';

        // Drag handle for mobile bottom sheet
        const dragHandle = document.createElement('div');
        dragHandle.className = 'sheet-drag-handle';
        modal.appendChild(dragHandle);

        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        dragHandle.addEventListener('touchstart', (e: TouchEvent) => {
            if (e.touches.length > 0) {
                startY = e.touches[0].clientY;
                currentY = startY;
                isDragging = true;
            }
        }, { passive: true });

        dragHandle.addEventListener('touchmove', (e: TouchEvent) => {
            if (!isDragging || e.touches.length === 0) return;
            currentY = e.touches[0].clientY;
            const delta = currentY - startY;
            if (delta > 0) {
                modal.style.transform = `translateY(${delta}px)`;
            }
        }, { passive: true });

        const endDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            const delta = currentY - startY;
            if (delta > 70) {
                this.hide();
            }
            modal.style.transform = '';
        };

        dragHandle.addEventListener('touchend', endDrag);
        dragHandle.addEventListener('touchcancel', endDrag);

        // Audio Guide narration button
        const audioGuideBtn = document.createElement('button');
        audioGuideBtn.className = 'modal-audio-guide-btn';
        audioGuideBtn.innerHTML = `🎙️ <span class="audio-guide-label">${i18n.t('modal.audioGuide') || 'Listen'}</span>`;
        audioGuideBtn.title = 'Audio Guide Narration';
        audioGuideBtn.setAttribute('aria-label', 'Listen to celestial audio guide');
        audioGuideBtn.onclick = () => {
            if (this.currentData) {
                const desc = (this.contentElement.querySelector('.description')?.textContent) || this.currentData.description || '';
                const title = (this.contentElement.querySelector('h2')?.textContent) || this.currentData.name || '';
                const fullText = `${title}. ${desc}`;
                const activeLang = i18n.currentLanguage || 'en';
                const isSpeaking = this.audioNarrator.toggle(fullText, activeLang, () => {
                    this.updateAudioGuideButtonLabel(false);
                });
                this.updateAudioGuideButtonLabel(isSpeaking);
            }
        };
        modal.appendChild(audioGuideBtn);
        this.audioGuideBtn = audioGuideBtn;

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close-btn';
        closeBtn.innerHTML = '&times;';
        closeBtn.setAttribute('aria-label', 'Close');
        closeBtn.onclick = () => {
            this.hide();
        };
        modal.appendChild(closeBtn);

        // Content Container
        const content = document.createElement('div');
        content.id = 'modal-content';
        modal.appendChild(content);

        this.container.appendChild(modal);
        return modal;
    }

    private formatImageUrl(url: string): string {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
            return url;
        }
        const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
        const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
        return `${base}${cleanUrl}`;
    }

    private getGalleryHtml(data: ModalData | CustomModalData): string {
        if (data.images && data.images.length > 0) {
            return `
                <div class="gallery-container">
                    ${data.images.map((img: string, index: number) => `
                        <img src="${this.formatImageUrl(img)}" alt="${data.name} visual ${index + 1}" class="gallery-img" data-index="${index}" style="opacity: ${index === 0 ? 1 : 0};">
                    `).join('')}

                    ${data.images.length > 1 ? `
                        <button class="gallery-btn prev-btn">❮</button>
                        <button class="gallery-btn next-btn">❯</button>
                    ` : ''}
                </div>
            `;
        } else if (data.imageUrl) {
            return `<div class="gallery-container"><img src="${this.formatImageUrl(data.imageUrl)}" alt="${data.name}" class="gallery-img" style="opacity: 1;"></div>`;
        }
        return '';
    }

    private getLinksHtml(data: ModalData | CustomModalData): string {
        if (data.links && data.links.length > 0) {
            const sortedLinks = [...data.links].sort((a, b) => a.title.localeCompare(b.title));
            return `
                <div class="modal-links-section">
                    <h4>${i18n.t('modal.resourcesHeader')}</h4>
                    <ul>
                        ${sortedLinks.map((link: any) => `
                            <li>
                                <a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.title} ↗</a>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }
        return '';
    }

    private formatPeriodText(years: number): string {
        const yr = i18n.t('modal.periodUnits.year');
        const m = i18n.t('modal.periodUnits.month');
        const d = i18n.t('modal.periodUnits.day');

        if (years >= 1 || years === 0) {
            return `${years} ${yr}`;
        }

        const totalDays = years * 365.25;
        const months = Math.floor(totalDays / 30.4375);
        const days = Math.round(totalDays - (months * 30.4375));

        const parts = [];
        if (months > 0) {
            parts.push(`${months}${m}`);
        }
        if (days > 0) {
            parts.push(`${days}${d}`);
        }

        if (parts.length === 0) {
            return `${years} ${yr}`;
        }

        return `${parts.join(' ')}`;
    }

    private getExtraInfo(data: ModalData | CustomModalData): string {
        let stats: { label: string; value: string; tooltipTitle: string; tooltipText: string }[] = [];
        let additionalHtml = '';

        const createChip = (label: string, value: string, tooltipTitle: string, tooltipText: string) => `
            <div class="stat-chip">
                <div class="stat-label-wrap">
                    <span class="stat-label">${label}</span>
                    <span class="info-btn gui-info-icon" data-title="${tooltipTitle}" data-text="${tooltipText}">i</span>
                </div>
                <span class="stat-value">${value}</span>
            </div>
        `;

        if ('targetBody' in data || 'escaping' in data) {
            stats.push({
                label: i18n.t('modal.labels.type'),
                value: i18n.t('modal.labels.spacecraftType'),
                tooltipTitle: i18n.t('modal.tooltipTitles.spacecraft'),
                tooltipText: i18n.t('modal.tooltips.spacecraft')
            });

            if ('launchDate' in data && data.launchDate && (data.name === 'Sputnik 1' || data.name === 'Apollo 11')) {
                additionalHtml += `<button class="jump-to-date-btn" data-date="${data.launchDate}">${i18n.t('ui.jumpToDate', { date: data.launchDate })}</button>`;
            }
        }

        if ('ra' in data && data.ra !== undefined && 'dec' in data && data.dec !== undefined) {
            stats.push({
                label: i18n.t('modal.labels.rightAsc'),
                value: `${data.ra}h`,
                tooltipTitle: i18n.t('modal.tooltipTitles.rightAsc'),
                tooltipText: i18n.t('modal.tooltips.rightAsc')
            });
            stats.push({
                label: i18n.t('modal.labels.declination'),
                value: `${data.dec}°`,
                tooltipTitle: i18n.t('modal.tooltipTitles.declination'),
                tooltipText: i18n.t('modal.tooltips.declination')
            });
        }

        if ('semiMajorAxis' in data) {
            const comet = data as CometData;
            const displayRadius = comet.displayRadius !== undefined ? comet.displayRadius : comet.radius;
            stats.push({ label: i18n.t('modal.labels.radius'), value: `${displayRadius} R⊕`, tooltipTitle: i18n.t('modal.tooltipTitles.radius'), tooltipText: i18n.t('modal.tooltips.radiusEarth') });
            stats.push({ label: i18n.t('modal.labels.semiMajorAxis'), value: `${comet.semiMajorAxis} AU`, tooltipTitle: i18n.t('modal.tooltipTitles.semiMajorAxis'), tooltipText: i18n.t('modal.tooltips.semiMajorAxis') });
            stats.push({ label: i18n.t('modal.labels.eccentricity'), value: `${comet.eccentricity}`, tooltipTitle: i18n.t('modal.tooltipTitles.eccentricity'), tooltipText: i18n.t('modal.tooltips.eccentricity') });
            stats.push({ label: i18n.t('modal.labels.period'), value: this.formatPeriodText(comet.period), tooltipTitle: i18n.t('modal.tooltipTitles.period'), tooltipText: i18n.t('modal.tooltips.cometPeriod') });
        } else if ('radius' in data) {
            const body = data as CelestialBodyData;
            const displayRadius = body.displayRadius !== undefined ? body.displayRadius : body.radius;

            let isMoon = false;
            for (const planet of SolarSystemData) {
                if (planet.moons && planet.moons.find(m => m.name === body.name)) {
                    isMoon = true;
                    break;
                }
            }

            const displayDistance = body.distanceAU ?? body.distance;
            stats.push({ label: i18n.t('modal.labels.radius'), value: `${displayRadius} R⊕`, tooltipTitle: i18n.t('modal.tooltipTitles.radius'), tooltipText: i18n.t('modal.tooltips.radiusEarth') });
            stats.push({ label: i18n.t('modal.labels.distance'), value: `${displayDistance} AU`, tooltipTitle: i18n.t('modal.tooltipTitles.distance'), tooltipText: isMoon ? i18n.t('modal.tooltips.distPlanet') : i18n.t('modal.tooltips.distSun') });
            stats.push({ label: i18n.t('modal.labels.period'), value: this.formatPeriodText(body.period), tooltipTitle: i18n.t('modal.tooltipTitles.period'), tooltipText: isMoon ? i18n.t('modal.tooltips.orbitPlanet') : i18n.t('modal.tooltips.orbitSun') });
            if (body.axialTilt !== undefined) {
                stats.push({ label: i18n.t('modal.labels.axialTilt'), value: `${body.axialTilt}°`, tooltipTitle: i18n.t('modal.tooltipTitles.axialTilt'), tooltipText: i18n.t('modal.tooltips.axialTilt') });
            }
        } else if ('stars' in data && 'connections' in data) {
            const constellation = data as ConstellationData;
            if (constellation.stars && constellation.stars.length > 0) {
                stats.push({ label: i18n.t('modal.labels.stars'), value: `${constellation.stars.length}`, tooltipTitle: i18n.t('modal.tooltipTitles.stars'), tooltipText: i18n.t('modal.tooltips.constellationStars') });
            }
            if (constellation.brightestStar) {
                stats.push({ label: i18n.t('modal.labels.brightest'), value: `${constellation.brightestStar}`, tooltipTitle: i18n.t('modal.tooltipTitles.brightest'), tooltipText: i18n.t('modal.tooltips.brightestStar') });
            }
            if (constellation.area) {
                stats.push({ label: i18n.t('modal.labels.area'), value: `${constellation.area} sq°`, tooltipTitle: i18n.t('modal.tooltipTitles.area'), tooltipText: i18n.t('modal.tooltips.constellationArea') });
            }
            if (constellation.family) {
                const familyName = i18n.getConstellationFamily(constellation.name, constellation.family);
                stats.push({ label: i18n.t('modal.labels.family'), value: `${familyName}`, tooltipTitle: i18n.t('modal.tooltipTitles.family'), tooltipText: i18n.t('modal.tooltips.constellationFamily') });
            }
        }

        let gridHtml = '';
        if (stats.length > 0) {
            gridHtml = `<div class="telemetry-grid">${stats.map(s => createChip(s.label, s.value, s.tooltipTitle, s.tooltipText)).join('')}</div>`;
        }

        return gridHtml + additionalHtml;
    }

    private setupGalleryLogic(data: ModalData | CustomModalData) {
        if (data.images && data.images.length > 1) {
            let currentIndex = 0;
            const images = this.contentElement.querySelectorAll('.gallery-img') as NodeListOf<HTMLElement>;
            const prevBtn = this.contentElement.querySelector('.prev-btn') as HTMLElement;
            const nextBtn = this.contentElement.querySelector('.next-btn') as HTMLElement;

            const showImage = (index: number) => {
                images.forEach((img, i) => {
                    img.style.opacity = i === index ? '1' : '0';
                });
            };

            if (prevBtn) prevBtn.onclick = () => {
                currentIndex = (currentIndex - 1 + images.length) % images.length;
                showImage(currentIndex);
            };

            if (nextBtn) nextBtn.onclick = () => {
                currentIndex = (currentIndex + 1) % images.length;
                showImage(currentIndex);
            };
        }
    }

    private positionTooltip(btn: HTMLElement) {
        const title = btn.getAttribute('data-title') || '';
        const text = btn.getAttribute('data-text') || '';

        this.tooltipElement.innerHTML = `<strong>${title}</strong>${text}`;
        this.tooltipElement.style.display = 'block';

        const rect = btn.getBoundingClientRect();

        let top = rect.top - this.tooltipElement.offsetHeight - 10;
        let left = rect.left - (this.tooltipElement.offsetWidth / 2) + (rect.width / 2);

        if (top < 0) {
            top = rect.bottom + 10;
        }

        if (left + this.tooltipElement.offsetWidth > window.innerWidth) {
            left = window.innerWidth - this.tooltipElement.offsetWidth - 10;
        }

        if (left < 0) {
            left = 10;
        }

        this.tooltipElement.style.top = `${top}px`;
        this.tooltipElement.style.left = `${left}px`;
    }

    private setupJumpToDateButtons() {
        const jumpToDateButtons = this.contentElement.querySelectorAll('.jump-to-date-btn') as NodeListOf<HTMLElement>;

        jumpToDateButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const dateStr = btn.getAttribute('data-date');
                if (dateStr) {
                    EventBus.emit('jump-to-date', dateStr);
                }
            });
        });
    }

    private setupInfoButtons() {
        const infoButtons = this.contentElement.querySelectorAll('.info-btn') as NodeListOf<HTMLElement>;

        infoButtons.forEach(btn => {
            let isTouch = false;

            btn.addEventListener('touchstart', () => {
                isTouch = true;
            }, { passive: true });

            btn.addEventListener('mouseenter', () => {
                if (!isTouch) {
                    this.positionTooltip(btn);
                }
            });

            btn.addEventListener('mouseleave', () => {
                if (!isTouch) {
                    this.tooltipElement.style.display = 'none';
                }
            });

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (isTouch) {
                    const title = btn.getAttribute('data-title') || '';
                    const isCurrentlyShowing = this.tooltipElement.style.display === 'block' && this.tooltipElement.innerHTML.includes(title);

                    if (isCurrentlyShowing) {
                        this.tooltipElement.style.display = 'none';
                    } else {
                        this.positionTooltip(btn);
                    }
                } else {
                    this.positionTooltip(btn);
                }
            });
        });
    }

    public show(data: ModalData | CustomModalData) {
        if (!this.contentElement) return;

        this.isOpen = true;
        this.currentData = data;

        let badgeLabel = i18n.t('modal.badges.celestialBody');
        if ('targetBody' in data || 'escaping' in data) badgeLabel = i18n.t('modal.badges.missionDossier');
        else if ('semiMajorAxis' in data) badgeLabel = i18n.t('modal.badges.cometTelemetry');
        else if ('stars' in data && 'connections' in data) badgeLabel = i18n.t('modal.badges.constellation');
        else if ('ra' in data && 'dec' in data) badgeLabel = i18n.t('modal.badges.stellarDossier');
        else if ('radius' in data) {
            let isMoon = false;
            for (const p of SolarSystemData) {
                if (p.moons && p.moons.find(m => m.name === data.name)) { isMoon = true; break; }
            }
            badgeLabel = isMoon ? i18n.t('modal.badges.lunarTelemetry') : (data.name === 'Sun' ? i18n.t('modal.badges.stellarCore') : i18n.t('modal.badges.planetaryDossier'));
        }

        let displayName = data.name;
        let displayDesc = data.description;
        if ('targetBody' in data || 'escaping' in data) {
            displayName = i18n.getSpacecraftName(data.name);
            displayDesc = i18n.getSpacecraftDescription(data.name, data.description);
        } else if ('semiMajorAxis' in data) {
            displayName = i18n.getCometName(data.name);
            displayDesc = i18n.getCometDescription(data.name, data.description);
        } else if ('stars' in data && 'connections' in data) {
            displayName = i18n.getConstellationName(data.name);
            displayDesc = i18n.getConstellationDescription(data.name, data.description);
        } else if ('ra' in data && 'dec' in data) {
            displayName = i18n.getStarName(data.name);
            displayDesc = i18n.getStarDescription(data.name, data.description);
        } else {
            displayName = i18n.getBodyName(data.name);
            displayDesc = i18n.getBodyDescription(data.name, data.description);
        }

        const galleryHtml = this.getGalleryHtml(data);
        const linksHtml = this.getLinksHtml(data);
        const extraInfo = this.getExtraInfo(data);

        this.contentElement.innerHTML = `
            <div class="modal-header-badge">❖ ${badgeLabel}</div>
            <h2>${displayName}</h2>
            ${galleryHtml}
            <p class="description">${displayDesc || i18n.t('modal.noDescription')}</p>
            ${extraInfo}
            ${linksHtml}
        `;

        this.setupGalleryLogic(data);
        this.setupInfoButtons();
        this.setupJumpToDateButtons();
        this.audioNarrator.stop();
        this.updateAudioGuideButtonLabel(false);
        this.modalElement.style.display = 'block';
    }

    public hide() {
        this.isOpen = false;
        this.currentData = null;
        this.audioNarrator.stop();
        this.updateAudioGuideButtonLabel(false);
        this.modalElement.style.display = 'none';
        this.tooltipElement.style.display = 'none';
    }

    private updateAudioGuideButtonLabel(isSpeaking: boolean): void {
        if (!this.audioGuideBtn) return;
        const listenLabel = i18n.t('modal.audioGuide') || 'Listen';
        const playingLabel = i18n.t('modal.audioPlaying') || 'Playing...';
        this.audioGuideBtn.classList.toggle('speaking', isSpeaking);
        this.audioGuideBtn.innerHTML = isSpeaking
            ? `🔊 <span class="audio-guide-label">${playingLabel}</span>`
            : `🎙️ <span class="audio-guide-label">${listenLabel}</span>`;
    }

    public dispose() {
        this.hide();
        this.audioNarrator.dispose();
        if (this.unregisterI18n) {
            this.unregisterI18n();
            this.unregisterI18n = null;
        }
        document.removeEventListener('click', this.hideTooltipHandler);
        document.removeEventListener('touchstart', this.hideTooltipHandler);
        if (this.modalElement.parentElement) {
            this.modalElement.parentElement.removeChild(this.modalElement);
        }
        if (this.tooltipElement.parentElement) {
            this.tooltipElement.parentElement.removeChild(this.tooltipElement);
        }
    }
}
