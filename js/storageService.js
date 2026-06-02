let appState = {
    currentId: 'default',
    resumes: {
        'default': {
            name: 'Default Resume',
            personalInfo: { name: '', title: '', email: '', phone: '', location: '', linkedin: '', github: '', photo: '' },
            summary: '',
            experience: [],
            education: [],
            skills: [],
            projects: [],
            template: 'template-modern',
            theme: 'light',
            atsScore: 0,
            targetRole: '',
            jobDescription: '',
            maxPages: 1,
            overflowStrategy: 'shrink',
            minFontScale: 0.8, // corresponds to ~10pt minimum readable size (relative to base)
            strictLayout: true, // enforce maxPages limit on export
            manualBreaks: [], // array of section identifiers where user inserted page breaks
            suggestedRemovals: [], // optional sections suggested for removal when overflow
            hobbies: [], // optional hobby entries
            certifications: [], // optional certifications
            extraActivities: [] // optional extra activities
        }
    }
};

// This is the global reference that the rest of the app uses
let state = appState.resumes[appState.currentId];

function saveData() {
    try { 
        localStorage.setItem('aiResumeManager_v1', JSON.stringify(appState)); 
    } catch(e) {}
}

function loadData() {
    try {
        // Toggle the warning card depending on whether the content fits in the chosen limit
        if (finalOverflow) {
            // Suggest optional sections to remove if overflow persists
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

        // Function to suggest removal of optional sections
        function suggestOptionalSections() {
            const optionalSections = [
                { key: 'hobbies', name: 'Hobbies' },
                { key: 'certifications', name: 'Certifications' },
                { key: 'extraActivities', name: 'Extra Activities' }
            ];
            const present = optionalSections.filter(sec => state[sec.key] && state[sec.key].length > 0);
            if (present.length === 0) return;
            let msg = 'Your resume exceeds the page limit. Consider removing optional sections:\n';
            present.forEach(sec => { msg += `- ${sec.name}\n`; });
            msg += 'Do you want to remove them now?';
            if (confirm(msg)) {
                present.forEach(sec => { state[sec.key] = []; });
                saveData();
                // Re-render after removal
                updateAndRender();
            }
        }
        const saved = localStorage.getItem('aiResumeManager_v1');
        if (saved) {
            const parsed = JSON.parse(saved);
            appState.currentId = parsed.currentId || 'default';
            appState.resumes = parsed.resumes || appState.resumes;
            
            // Ensure compatibility with older schemas
            Object.keys(appState.resumes).forEach(id => {
                const res = appState.resumes[id];
                if (res.maxPages === undefined) res.maxPages = 1;
                if (res.overflowStrategy === undefined) res.overflowStrategy = 'shrink';
            });
            
            state = appState.resumes[appState.currentId];
        }
    } catch(e) { console.error('Error loading data', e); }
}

function switchResume(id) {
    if (appState.resumes[id]) {
        appState.currentId = id;
        state = appState.resumes[id];
        saveData();
        location.reload(); 
    }
}

function createNewResume(name) {
    const id = 'res_' + Date.now();
    appState.resumes[id] = {
        name: name || 'Untitled Resume',
        personalInfo: { ...state.personalInfo }, 
        summary: '',
        experience: [],
        education: [],
        skills: [],
        projects: [],
        template: 'template-modern',
        theme: 'light',
        atsScore: 0,
        targetRole: '',
        jobDescription: '',
        maxPages: 1,
        overflowStrategy: 'shrink',
        hobbies: [],
        certifications: [],
        extraActivities: []
    };
    appState.currentId = id;
    state = appState.resumes[id];
    saveData();
    location.reload();
}

function deleteResume(id) {
    if (id === 'default') return alert("Cannot delete the default resume.");
    if (confirm("Are you sure you want to delete this draft?")) {
        delete appState.resumes[id];
        appState.currentId = 'default';
        saveData();
        location.reload();
    }
}

function clearData() {
    if (confirm("This will permanently delete ALL your saved resumes and drafts. Are you sure?")) {
        try { localStorage.removeItem('aiResumeManager_v1'); } catch(e) {}
        location.reload();
    }
}
