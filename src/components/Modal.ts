import { CelestialBodyData, MoonData, StarData } from './SolarSystemData.js';

export class Modal {
    container: HTMLElement;
    modalElement: HTMLElement;
    contentElement: HTMLElement;

    constructor(container: HTMLElement) {
        this.container = container;
        this.modalElement = this.createModal();
        this.contentElement = this.modalElement.querySelector('#modal-content') as HTMLElement;
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

    public show(data: CelestialBodyData | MoonData | StarData | any) {
        if (!this.contentElement) return;

        // --- Image Gallery ---
        let galleryHtml = '';
        if (data.images && data.images.length > 0) {
            // Create a simple carousel structure
            galleryHtml = `
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
            galleryHtml = `<img src="${data.imageUrl}" alt="${data.name}" style="width: 100%; border-radius: 8px; margin: 10px 0;">`;
        }

        // --- Links Section ---
        let linksHtml = '';
        if (data.links && data.links.length > 0) {
            linksHtml = `
                <div style="margin-top: 15px; border-top: 1px solid #444; padding-top: 10px;">
                    <h4 style="margin: 0 0 5px 0; font-size: 0.9em; color: #aaa;">Learn More:</h4>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        ${data.links.map((link: any) => `
                            <li style="margin-bottom: 5px;">
                                <a href="${link.url}" target="_blank" style="color: #4da6ff; text-decoration: none; font-size: 0.9em;">${link.title} ↗</a>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        // --- Stats Section ---
        let extraInfo = '';
        if (data.ra !== undefined && data.dec !== undefined) {
            extraInfo = `<p>RA: ${data.ra}h | Dec: ${data.dec}°</p>`;
        } else {
            extraInfo = `
                <p><strong>Radius:</strong> ${data.radius} (relative)</p>
                <p><strong>Distance:</strong> ${data.distance} AU</p>
                <p><strong>Period:</strong> ${data.period} years</p>
            `;
        }

        this.contentElement.innerHTML = `
            <h2 style="margin-top: 0; border-bottom: 1px solid #666; padding-bottom: 10px;">${data.name}</h2>
            ${galleryHtml}
            <p style="line-height: 1.5; font-size: 0.95em;">${data.description || 'No description available.'}</p>
            <div style="margin-top: 10px; font-size: 0.9em; color: #aaa;">
                ${extraInfo}
            </div>
            ${linksHtml}
        `;

        // --- Gallery Logic ---
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

        this.modalElement.style.display = 'block';
    }

    public hide() {
        this.modalElement.style.display = 'none';
    }
}
