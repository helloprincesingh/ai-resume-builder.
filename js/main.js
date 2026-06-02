document.addEventListener('DOMContentLoaded', () => {
    loadData();
    if (state.theme === 'dark') document.body.classList.add('dark-mode');

    document.getElementById('theme-toggle').addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        state.theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        saveData();
    });

    document.getElementById('clear-all-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) clearData();
    });

    initTemplateManager();
    initFormHandlers();
    initResumeManager();
    renderPreview();
    updateATSScore();
    setupExport();
    setupGrammarFix();
    setupMobileToggle();

    // Mobile theme toggle button listener and setup
    const mobileThemeBtn = document.getElementById('mobile-theme-btn');
    if (mobileThemeBtn) {
        mobileThemeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            state.theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
            saveData();
            updateMobileThemeUI();
        });
    }
    updateMobileThemeUI();
    initPreviewScaleObserver();
});


function initResumeManager() {
    const selector = document.getElementById('resume-drafts-selector');
    const saveBtn = document.getElementById('save-new-draft-btn');
    const deleteBtn = document.getElementById('delete-draft-btn');
    const nameInput = document.getElementById('new-draft-name');

    if (!selector || !saveBtn || !deleteBtn || !nameInput) return;

    // Populate dropdown
    selector.innerHTML = '';
    Object.keys(appState.resumes).forEach(id => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = appState.resumes[id].name;
        if (id === appState.currentId) option.selected = true;
        selector.appendChild(option);
    });

    selector.addEventListener('change', (e) => switchResume(e.target.value));

    saveBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (!name) return alert("Please enter a name for your new resume draft.");
        createNewResume(name);
    });

    deleteBtn.addEventListener('click', () => deleteResume(appState.currentId));
}

function setupMobileToggle() {
    const mobileEditBtn = document.getElementById('mobile-edit-btn');
    const mobilePreviewBtn = document.getElementById('mobile-preview-btn');
    const appContainer = document.querySelector('.app-container');

    if (mobileEditBtn && mobilePreviewBtn && appContainer) {
        mobileEditBtn.addEventListener('click', () => {
            appContainer.classList.add('show-edit');
            appContainer.classList.remove('show-preview');
            mobileEditBtn.classList.add('active');
            mobilePreviewBtn.classList.remove('active');
        });

        mobilePreviewBtn.addEventListener('click', () => {
            appContainer.classList.remove('show-edit');
            appContainer.classList.add('show-preview');
            mobileEditBtn.classList.remove('active');
            mobilePreviewBtn.classList.add('active');
            // Re-render and scale after the preview area becomes visible
            requestAnimationFrame(() => {
                renderPreview();
            });
        });
    }

    // Debounced resize handler
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (typeof updatePreviewScale === 'function') updatePreviewScale();
        }, 100);
    });

    // Initial scale on load
    requestAnimationFrame(() => {
        if (typeof updatePreviewScale === 'function') updatePreviewScale();
    });
}

// ── Grammar / Improve Button ─────────────────────────────────────────────────
// ── Grammar / Improve Modal Logic ───────────────────────────────────────────
function setupGrammarFix() {
    // Inject the result modal once into the DOM if it doesn't exist
    if (!document.getElementById('grammar-modal')) {
        const modal = document.createElement('div');
        modal.id = 'grammar-modal';
        modal.className = 'grammar-modal';
        modal.innerHTML = `
            <div class="grammar-modal-backdrop"></div>
            <div class="grammar-modal-box">
                <div class="grammar-modal-header">
                    <span><i class="fa-solid fa-bolt"></i> AI Grammar &amp; Phrasing</span>
                    <button class="grammar-modal-close" id="grammar-modal-close">&times;</button>
                </div>
                <div class="grammar-modal-body" id="grammar-modal-body"></div>
                <div class="grammar-modal-footer">
                    <button class="btn btn-ai" id="grammar-apply-btn"><i class="fa-solid fa-check"></i> Use Corrected Text</button>
                    <button class="btn btn-secondary" id="grammar-modal-close2">Close</button>
                </div>
            </div>`;
        document.body.appendChild(modal);

        const closeModal = () => { modal.classList.remove('active'); };
        document.getElementById('grammar-modal-close').addEventListener('click', closeModal);
        document.getElementById('grammar-modal-close2').addEventListener('click', closeModal);
        modal.querySelector('.grammar-modal-backdrop').addEventListener('click', closeModal);
    }

    // Event delegation — catches .btn-improve clicks for elements NOT handled by formHandler.js
    // Note: We use a check to avoid double-processing if formHandler already has a listener.
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.btn-improve');
        if (!btn || btn.classList.contains('improve-exp-btn') || btn.classList.contains('improve-proj-btn')) return;
        // The summary button is also handled in formHandler.js, so we skip it here if it has a data-target
        if (btn.dataset.target === 'summary-text') return;

        const textarea = btn.previousElementSibling;
        if (!textarea || textarea.tagName !== 'TEXTAREA') return;

        const userText = textarea.value.trim();
        if (!userText) { alert('Please enter some text first.'); return; }

        if (typeof showLoading === 'function') showLoading(true);

        try {
            const targetRole = document.getElementById('target-role')?.value || '';
            const jobDesc = document.getElementById('job-description')?.value || '';
            const result = await fixGrammar(userText, 'General', targetRole, jobDesc);
            if (typeof showLoading === 'function') showLoading(false);
            if (result) {
                showGrammarModal(result, textarea, (finalText) => {
                    textarea.value = finalText;
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                });
            }
        } catch (err) {
            if (typeof showLoading === 'function') showLoading(false);
            console.error(err);
        }
    });
}

/**
 * Global function to show the grammar correction modal.
 * @param {string} resultText - The text returned from the AI.
 * @param {HTMLElement} targetElement - The textarea to be updated.
 * @param {Function} onApply - Optional callback after user clicks "Use Corrected Text".
 */
window.showGrammarModal = function (resultText, targetElement, onApply) {
    const modal = document.getElementById('grammar-modal');
    if (!modal) return;

    const bodyEl = document.getElementById('grammar-modal-body');
    // Convert markdown-style headers and bolding to HTML
    bodyEl.innerHTML = resultText
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    modal.classList.add('active');

    const applyBtn = document.getElementById('grammar-apply-btn');
    if (applyBtn) applyBtn.style.display = 'block'; // Ensure it's visible
    if (applyBtn) applyBtn.onclick = () => {
        let correctedText = resultText;

        // Logic to extract just the text under "Improved Version"
        const improvedMatch = resultText.match(/### 💎 Improved Version\n([\s\S]*?)(?=\n###|$)/i);
        if (improvedMatch && improvedMatch[1]) {
            correctedText = improvedMatch[1].trim();
        } else {
            // Fallback: pick the first non-empty paragraph that isn't a header
            const lines = resultText.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
            correctedText = lines[0] || resultText;
        }

        // Remove common AI prefixes/quotes
        correctedText = correctedText.replace(/^(Corrected|Revised|Improved|Result):\s*/i, '');
        correctedText = correctedText.replace(/^["']|["']$/g, '');

        if (targetElement) {
            targetElement.value = correctedText;
            targetElement.dispatchEvent(new Event('input', { bubbles: true }));
        }

        if (typeof onApply === 'function') onApply(correctedText);

        modal.classList.remove('active');
    };
};

function setupExport() {
    document.getElementById('download-pdf').addEventListener('click', () => {
        const element = document.getElementById('resume-preview');
        const warningCard = document.getElementById('overflow-warning-card');
        
        // Save original preview styling
        const originalTransform = element.style.transform;
        const originalMarginBottom = element.style.marginBottom;
        const originalMarginRight = element.style.marginRight;
        const originalBoxShadow = element.style.boxShadow;
        const originalMinHeight = element.style.minHeight;
        const originalHeight = element.style.height;
        const originalOverflow = element.style.overflow;
        const originalGap = element.style.gap;

        // Hide warning card
        let warningCardWasActive = false;
        if (warningCard && warningCard.classList.contains('active')) {
            warningCardWasActive = true;
            warningCard.classList.remove('active');
            warningCard.classList.add('hidden');
        }

        // Apply clean styles for PDF generation
        element.style.transform = 'none';
        element.style.marginBottom = '0';
        element.style.marginRight = '0';
        element.style.boxShadow = 'none';
        element.style.minHeight = 'auto';
        element.style.height = 'auto';
        element.style.overflow = 'visible';
        element.style.gap = '0';

        // Disable visual page shadows for clean export
        const pages = element.querySelectorAll('.resume-page');
        const originalPageShadows = [];
        pages.forEach(p => {
            originalPageShadows.push(p.style.boxShadow);
            p.style.boxShadow = 'none';
        });

        const divider = document.getElementById('page-divider');
        if (divider) divider.style.display = 'none';

        const opt = {
            margin: 0,
            filename: `${state.personalInfo.name || 'resume'}_v2.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'], before: '.resume-page' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            // Restore styles
            element.style.transform = originalTransform;
            element.style.marginBottom = originalMarginBottom;
            element.style.marginRight = originalMarginRight;
            element.style.boxShadow = originalBoxShadow;
            element.style.minHeight = originalMinHeight;
            element.style.height = originalHeight;
            element.style.overflow = originalOverflow;
            element.style.gap = originalGap;

            pages.forEach((p, idx) => {
                p.style.boxShadow = originalPageShadows[idx];
            });

            if (divider) divider.style.display = 'block';

            if (warningCardWasActive && warningCard) {
                warningCard.classList.remove('hidden');
                requestAnimationFrame(() => warningCard.classList.add('active'));
            }
        });
    });

    document.getElementById('download-docx').addEventListener('click', () => {
        alert("Generating basic DOCX...");
        generateDocx();
    });


    // 🔹 Cover Letter Logic
    const clModal = document.getElementById('cover-letter-modal');
    const clBtn = document.getElementById('generate-cover-letter-btn');
    const clClose = document.getElementById('cl-modal-close');
    const clTextarea = document.getElementById('cover-letter-text');

    clBtn?.addEventListener('click', async () => {
        if (typeof showLoading === 'function') showLoading(true);
        try {
            const role = document.getElementById('target-role')?.value || '';
            const jd = document.getElementById('job-description')?.value || '';
            const cl = await generateCoverLetter(state, role, jd);
            if (cl) {
                clTextarea.value = cl;
                clModal.classList.add('active');
            }
        } finally {
            if (typeof showLoading === 'function') showLoading(false);
        }
    });

    clClose?.addEventListener('click', () => clModal.classList.remove('active'));

    document.getElementById('cl-copy-btn')?.addEventListener('click', () => {
        clTextarea.select();
        document.execCommand('copy');
        alert('Copied to clipboard!');
    });

    document.getElementById('cl-download-docx')?.addEventListener('click', () => {
        if (typeof docx === 'undefined') return;
        const { Document, Packer, Paragraph, TextRun } = docx;
        const lines = clTextarea.value.split('\n');
        const children = lines.map(line => new Paragraph({ children: [new TextRun(line)] }));
        const doc = new Document({ sections: [{ properties: {}, children }] });
        Packer.toBlob(doc).then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `Cover_Letter_${state.personalInfo.name || 'Resume'}.docx`; a.click();
            window.URL.revokeObjectURL(url);
        });
    });

    // 🔹 JD Analysis & Generation Logic
    const jdInput = document.getElementById('job-description');
    const roleInput = document.getElementById('target-role');

    document.getElementById('try-sample-jd')?.addEventListener('click', () => {
        const sampleJD = `We are looking for a Software Engineer to join our team. \n\nKey Responsibilities:\n- Develop high-quality software using React and Node.js.\n- Collaborate with cross-functional teams to design new features.\n- Optimize applications for maximum speed and scalability.\n\nRequirements:\n- Proficiency in JavaScript and TypeScript.\n- Experience with cloud platforms (AWS/Azure).\n- Strong problem-solving skills and attention to detail.`;
        if (jdInput) {
            jdInput.value = sampleJD;
            state.jobDescription = sampleJD;
            updateAndRender();
        }
    });

    document.getElementById('generate-jd-btn')?.addEventListener('click', async () => {
        const role = roleInput?.value.trim();
        if (!role) { alert('Please enter a Target Job Role first so the AI knows what to generate.'); return; }

        if (typeof showLoading === 'function') showLoading(true);
        try {
            const suggestedJD = await generateJobRequirements(role);
            if (suggestedJD && jdInput) {
                jdInput.value = suggestedJD;
                state.jobDescription = suggestedJD;
                updateAndRender();
            }
        } finally {
            if (typeof showLoading === 'function') showLoading(false);
        }
    });

    document.getElementById('analyze-jd-btn')?.addEventListener('click', async () => {
        const jd = jdInput?.value.trim();
        const role = roleInput?.value.trim();

        if (!jd) {
            if (role && confirm(`The Job Description is empty. Would you like the AI to generate common requirements for a "${role}" and analyze against those?`)) {
                document.getElementById('generate-jd-btn').click();
                return;
            }
            alert('Please paste a job description first.');
            return;
        }

        if (typeof showLoading === 'function') showLoading(true);
        try {
            const analysis = await analyzeKeywords(state, jd);
            if (analysis) {
                if (typeof showGrammarModal === 'function') {
                    showGrammarModal(analysis, null, null);
                    const applyBtn = document.getElementById('grammar-apply-btn');
                    if (applyBtn) applyBtn.style.display = 'none';
                }
            }
        } finally {
            if (typeof showLoading === 'function') showLoading(false);
        }
    });
}

function generateDocx() {
    if (typeof docx === 'undefined') { alert('docx library not loaded.'); return; }
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;
    const children = [];
    children.push(new Paragraph({ text: state.personalInfo.name || 'Your Name', heading: HeadingLevel.HEADING_1, alignment: docx.AlignmentType.CENTER }));
    children.push(new Paragraph({ text: state.personalInfo.title || 'Professional Title', alignment: docx.AlignmentType.CENTER }));
    const contactStr = [state.personalInfo.email, state.personalInfo.phone, state.personalInfo.location, state.personalInfo.linkedin, state.personalInfo.github].filter(Boolean).join(' | ');
    children.push(new Paragraph({ text: contactStr, alignment: docx.AlignmentType.CENTER, spacing: { after: 400 } }));
    if (state.summary) { children.push(new Paragraph({ text: 'SUMMARY', heading: HeadingLevel.HEADING_2 })); children.push(new Paragraph({ text: state.summary })); }
    if (state.skills && state.skills.length > 0) {
        children.push(new Paragraph({ text: 'SKILLS', heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }));
        children.push(new Paragraph({ text: state.skills.join(', ') }));
    }
    if (state.experience.length > 0) {
        children.push(new Paragraph({ text: 'EXPERIENCE', heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }));
        state.experience.forEach(exp => {
            children.push(new Paragraph({ children: [new TextRun({ text: exp.title || '', bold: true }), new TextRun({ text: ` - ${exp.company || ''}`, italics: true })] }));
            if (exp.date) children.push(new Paragraph({ text: exp.date, italics: true }));
            if (exp.description) exp.description.split('\n').forEach(line => { if (line.trim()) children.push(new Paragraph({ text: `• ${line.trim()}`, indent: { left: 360 } })); });
            children.push(new Paragraph({ text: '' }));
        });
    }
    if (state.projects && state.projects.length > 0) {
        children.push(new Paragraph({ text: 'PROJECTS', heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }));
        state.projects.forEach(proj => {
            children.push(new Paragraph({ children: [new TextRun({ text: proj.title || '', bold: true }), new TextRun({ text: proj.tech ? ` | ${proj.tech}` : '', italics: true })] }));
            if (proj.description) proj.description.split('\n').forEach(line => { if (line.trim()) children.push(new Paragraph({ text: `• ${line.trim()}`, indent: { left: 360 } })); });
            children.push(new Paragraph({ text: '' }));
        });
    }
    if (state.education.length > 0) {
        children.push(new Paragraph({ text: 'EDUCATION', heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }));
        state.education.forEach(edu => {
            children.push(new Paragraph({ children: [new TextRun({ text: edu.degree || '', bold: true }), new TextRun({ text: ` at ${edu.school || ''}` })] }));
            if (edu.date) children.push(new Paragraph({ text: edu.date, italics: true }));
        });
    }
    const doc = new Document({ sections: [{ properties: {}, children }] });
    Packer.toBlob(doc).then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${state.personalInfo.name || 'resume'}.docx`; a.click();
        window.URL.revokeObjectURL(url);
    });
}

function updateMobileThemeUI() {
    const isDark = document.body.classList.contains('dark-mode');
    const mobileIcon = document.querySelector('#mobile-theme-btn i');
    const mobileSpan = document.querySelector('#mobile-theme-btn span');
    if (mobileIcon) {
        mobileIcon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        if (mobileSpan) mobileSpan.textContent = isDark ? 'Light' : 'Dark';
    }
}

function initPreviewScaleObserver() {
    const area = document.querySelector('.preview-area');
    if (!area) return;
    
    const observer = new ResizeObserver(() => {
        if (typeof updatePreviewScale === 'function') {
            updatePreviewScale();
        }
    });
    observer.observe(area);
}
