import { CelestialBodyData, MoonData, StarData, ConstellationData, CometData } from './SolarSystemData.js';

export class Modal {
    container: HTMLElement;
    modalElement: HTMLElement;
    contentElement: HTMLElement;
    tooltipElement: HTMLElement;

    constructor(container: HTMLElement) {
        this.container = container;
        this.modalElement = this.createModal();
        this.contentElement = this.modalElement.querySelector('#modal-content') as HTMLElement;
        this.tooltipElement = this.createTooltipModal();

        // Hide tooltip when clicking anywhere else (handle touch and click)
        const hideTooltip = () => {
            if (this.tooltipElement.style.display === 'block') {
                this.tooltipElement.style.display = 'none';
            }
        };
        document.addEventListener('click', hideTooltip);
        document.addEventListener('touchstart', hideTooltip, { passive: true });
    }

    private createTooltipModal(): HTMLElement {
        const tooltip = document.createElement('div');
        tooltip.style.position = 'absolute';
        tooltip.style.backgroundColor = 'rgba(10, 10, 15, 0.95)';
        tooltip.style.border = '1px solid #666';
        tooltip.style.borderRadius = '6px';
        tooltip.style.padding = '10px';
        tooltip.style.color = '#fff';
        tooltip.style.display = 'none';
        tooltip.style.zIndex = '1001'; // Above main modal
        tooltip.style.boxShadow = '0 0 10px rgba(0,0,0,0.8)';
        tooltip.style.maxWidth = '250px';
        tooltip.style.fontSize = '0.85em';
        tooltip.style.lineHeight = '1.4';
        tooltip.style.pointerEvents = 'none'; // Prevent tooltip from interfering with hovers

        this.container.appendChild(tooltip);
        return tooltip;
    }

    private createModal(): HTMLElement {
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.right = '20px'; // Side positioning
        modal.style.transform = 'translateY(-50%)'; // Only center vertically
        modal.style.width = '350px';
        modal.style.backgroundColor = 'rgba(20, 20, 30, 0.95)';
        modal.style.border = '1px solid #444';
        modal.style.borderRadius = '12px';
        modal.style.padding = '20px';
        modal.style.color = '#fff';
        modal.style.display = 'none';
        modal.style.zIndex = '1000';
        modal.style.boxShadow = '0 0 20px rgba(0,0,0,0.8)';

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '10px';
        closeBtn.style.right = '15px';
        closeBtn.style.background = 'none';
        closeBtn.style.border = 'none';
        closeBtn.style.color = '#fff';
        closeBtn.style.fontSize = '24px';
        closeBtn.style.cursor = 'pointer';
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

    private getGalleryHtml(data: CelestialBodyData | MoonData | StarData | ConstellationData | CometData): string {
        if (data.images && data.images.length > 0) {
            return `
                <div class="gallery-container" style="position: relative; width: 100%; height: 200px; overflow: hidden; border-radius: 8px; margin: 10px 0; background: #000;">
                    ${data.images.map((img: string, index: number) => `
                        <img src="${img}" class="gallery-img" data-index="${index}" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; opacity: ${index === 0 ? 1 : 0}; transition: opacity 0.5s;">
                    `).join('')}

                    ${data.images.length > 1 ? `
                        <button class="prev-btn" style="position: absolute; top: 50%; left: 10px; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; font-size: 24px; cursor: pointer; padding: 5px 10px; border-radius: 50%;">❮</button>
                        <button class="next-btn" style="position: absolute; top: 50%; right: 10px; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; font-size: 24px; cursor: pointer; padding: 5px 10px; border-radius: 50%;">❯</button>
                    ` : ''}
                </div>
            `;
        } else if (data.imageUrl) {
            return `<img src="${data.imageUrl}" alt="${data.name}" style="width: 100%; border-radius: 8px; margin: 10px 0;">`;
        }
        return '';
    }

    private getLinksHtml(data: CelestialBodyData | MoonData | StarData | ConstellationData | CometData): string {
        if (data.links && data.links.length > 0) {
            const sortedLinks = [...data.links].sort((a, b) => a.title.localeCompare(b.title));
            return `
                <div style="margin-top: 15px; border-top: 1px solid #444; padding-top: 10px;">
                    <h4 style="margin: 0 0 5px 0; font-size: 0.9em; color: #aaa;">Learn More:</h4>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        ${sortedLinks.map((link: any) => `
                            <li style="margin-bottom: 5px;">
                                <a href="${link.url}" target="_blank" style="color: #4da6ff; text-decoration: none; font-size: 0.9em;">${link.title} ↗</a>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }
        return '';
    }

    private getExtraInfo(data: CelestialBodyData | MoonData | StarData | ConstellationData | CometData): string {
        let info = '';

        const createInfoButton = (title: string, text: string) => {
            return `<span class="info-btn" data-title="${title}" data-text="${text}" style="cursor: help; background: #444; color: #fff; border-radius: 50%; display: inline-block; width: 16px; height: 16px; text-align: center; line-height: 16px; font-size: 12px; margin-right: 5px;">i</span>`;
        };

        if ('ra' in data && data.ra !== undefined && 'dec' in data && data.dec !== undefined) {
            info += `<p style="display: flex; align-items: center;">${createInfoButton("Right Ascension (RA)", "The celestial equivalent of terrestrial longitude. Measured in hours (h).")}<strong>RA:</strong>&nbsp;${data.ra}h&nbsp;&nbsp;|&nbsp;&nbsp;${createInfoButton("Declination (Dec)", "The celestial equivalent of terrestrial latitude. Measured in degrees (°).")}<strong>Dec:</strong>&nbsp;${data.dec}°</p>`;
        }

        if ('semiMajorAxis' in data) {
            const comet = data as CometData;
            info += `<p style="display: flex; align-items: center;">${createInfoButton("Semi-Major Axis", "One half of the major axis of the elliptical orbit; essentially the average distance from the Sun.")}<strong>Semi-Major Axis:</strong>&nbsp;${comet.semiMajorAxis} AU</p>
                     <p style="display: flex; align-items: center;">${createInfoButton("Eccentricity", "A measure of how much an elliptical orbit deviates from a perfect circle. 0 is a circle, closer to 1 is a highly elongated ellipse.")}<strong>Eccentricity:</strong>&nbsp;${comet.eccentricity}</p>
                     <p style="display: flex; align-items: center;">${createInfoButton("Orbital Period", "The time a given astronomical object takes to complete one orbit around another object.")}<strong>Orbital Period:</strong>&nbsp;${comet.period} years</p>`;
        } else if ('radius' in data) {
            info += `<p style="display: flex; align-items: center;">${createInfoButton("Radius", "The distance from the center of the object to its surface, relative to Earth's radius.")}<strong>Radius:</strong>&nbsp;${(data as CelestialBodyData).radius} (relative)</p>
                     <p style="display: flex; align-items: center;">${createInfoButton("Distance", "The average distance from the Sun, measured in Astronomical Units (AU). One AU is the average distance from Earth to the Sun.")}<strong>Distance:</strong>&nbsp;${(data as CelestialBodyData).distance} AU</p>
                     <p style="display: flex; align-items: center;">${createInfoButton("Period", "The time it takes for the object to complete one full orbit around the Sun, measured in Earth years.")}<strong>Period:</strong>&nbsp;${(data as CelestialBodyData).period} years</p>`;
        }

        return info;
    }

    private setupGalleryLogic(data: CelestialBodyData | MoonData | StarData | ConstellationData | CometData) {
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

        this.tooltipElement.innerHTML = `<strong>${title}</strong><br/>${text}`;
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

    public show(data: CelestialBodyData | MoonData | StarData | ConstellationData | CometData) {
        if (!this.contentElement) return;

        const galleryHtml = this.getGalleryHtml(data);
        const linksHtml = this.getLinksHtml(data);
        const extraInfo = this.getExtraInfo(data);

        this.contentElement.innerHTML = `
            <h2 style="margin-top: 0; border-bottom: 1px solid #666; padding-bottom: 10px;">${data.name}</h2>
            ${galleryHtml}
            <p style="line-height: 1.5; font-size: 0.95em;">${data.description || 'No description available.'}</p>
            <div style="margin-top: 10px; font-size: 0.9em; color: #aaa;">
                ${extraInfo}
            </div>
            ${linksHtml}
        `;

        this.setupGalleryLogic(data);
        this.setupInfoButtons();
        this.modalElement.style.display = 'block';
    }

    public hide() {
        this.modalElement.style.display = 'none';
        this.tooltipElement.style.display = 'none';
    }
}
