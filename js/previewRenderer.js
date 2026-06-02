function optimizeContent(data) {
    const optimized = { ...data };



    // 1. Deduplicate Skills (case-insensitive, remove trailing punctuation)
    if (optimized.skills) {
        const uniqueSkills = [];
        const seen = new Set();
        optimized.skills.forEach(s => {
            const clean = s.trim().toLowerCase().replace(/[.,!]$/, '');
            if (clean && !seen.has(clean)) {
                seen.add(clean);
                uniqueSkills.push(s.trim());
            }
        });
        optimized.skills = uniqueSkills;
    }

    // 2. Optimize Summary
    if (optimized.summary) {
        // Remove repetitive sentences
        const sentences = optimized.summary.split(/[.!?]\s+/);
        const uniqueSentences = [];
        const seenSentences = new Set();
        sentences.forEach(s => {
            const clean = s.trim().toLowerCase();
            if (clean && !seenSentences.has(clean)) {
                seenSentences.add(clean);
                uniqueSentences.push(s.trim());
            }
        });
        optimized.summary = uniqueSentences.join('. ');
    }

    // 3. Limit Experience/Projects bullets and convert long paragraphs
    const limitBullets = (desc) => {
        if (!desc) return '';
        let lines = desc.split('\n').map(l => l.trim()).filter(l => l);

        // If it's a single long paragraph without newlines, split by sentences
        if (lines.length === 1 && lines[0].length > 150) {
            lines = lines[0].split(/[.!?]\s+/).map(s => s.trim()).filter(s => s);
        }

        // Limit to 5 bullets max
        return lines.slice(0, 5).join('\n');
    };

    if (optimized.experience) {
        optimized.experience = optimized.experience.map(exp => ({
            ...exp,
            description: limitBullets(exp.description)
        }));
    }

    if (optimized.projects) {
        optimized.projects = optimized.projects.map(proj => ({
            ...proj,
            description: limitBullets(proj.description)
        }));
    }

    return optimized;
}

function parseMarkdown(text) {
    if (!text) return '';
    
    let clean = text;
    
    // Replace markdown bullet points that are preceded by space/newline/start and followed by space
    clean = clean.replace(/(?:^|\s|[\n])[\*\-\•\u2022]\s+/g, ' ');
    
    // Replace bold "**text**" or "__text__"
    clean = clean.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    clean = clean.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Replace italic "*text*" or "_text_"
    clean = clean.replace(/\*([^\*\s][^\*]*?[^\*\s]|[^\*\s])\*/g, '<em>$1</em>');
    clean = clean.replace(/_([^\_\s][^\_]*?[^\_\s]|[^\_\s])_/g, '<em>$1</em>');
    
    return clean;
}

function renderPreview() {
    const previewContainer = document.getElementById('resume-preview');
    if (!previewContainer) return;

    // Use optimized data for rendering
    const { personalInfo, summary, experience, education, skills, projects, template } = optimizeContent(state);

    let contacts = [];
    if (personalInfo.email) contacts.push(`<span><i class="fa-solid fa-envelope"></i> ${personalInfo.email}</span>`);
    if (personalInfo.phone) contacts.push(`<span><i class="fa-solid fa-phone"></i> ${personalInfo.phone}</span>`);
    if (personalInfo.location) contacts.push(`<span><i class="fa-solid fa-location-dot"></i> ${personalInfo.location}</span>`);
    if (personalInfo.linkedin) contacts.push(`<span><i class="fa-brands fa-linkedin"></i> ${personalInfo.linkedin}</span>`);
    if (personalInfo.github) contacts.push(`<span><i class="fa-brands fa-github"></i> ${personalInfo.github}</span>`);
    const contactsHTML = contacts.length > 0 ? `<div class="res-contact">${contacts.join('')}</div>` : '';
    const photoHTML = personalInfo.photo ? `<div class="res-photo-container"><img src="${personalInfo.photo}" class="res-photo"></div>` : '';

    const parsedSummary = parseMarkdown(summary);

    const skillsHTML = skills.length > 0 ? `<div class="res-section"><div class="res-section-title">Skills</div><div class="res-skills">${skills.map(s => `<span class="res-skill-tag">${s}</span>`).join('')}</div></div>` : '';
    const expHTML = experience.length > 0 ? `<div class="res-section"><div class="res-section-title">Experience</div>${experience.map(exp => `<div class="res-item"><div class="res-item-header"><div><div class="res-item-title">${exp.title || 'Job Title'}</div><div class="res-item-subtitle">${exp.company || 'Company'}</div></div><div class="res-item-date">${exp.date || ''}</div></div><div class="res-list">${exp.description ? exp.description.split('\n').map(l => {
        const parsed = parseMarkdown(l).trim();
        return parsed ? `• ${parsed}<br>` : '';
    }).join('') : ''}</div></div>`).join('')}</div>` : '';
    const eduHTML = education.length > 0 ? `<div class="res-section"><div class="res-section-title">Education</div>${education.map(edu => `<div class="res-item"><div class="res-item-header"><div><div class="res-item-title">${edu.degree || 'Degree'}</div><div class="res-item-subtitle">${edu.school || 'Institution'}</div></div><div class="res-item-date">${edu.date || ''}</div></div></div>`).join('')}</div>` : '';
    const projHTML = projects.length > 0 ? `<div class="res-section"><div class="res-section-title">Projects</div>${projects.map(proj => `<div class="res-item"><div class="res-item-header"><div class="res-item-title">${proj.title || 'Project'} ${proj.tech ? `<span style="font-weight:normal;font-size:0.9em;opacity:0.7">| ${proj.tech}</span>` : ''}</div></div><div class="res-list">${proj.description ? proj.description.split('\n').map(l => {
        const parsed = parseMarkdown(l).trim();
        return parsed ? `• ${parsed}<br>` : '';
    }).join('') : ''}</div></div>`).join('')}</div>` : '';

    let finalHTML = '';
    if (template === 'template-ats') {
        const atsContacts = [];
        if (personalInfo.email) atsContacts.push(`<span>${personalInfo.email}</span>`);
        if (personalInfo.phone) atsContacts.push(`<span>${personalInfo.phone}</span>`);
        if (personalInfo.location) atsContacts.push(`<span>${personalInfo.location}</span>`);
        if (personalInfo.linkedin) atsContacts.push(`<span>${personalInfo.linkedin}</span>`);
        if (personalInfo.github) atsContacts.push(`<span>${personalInfo.github}</span>`);
        const atsContactsHTML = atsContacts.length > 0 ? `<div class="res-contact">${atsContacts.join('')}</div>` : '';

        finalHTML = `
            <div class="res-header">
                <div class="res-name">${personalInfo.name || 'Your Name'}</div>
                <div class="res-title">${personalInfo.title || 'Professional Title'}</div>
                ${atsContactsHTML}
            </div>
            ${parsedSummary ? `<div class="res-section"><div class="res-section-title">Professional Summary</div><div class="res-summary">${parsedSummary}</div></div>` : ''}
            ${skills.length > 0 ? `<div class="res-section"><div class="res-section-title">Skills</div><p class="res-ats-skills-text">${skills.join(', ')}</p></div>` : ''}
            ${experience.length > 0 ? `<div class="res-section"><div class="res-section-title">Professional Experience</div>${experience.map(exp => `
                <div class="res-item">
                    <div class="res-item-header">
                        <div class="res-item-title">${exp.title || 'Job Title'} | ${exp.company || 'Company'}</div>
                        <div class="res-item-date">${exp.date || ''}</div>
                    </div>
                    <div class="res-list">${exp.description ? exp.description.split('\n').map(l => {
                        const parsed = parseMarkdown(l).trim();
                        return parsed ? `<div class="res-list-item">• ${parsed}</div>` : '';
                    }).join('') : ''}</div>
                </div>`).join('')}</div>` : ''}
            ${projects.length > 0 ? `<div class="res-section"><div class="res-section-title">Key Projects</div>${projects.map(proj => `
                <div class="res-item">
                    <div class="res-item-header">
                        <div class="res-item-title">${proj.title || 'Project'} ${proj.tech ? `| ${proj.tech}` : ''}</div>
                    </div>
                    <div class="res-list">${proj.description ? proj.description.split('\n').map(l => {
                        const parsed = parseMarkdown(l).trim();
                        return parsed ? `<div class="res-list-item">• ${parsed}</div>` : '';
                    }).join('') : ''}</div>
                </div>`).join('')}</div>` : ''}
            ${eduHTML}
        `;
    } else if (template === 'template-minimal') {
        finalHTML = `<div class="res-layout"><div class="res-sidebar">${photoHTML}<div class="res-name">${personalInfo.name || 'Your Name'}</div><div class="res-title">${personalInfo.title || 'Professional Title'}</div>${contactsHTML}${skillsHTML}${eduHTML}</div><div class="res-main">${parsedSummary ? `<div class="res-section" style="margin-top:0"><div class="res-section-title" style="margin-top:0">Profile</div><div class="res-summary">${parsedSummary}</div></div>` : ''} ${expHTML}${projHTML}</div></div>`;
    } else if (template === 'template-creative') {
        finalHTML = `<div class="res-header">${photoHTML}<div class="res-header-content"><div class="res-name">${personalInfo.name || 'Your Name'}</div><div class="res-title">${personalInfo.title || 'Professional Title'}</div>${contactsHTML}</div></div>${parsedSummary ? `<div class="res-section"><div class="res-section-title">Summary</div><div class="res-summary">${parsedSummary}</div></div>` : ''} ${expHTML}${projHTML}${eduHTML}${skillsHTML}`;
    } else if (template === 'template-corporate') {
        finalHTML = `<div class="res-header"><div class="res-header-left"><div class="res-name">${personalInfo.name || 'Your Name'}</div><div class="res-title">${personalInfo.title || 'Professional Title'}</div></div>${contactsHTML}</div>${parsedSummary ? `<div class="res-section"><div class="res-section-title">Professional Profile</div><div class="res-summary">${parsedSummary}</div></div>` : ''} ${expHTML}${projHTML}${eduHTML}${skillsHTML}`;
    } else {
        finalHTML = `<div class="res-header">${photoHTML}<div class="res-name">${personalInfo.name || 'Your Name'}</div><div class="res-title">${personalInfo.title || 'Professional Title'}</div>${contactsHTML}</div>${parsedSummary ? `<div class="res-section"><div class="res-section-title">Summary</div><div class="res-summary">${parsedSummary}</div></div>` : ''} ${expHTML}${projHTML}${eduHTML}${skillsHTML}`;
    }

    previewContainer.className = `resume-preview ${template}`;
    previewContainer.innerHTML = `<div id="res-content-wrapper">${finalHTML}</div>`;

    requestAnimationFrame(() => {
        autoFitContent();
        updatePreviewScale();
    });
}

function updatePreviewScale() {
    const preview = document.getElementById('resume-preview');
    const container = document.getElementById('resume-preview-container');
    const area = document.querySelector('.preview-area');
    if (!preview || !container || !area) return;

    preview.style.transform = '';
    preview.style.transformOrigin = '';
    preview.style.marginBottom = '';
    
    container.style.width = '';
    container.style.height = '';

    const areaWidth = area.clientWidth;
    const previewWidth = preview.offsetWidth;
    const previewHeight = preview.offsetHeight;

    // .preview-area has padding: 30px, so 60px total padding.
    const padding = 60;

    const availableWidth = areaWidth - padding;

    if (availableWidth < previewWidth && previewWidth > 0) {
        const scale = availableWidth / previewWidth;
        // Use translateZ(0) to trigger GPU acceleration and preserve-3d for sharpness
        preview.style.transform = `scale(${scale}) translateZ(0)`;
        preview.style.transformOrigin = 'top left'; // Top left works perfectly when using a wrapper
        preview.style.webkitFontSmoothing = 'antialiased';

        const scaledHeight = previewHeight * scale;
        const scaledWidth = previewWidth * scale;

        // CRITICAL FIX: We set the container to EXACTLY the scaled dimensions.
        // The browser uses this container for scroll height calculations without any bugs!
        container.style.width = `${scaledWidth}px`;
        container.style.height = `${scaledHeight}px`;
    } else {
        preview.style.transform = 'translateZ(0)';
    }
}

function autoFitContent() {
    const preview = document.getElementById('resume-preview');
    const wrapper = document.getElementById('res-content-wrapper');
    if (!preview || !wrapper) return;

    let ruler = document.getElementById('_mm_ruler');
    if (!ruler) {
        ruler = document.createElement('div');
        ruler.id = '_mm_ruler';
        ruler.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:297mm;height:1mm;pointer-events:none;visibility:hidden;';
        document.body.appendChild(ruler);
    }
    const mmToPx = ruler.offsetWidth / 297;
    const a4HeightPx = 297 * mmToPx;
    const paddingPx = 25.4 * mmToPx; // 1in padding (0.5in top + 0.5in bottom)
    const contentMaxHeight = a4HeightPx - paddingPx;

    // Reset styles on preview to measure uncompressed baseline height
    preview.style.setProperty('--res-font-scale', '1.0');
    preview.style.setProperty('--res-margin-scale', '1.0');
    preview.style.lineHeight = '1.4';

    // Detect overflow
    const maxPagesLimit = state.maxPages || 1;
    const isOverflowing = () => wrapper.scrollHeight > maxPagesLimit * contentMaxHeight + 2;

    const warningCard = document.getElementById('overflow-warning-card');
    const warningLimitNum = document.getElementById('warning-limit-num');

    let finalOverflow = false;

    if (state.overflowStrategy === 'shrink') {
        let fontScale = 1.0;
        let marginScale = 1.0;
        let lineHeight = 1.4;

        // Tighten section gaps
        if (isOverflowing()) {
            marginScale = 0.8;
            preview.style.setProperty('--res-margin-scale', marginScale.toFixed(2));
        }
        if (isOverflowing()) {
            marginScale = 0.6;
            preview.style.setProperty('--res-margin-scale', marginScale.toFixed(2));
        }

        // Reduce line height
        if (isOverflowing()) {
            lineHeight = 1.3;
            preview.style.lineHeight = lineHeight;
        }
        if (isOverflowing()) {
            lineHeight = 1.2;
            preview.style.lineHeight = lineHeight;
        }

        // Shrink font size progressively
        while (isOverflowing() && fontScale > state.minFontScale) {
            fontScale -= 0.02;
            preview.style.setProperty('--res-font-scale', fontScale.toFixed(3));
        }

        // Check if it STILL overflows after shrinking
        finalOverflow = isOverflowing();

        const originalHTML = wrapper.innerHTML;
        const currentFontScale = preview.style.getPropertyValue('--res-font-scale') || '1.0';
        const currentMarginScale = preview.style.getPropertyValue('--res-margin-scale') || '1.0';
        const currentLineHeight = preview.style.lineHeight || '1.4';

        preview.innerHTML = '';
        
        // Render in standard page shells
        const numPages = Math.max(1, maxPagesLimit);
        for (let i = 1; i <= numPages; i++) {
            const page = document.createElement('div');
            const templateClass = Array.from(preview.classList).find(c => c.startsWith('template-'));
            page.className = `resume-page ${templateClass}`;
            page.setAttribute('data-page', i);
            
            // Set styles directly on the page, so that PDF generator also picks them up
            page.style.setProperty('--res-font-scale', currentFontScale);
            page.style.setProperty('--res-margin-scale', currentMarginScale);
            page.style.lineHeight = currentLineHeight;
            
            const content = document.createElement('div');
            content.className = 'res-page-content';
            
            if (i === 1) {
                content.innerHTML = originalHTML;
            }
            
            // Toggle the warning card depending on whether the content fits in the chosen limit
            if (finalOverflow) {
                // If optional sections exist, suggest removal
                if (state && (state.hobbies?.length || state.certifications?.length || state.extraActivities?.length)) {
                    suggestOptionalSections();
                }
                if (warningCard) {
                    warningCard.classList.remove('hidden');
                    requestAnimationFrame(() => warningCard.classList.add('active'));
                }
                if (warningLimitNum) {
                    warningLimitNum.textContent = maxPagesLimit;
                }
            } else {
                if (warningCard) {
                    warningCard.classList.remove('active');
                    setTimeout(() => {
                        if (!warningCard.classList.contains('active')) {
                            warningCard.classList.add('hidden');
                        }
                    }, 300);
                }
            }
            
            page.appendChild(content);
            preview.appendChild(page);
        }
    } else {
        // Multi-page flow distribution path
        distributeContent(preview, wrapper, contentMaxHeight);

        // In flow mode, we overflow if the generated pages exceed user's chosen limit
        const actualPages = preview.querySelectorAll('.resume-page').length;
        finalOverflow = actualPages > maxPagesLimit;
    }

    // Suggest removal of optional sections when overflow persists
    function suggestOptionalSections() {
        const optional = [];
        if (state.hobbies && state.hobbies.length) optional.push('Hobbies');
        if (state.certifications && state.certifications.length) optional.push('Certifications');
        if (state.extraActivities && state.extraActivities.length) optional.push('Extra Activities');
        if (optional.length === 0) return;
        const msg = `Your resume exceeds the page limit. Consider removing optional sections: ${optional.join(', ')}.\nDo you want to remove them now?`;
        if (confirm(msg)) {
            if (state.hobbies) state.hobbies = [];
            if (state.certifications) state.certifications = [];
            if (state.extraActivities) state.extraActivities = [];
            // Persist changes and re-render
            try { localStorage.setItem('aiResumeManager_v1', JSON.stringify(appState)); } catch(e) {}
            updateAndRender();
        }
    }
}

function distributeContent(previewContainer, sourceWrapper, maxContentHeight) {
    const templateClass = Array.from(previewContainer.classList).find(c => c.startsWith('template-'));
    
    if (templateClass === 'template-minimal') {
        distributeMinimalContent(previewContainer, sourceWrapper, maxContentHeight);
    } else {
        distributeSequentialContent(previewContainer, sourceWrapper, maxContentHeight, templateClass);
    }
}

function distributeSequentialContent(previewContainer, sourceWrapper, maxContentHeight, templateClass) {
    previewContainer.innerHTML = '';

    let currentPageNum = 1;
    let currentPage = createNewPage(previewContainer, currentPageNum, templateClass);
    let currentPageWrapper = currentPage.querySelector('.res-page-content');

    const elements = Array.from(sourceWrapper.children);

    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const clone = el.cloneNode(true);
        currentPageWrapper.appendChild(clone);

        if (currentPageWrapper.scrollHeight <= maxContentHeight + 1) {
            continue;
        }

        currentPageWrapper.removeChild(clone);

        if (el.classList.contains('res-section') && el.querySelector('.res-item')) {
            const sectionTitleEl = el.querySelector('.res-section-title');
            const items = Array.from(el.querySelectorAll('.res-item'));

            const sectionShell = el.cloneNode(false);
            if (sectionTitleEl) {
                sectionShell.appendChild(sectionTitleEl.cloneNode(true));
            }
            currentPageWrapper.appendChild(sectionShell);

            let addedAnyItem = false;
            let itemIndex = 0;

            for (; itemIndex < items.length; itemIndex++) {
                const itemClone = items[itemIndex].cloneNode(true);
                sectionShell.appendChild(itemClone);

                if (currentPageWrapper.scrollHeight <= maxContentHeight + 1) {
                    addedAnyItem = true;
                } else {
                    sectionShell.removeChild(itemClone);
                    break;
                }
            }

            if (!addedAnyItem) {
                currentPageWrapper.removeChild(sectionShell);
                
                currentPageNum++;
                currentPage = createNewPage(previewContainer, currentPageNum, templateClass);
                currentPageWrapper = currentPage.querySelector('.res-page-content');
                
                i--;
                continue;
            }

            if (itemIndex < items.length) {
                const remainingSection = el.cloneNode(false);
                for (let j = itemIndex; j < items.length; j++) {
                    remainingSection.appendChild(items[j].cloneNode(true));
                }
                
                elements.splice(i + 1, 0, remainingSection);
                
                currentPageNum++;
                currentPage = createNewPage(previewContainer, currentPageNum, templateClass);
                currentPageWrapper = currentPage.querySelector('.res-page-content');
            }
        } else if (el.classList.contains('res-section') && el.querySelector('.res-skill-tag')) {
            const sectionTitleEl = el.querySelector('.res-section-title');
            const tags = Array.from(el.querySelectorAll('.res-skill-tag'));
            
            const sectionShell = el.cloneNode(false);
            if (sectionTitleEl) {
                sectionShell.appendChild(sectionTitleEl.cloneNode(true));
            }
            
            const tagsContainer = el.querySelector('.res-skills').cloneNode(false);
            sectionShell.appendChild(tagsContainer);
            currentPageWrapper.appendChild(sectionShell);
            
            let addedAnyTag = false;
            let tagIndex = 0;
            
            for (; tagIndex < tags.length; tagIndex++) {
                const tagClone = tags[tagIndex].cloneNode(true);
                tagsContainer.appendChild(tagClone);
                
                if (currentPageWrapper.scrollHeight <= maxContentHeight + 1) {
                    addedAnyTag = true;
                } else {
                    tagsContainer.removeChild(tagClone);
                    break;
                }
            }
            
            if (!addedAnyTag) {
                currentPageWrapper.removeChild(sectionShell);
                currentPageNum++;
                currentPage = createNewPage(previewContainer, currentPageNum, templateClass);
                currentPageWrapper = currentPage.querySelector('.res-page-content');
                i--;
                continue;
            }
            
            if (tagIndex < tags.length) {
                const remainingSection = el.cloneNode(false);
                if (sectionTitleEl) {
                    remainingSection.appendChild(sectionTitleEl.cloneNode(true));
                }
                const remainingTagsContainer = el.querySelector('.res-skills').cloneNode(false);
                for (let j = tagIndex; j < tags.length; j++) {
                    remainingTagsContainer.appendChild(tags[j].cloneNode(true));
                }
                remainingSection.appendChild(remainingTagsContainer);
                
                elements.splice(i + 1, 0, remainingSection);
                
                currentPageNum++;
                currentPage = createNewPage(previewContainer, currentPageNum, templateClass);
                currentPageWrapper = currentPage.querySelector('.res-page-content');
            }
        } else {
            currentPageNum++;
            currentPage = createNewPage(previewContainer, currentPageNum, templateClass);
            currentPageWrapper = currentPage.querySelector('.res-page-content');
            currentPageWrapper.appendChild(clone);
        }
    }
    
    addContinuedSectionTitles(previewContainer);
}

function distributeMinimalContent(previewContainer, sourceWrapper, maxContentHeight) {
    previewContainer.innerHTML = '';

    const resLayout = sourceWrapper.querySelector('.res-layout');
    if (!resLayout) return;

    const sidebarSource = resLayout.querySelector('.res-sidebar');
    const mainSource = resLayout.querySelector('.res-main');

    const sidebarElements = sidebarSource ? Array.from(sidebarSource.children) : [];
    const mainElements = mainSource ? Array.from(mainSource.children) : [];

    let currentPageNum = 1;
    
    function createMinimalPage(pageNum) {
        const page = document.createElement('div');
        page.className = 'resume-page template-minimal';
        page.setAttribute('data-page', pageNum);
        
        const layout = document.createElement('div');
        layout.className = 'res-layout';
        page.appendChild(layout);

        const sidebar = document.createElement('div');
        sidebar.className = 'res-sidebar';
        layout.appendChild(sidebar);

        const main = document.createElement('div');
        main.className = 'res-main';
        layout.appendChild(main);

        previewContainer.appendChild(page);
        return { page, sidebar, main };
    }

    let current = createMinimalPage(currentPageNum);

    for (let i = 0; i < sidebarElements.length; i++) {
        const el = sidebarElements[i];
        const clone = el.cloneNode(true);
        current.sidebar.appendChild(clone);

        if (current.sidebar.scrollHeight > maxContentHeight + 1) {
            current.sidebar.removeChild(clone);
            currentPageNum++;
            
            let pages = previewContainer.querySelectorAll('.resume-page');
            if (pages.length < currentPageNum) {
                current = createMinimalPage(currentPageNum);
            } else {
                const targetPage = pages[currentPageNum - 1];
                current = {
                    page: targetPage,
                    sidebar: targetPage.querySelector('.res-sidebar'),
                    main: targetPage.querySelector('.res-main')
                };
            }
            i--;
        }
    }

    currentPageNum = 1;
    let pages = previewContainer.querySelectorAll('.resume-page');
    current = {
        page: pages[0],
        sidebar: pages[0].querySelector('.res-sidebar'),
        main: pages[0].querySelector('.res-main')
    };

    for (let i = 0; i < mainElements.length; i++) {
        const el = mainElements[i];
        const clone = el.cloneNode(true);
        current.main.appendChild(clone);

        if (current.main.scrollHeight <= maxContentHeight + 1) {
            continue;
        }

        current.main.removeChild(clone);

        if (el.classList.contains('res-section') && el.querySelector('.res-item')) {
            const sectionTitleEl = el.querySelector('.res-section-title');
            const items = Array.from(el.querySelectorAll('.res-item'));

            const sectionShell = el.cloneNode(false);
            if (sectionTitleEl) sectionShell.appendChild(sectionTitleEl.cloneNode(true));
            current.main.appendChild(sectionShell);

            let addedAny = false;
            let itemIndex = 0;

            for (; itemIndex < items.length; itemIndex++) {
                const itemClone = items[itemIndex].cloneNode(true);
                sectionShell.appendChild(itemClone);

                if (current.main.scrollHeight <= maxContentHeight + 1) {
                    addedAny = true;
                } else {
                    sectionShell.removeChild(itemClone);
                    break;
                }
            }

            if (!addedAny) {
                current.main.removeChild(sectionShell);
                currentPageNum++;
                pages = previewContainer.querySelectorAll('.resume-page');
                if (pages.length < currentPageNum) {
                    current = createMinimalPage(currentPageNum);
                } else {
                    const targetPage = pages[currentPageNum - 1];
                    current = {
                        page: targetPage,
                        sidebar: targetPage.querySelector('.res-sidebar'),
                        main: targetPage.querySelector('.res-main')
                    };
                }
                i--;
                continue;
            }

            if (itemIndex < items.length) {
                const remainingSection = el.cloneNode(false);
                for (let j = itemIndex; j < items.length; j++) {
                    remainingSection.appendChild(items[j].cloneNode(true));
                }
                mainElements.splice(i + 1, 0, remainingSection);
                
                currentPageNum++;
                pages = previewContainer.querySelectorAll('.resume-page');
                if (pages.length < currentPageNum) {
                    current = createMinimalPage(currentPageNum);
                } else {
                    const targetPage = pages[currentPageNum - 1];
                    current = {
                        page: targetPage,
                        sidebar: targetPage.querySelector('.res-sidebar'),
                        main: targetPage.querySelector('.res-main')
                    };
                }
            }
        } else {
            currentPageNum++;
            pages = previewContainer.querySelectorAll('.resume-page');
            if (pages.length < currentPageNum) {
                current = createMinimalPage(currentPageNum);
            } else {
                const targetPage = pages[currentPageNum - 1];
                current = {
                    page: targetPage,
                    sidebar: targetPage.querySelector('.res-sidebar'),
                    main: targetPage.querySelector('.res-main')
                };
            }
            current.main.appendChild(clone);
        }
    }
    
    addContinuedSectionTitles(previewContainer);
}

function createNewPage(previewContainer, pageNum, templateClass) {
    const page = document.createElement('div');
    page.className = `resume-page ${templateClass}`;
    page.setAttribute('data-page', pageNum);
    
    const content = document.createElement('div');
    content.className = 'res-page-content';
    page.appendChild(content);
    
    previewContainer.appendChild(page);
    return page;
}

function addContinuedSectionTitles(previewContainer) {
    const pages = Array.from(previewContainer.querySelectorAll('.resume-page'));
    if (pages.length <= 1) return;

    const seenTitles = new Set();

    pages.forEach((page, pageIdx) => {
        if (pageIdx === 0) {
            page.querySelectorAll('.res-section-title').forEach(title => {
                seenTitles.add(title.textContent.trim().toLowerCase());
            });
            return;
        }

        page.querySelectorAll('.res-section-title').forEach(title => {
            const cleanText = title.textContent.trim().replace(/\s*\(continued\)$/i, '').trim().toLowerCase();
            if (seenTitles.has(cleanText) && !title.innerHTML.includes('(Continued)')) {
                title.innerHTML += ' <span style="font-size:0.8em; font-weight:normal; opacity:0.7;">(Continued)</span>';
            } else {
                seenTitles.add(cleanText);
            }
        });
    });
}

function updateATSScore() {
    const { summary, experience, skills, projects, targetRole, jobDescription } = state;
    let score = 0;

    // 1. Content completeness (50 points)
    if (summary && summary.length > 50) score += 10;
    if (summary && summary.length > 150) score += 5;
    if (skills && skills.length > 5) score += 10;
    if (experience && experience.length > 0) score += 15;
    if (projects && projects.length > 0) score += 10;

    // 2. JD Alignment & Keywords (50 points)
    if (targetRole) score += 10;
    if (jobDescription) {
        score += 10;
        const jdText = jobDescription.toLowerCase();
        const resumeText = (summary + JSON.stringify(experience) + JSON.stringify(projects) + JSON.stringify(skills)).toLowerCase();

        // Industry standard keywords
        const keywords = ['javascript', 'python', 'react', 'node', 'sql', 'aws', 'management', 'leadership', 'agile', 'scrum', 'api', 'design', 'developer', 'engineer', 'optimization', 'performance', 'scaling'];
        let matches = 0;
        keywords.forEach(kw => {
            if (jdText.includes(kw) && resumeText.includes(kw)) matches++;
        });

        score += Math.min(30, matches * 5);
    }

    state.atsScore = Math.min(100, score);
    const scoreVal = document.getElementById('ats-score-value');
    const scoreBar = document.getElementById('ats-progress');

    if (scoreVal && scoreBar) {
        scoreVal.textContent = `${state.atsScore}%`;
        scoreBar.style.width = `${state.atsScore}%`;

        // Dynamic Coloring
        if (state.atsScore < 50) {
            scoreVal.style.background = '#ef4444';
            scoreBar.style.background = '#ef4444';
        } else if (state.atsScore < 80) {
            scoreVal.style.background = '#f59e0b';
            scoreBar.style.background = '#f59e0b';
        } else {
            scoreVal.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
            scoreBar.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
        }
    }
}
