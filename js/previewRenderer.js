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

    const skillsHTML = skills.length > 0 ? `<div class="res-section"><div class="res-section-title">Skills</div><div class="res-skills">${skills.map(s => `<span class="res-skill-tag">${s}</span>`).join('')}</div></div>` : '';
    const expHTML = experience.length > 0 ? `<div class="res-section"><div class="res-section-title">Experience</div>${experience.map(exp => `<div class="res-item"><div class="res-item-header"><div><div class="res-item-title">${exp.title || 'Job Title'}</div><div class="res-item-subtitle">${exp.company || 'Company'}</div></div><div class="res-item-date">${exp.date || ''}</div></div><div class="res-list">${exp.description ? exp.description.split('\n').map(l => l.trim() ? `• ${l}<br>` : ``).join('') : ''}</div></div>`).join('')}</div>` : '';
    const eduHTML = education.length > 0 ? `<div class="res-section"><div class="res-section-title">Education</div>${education.map(edu => `<div class="res-item"><div class="res-item-header"><div><div class="res-item-title">${edu.degree || 'Degree'}</div><div class="res-item-subtitle">${edu.school || 'Institution'}</div></div><div class="res-item-date">${edu.date || ''}</div></div></div>`).join('')}</div>` : '';
    const projHTML = projects.length > 0 ? `<div class="res-section"><div class="res-section-title">Projects</div>${projects.map(proj => `<div class="res-item"><div class="res-item-header"><div class="res-item-title">${proj.title || 'Project'} ${proj.tech ? `<span style="font-weight:normal;font-size:0.9em;opacity:0.7">| ${proj.tech}</span>` : ''}</div></div><div class="res-list">${proj.description ? proj.description.split('\n').map(l => l.trim() ? `• ${l}<br>` : ``).join('') : ''}</div></div>`).join('')}</div>` : '';

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
            ${summary ? `<div class="res-section"><div class="res-section-title">Professional Summary</div><div class="res-summary">${summary}</div></div>` : ''}
            ${skills.length > 0 ? `<div class="res-section"><div class="res-section-title">Skills</div><p class="res-ats-skills-text">${skills.join(', ')}</p></div>` : ''}
            ${experience.length > 0 ? `<div class="res-section"><div class="res-section-title">Professional Experience</div>${experience.map(exp => `
                <div class="res-item">
                    <div class="res-item-header">
                        <div class="res-item-title">${exp.title || 'Job Title'} | ${exp.company || 'Company'}</div>
                        <div class="res-item-date">${exp.date || ''}</div>
                    </div>
                    <div class="res-list">${exp.description ? exp.description.split('\n').map(l => l.trim() ? `<div class="res-list-item">• ${l}</div>` : ``).join('') : ''}</div>
                </div>`).join('')}</div>` : ''}
            ${projects.length > 0 ? `<div class="res-section"><div class="res-section-title">Key Projects</div>${projects.map(proj => `
                <div class="res-item">
                    <div class="res-item-header">
                        <div class="res-item-title">${proj.title || 'Project'} ${proj.tech ? `| ${proj.tech}` : ''}</div>
                    </div>
                    <div class="res-list">${proj.description ? proj.description.split('\n').map(l => l.trim() ? `<div class="res-list-item">• ${l}</div>` : ``).join('') : ''}</div>
                </div>`).join('')}</div>` : ''}
            ${eduHTML}
        `;
    } else if (template === 'template-minimal') {
        finalHTML = `<div class="res-layout"><div class="res-sidebar">${photoHTML}<div class="res-name">${personalInfo.name || 'Your Name'}</div><div class="res-title">${personalInfo.title || 'Professional Title'}</div>${contactsHTML}${skillsHTML}${eduHTML}</div><div class="res-main">${summary ? `<div class="res-section" style="margin-top:0"><div class="res-section-title" style="margin-top:0">Profile</div><div class="res-summary">${summary}</div></div>` : ''} ${expHTML}${projHTML}</div></div>`;
    } else if (template === 'template-creative') {
        finalHTML = `<div class="res-header">${photoHTML}<div class="res-header-content"><div class="res-name">${personalInfo.name || 'Your Name'}</div><div class="res-title">${personalInfo.title || 'Professional Title'}</div>${contactsHTML}</div></div>${summary ? `<div class="res-section"><div class="res-section-title">Summary</div><div class="res-summary">${summary}</div></div>` : ''} ${expHTML}${projHTML}${eduHTML}${skillsHTML}`;
    } else if (template === 'template-corporate') {
        finalHTML = `<div class="res-header"><div class="res-header-left"><div class="res-name">${personalInfo.name || 'Your Name'}</div><div class="res-title">${personalInfo.title || 'Professional Title'}</div></div>${contactsHTML}</div>${summary ? `<div class="res-section"><div class="res-section-title">Professional Profile</div><div class="res-summary">${summary}</div></div>` : ''} ${expHTML}${projHTML}${eduHTML}${skillsHTML}`;
    } else {
        finalHTML = `<div class="res-header">${photoHTML}<div class="res-name">${personalInfo.name || 'Your Name'}</div><div class="res-title">${personalInfo.title || 'Professional Title'}</div>${contactsHTML}</div>${summary ? `<div class="res-section"><div class="res-section-title">Summary</div><div class="res-summary">${summary}</div></div>` : ''} ${expHTML}${projHTML}${eduHTML}${skillsHTML}`;
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

    // Compute A4 content height in px: 297mm minus top + bottom padding (0.5in each = 1in total)
    // Use a temporary ruler element for accurate mm-to-px conversion
    let ruler = document.getElementById('_mm_ruler');
    if (!ruler) {
        ruler = document.createElement('div');
        ruler.id = '_mm_ruler';
        ruler.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:297mm;height:1mm;pointer-events:none;visibility:hidden;';
        document.body.appendChild(ruler);
    }
    const mmToPx = ruler.offsetWidth / 297; // px per mm
    const a4HeightPx = 297 * mmToPx;
    const paddingPx = parseFloat(getComputedStyle(preview).paddingTop) + parseFloat(getComputedStyle(preview).paddingBottom);
    const contentMaxHeight = a4HeightPx - paddingPx;

    // 1. Reset to defaults
    preview.style.fontSize = '11pt';
    preview.style.lineHeight = '1.4';
    const sections = wrapper.querySelectorAll('.res-section');
    sections.forEach(s => { s.style.marginBottom = '12px'; });

    const isOverflowing = () => wrapper.scrollHeight > contentMaxHeight + 2;

    // 2. Step 1 — tighten section gaps
    if (isOverflowing()) sections.forEach(s => { s.style.marginBottom = '10px'; });
    if (isOverflowing()) sections.forEach(s => { s.style.marginBottom = '8px'; });

    // 3. Step 2 — reduce line height
    if (isOverflowing()) preview.style.lineHeight = '1.3';
    if (isOverflowing()) preview.style.lineHeight = '1.2';

    // 4. Step 3 — shrink font size (11pt → 9.5pt min)
    let currentSize = 11;
    while (isOverflowing() && currentSize > 9.5) {
        currentSize -= 0.2;
        preview.style.fontSize = `${currentSize.toFixed(1)}pt`;
    }

    // 5. If still overflowing, show page divider; otherwise clear it
    if (isOverflowing()) {
        handleMultiPageOverflow(wrapper, contentMaxHeight);
    } else {
        const divider = document.getElementById('page-divider');
        if (divider) divider.remove();
    }
}

function handleMultiPageOverflow(wrapper, maxHeight) {
    // This is a simplified version. For a real production app, we'd split sections carefully.
    // For now, we'll just allow overflow and let CSS handle the page breaks at section boundaries.
    const preview = document.getElementById('resume-preview');
    preview.style.overflow = 'visible';
    preview.style.minHeight = 'auto';

    // We can add a visual divider for Page 1 boundary
    const divider = document.getElementById('page-divider');
    if (divider) divider.remove();

    const newDivider = document.createElement('div');
    newDivider.id = 'page-divider';
    newDivider.style.position = 'absolute';
    newDivider.style.top = `${maxHeight + parseFloat(getComputedStyle(preview).paddingTop)}px`;
    newDivider.style.left = '0';
    newDivider.style.width = '100%';
    newDivider.style.borderTop = '2px dashed #ff4444';
    newDivider.style.zIndex = '10';
    newDivider.innerHTML = '<span style="background:#ff4444;color:white;font-size:8pt;padding:2px 5px;position:absolute;top:-10px;right:10px;border-radius:3px;">PAGE 1 LIMIT</span>';
    preview.appendChild(newDivider);
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
