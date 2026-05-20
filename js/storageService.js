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
            jobDescription: ''
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
        const saved = localStorage.getItem('aiResumeManager_v1');
        if (saved) {
            const parsed = JSON.parse(saved);
            appState.currentId = parsed.currentId || 'default';
            appState.resumes = parsed.resumes || appState.resumes;
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
        jobDescription: ''
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
