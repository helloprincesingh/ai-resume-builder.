let loadingOverlay;

function initFormHandlers() {
    loadingOverlay = document.getElementById('ai-loading');
    setupAccordions();
    setupSidebarNav();
    setupPersonalInputs();
    setupPhotoUpload();
    setupSummary();
    setupDynamicLists();
    setupSkills();
    populateFormFields();
    setupTargetControls();
}

function showLoading(show) {
    if (show) loadingOverlay.classList.remove('hidden');
    else loadingOverlay.classList.add('hidden');
}

function updateAndRender() {
    saveData();
    renderPreview();
    updateATSScore();
}

function setupAccordions() {
    document.querySelectorAll('.section-title').forEach(header => {
        header.addEventListener('click', () => header.parentElement.classList.toggle('open'));
    });
}

function setupSidebarNav() {
    const navItems = document.querySelectorAll('.side-nav .nav-item[href^="#"]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.form-section').forEach(sec => sec.classList.remove('open'));
            const targetSec = document.getElementById(item.getAttribute('href').substring(1));
            if (targetSec) { targetSec.classList.add('open'); targetSec.scrollIntoView({ behavior: 'smooth' }); }
        });
    });
}

function populateFormFields() {
    const p = state.personalInfo;
    ['name','title','email','phone','location','linkedin','github'].forEach(f => {
        const el = document.getElementById(`pi-${f}`);
        if (el && p[f]) el.value = p[f];
    });
    if (state.summary) document.getElementById('summary-text').value = state.summary;
    if (state.targetRole) document.getElementById('target-role').value = state.targetRole;
    if (state.jobDescription) document.getElementById('job-description').value = state.jobDescription;
    if (p.photo) document.getElementById('remove-photo-btn').classList.remove('hidden');
}

function setupPersonalInputs() {
    ['name','title','email','phone','location','linkedin','github'].forEach(field => {
        const el = document.getElementById(`pi-${field}`);
        if (el) {
            el.addEventListener('input', (e) => {
                if (el.checkValidity()) { state.personalInfo[field] = e.target.value; updateAndRender(); }
                else if (el.nextElementSibling) el.nextElementSibling.textContent = el.validationMessage;
            });
        }
    });
}

function setupPhotoUpload() {
    const fileInput = document.getElementById('pi-photo');
    const removeBtn = document.getElementById('remove-photo-btn');
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) { state.personalInfo.photo = event.target.result; removeBtn.classList.remove('hidden'); updateAndRender(); };
            reader.readAsDataURL(file);
        }
    });
    removeBtn.addEventListener('click', () => { state.personalInfo.photo = ''; fileInput.value = ''; removeBtn.classList.add('hidden'); updateAndRender(); });
}

function makeSortable(containerId, arrayRef, renderFn) {
    const container = document.getElementById(containerId);
    container.addEventListener('dragstart', (e) => { if (e.target.classList.contains('dynamic-item')) { e.target.setAttribute('data-dragging-idx', e.target.getAttribute('data-idx')); e.target.classList.add('dragging'); } });
    container.addEventListener('dragend', (e) => { if (e.target.classList.contains('dynamic-item')) e.target.classList.remove('dragging'); });
    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        const after = getDragAfterElement(container, e.clientY);
        const draggable = document.querySelector('.dragging');
        if (draggable) { if (after == null) container.appendChild(draggable); else container.insertBefore(draggable, after); }
    });
    container.addEventListener('drop', (e) => {
        e.preventDefault();
        const items = [...container.querySelectorAll('.dynamic-item')];
        const newArr = items.map(item => arrayRef[parseInt(item.getAttribute('data-idx'))]);
        arrayRef.length = 0; arrayRef.push(...newArr);
        updateAndRender(); renderFn();
    });
}

function getDragAfterElement(container, y) {
    return [...container.querySelectorAll('.dynamic-item:not(.dragging)')].reduce((closest, child) => {
        const offset = y - child.getBoundingClientRect().top - child.getBoundingClientRect().height / 2;
        return (offset < 0 && offset > closest.offset) ? { offset, element: child } : closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function setupDynamicLists() {
    // Experience
    const expList = document.getElementById('experience-list');
    function renderExp() {
        expList.innerHTML = '';
        state.experience.forEach((exp, index) => {
            const div = document.createElement('div');
            div.className = 'dynamic-item'; div.draggable = true; div.setAttribute('data-idx', index);
            div.innerHTML = `<i class="fa-solid fa-grip-vertical drag-handle"></i><button type="button" class="remove-item-btn" data-idx="${index}"><i class="fa-solid fa-times"></i></button><input type="text" placeholder="Job Title" class="exp-title" value="${exp.title||''}"><input type="text" placeholder="Company" class="exp-company" value="${exp.company||''}"><input type="text" placeholder="Dates" class="exp-date" value="${exp.date||''}"><div class="textarea-container"><textarea placeholder="Description" rows="3" class="exp-desc">${exp.description||''}</textarea><button type="button" class="btn-improve improve-exp-btn" title="Improve with AI"><i class="fa-solid fa-bolt"></i></button></div>`;
            div.querySelector('.exp-title').addEventListener('input', (e) => { state.experience[index].title = e.target.value; updateAndRender(); });
            div.querySelector('.exp-company').addEventListener('input', (e) => { state.experience[index].company = e.target.value; updateAndRender(); });
            div.querySelector('.exp-date').addEventListener('input', (e) => { state.experience[index].date = e.target.value; updateAndRender(); });
            const descArea = div.querySelector('.exp-desc');
            descArea.addEventListener('input', (e) => { state.experience[index].description = e.target.value; updateAndRender(); });
            div.querySelector('.improve-exp-btn').addEventListener('click', async () => {
                const userText = descArea.value.trim();
                const targetRole = document.getElementById('target-role')?.value || '';
                const jobDesc = document.getElementById('job-description')?.value || '';
                const title = div.querySelector('.exp-title').value || 'Software Engineer';
                const company = div.querySelector('.exp-company').value || 'Tech Solutions';

                showLoading(true);
                try {
                    if (!userText) {
                        // Generate from scratch if empty
                        const generated = await generateBullets(title, company, targetRole, jobDesc);
                        if (generated) {
                            descArea.value = generated;
                            state.experience[index].description = generated;
                            updateAndRender();
                        }
                    } else {
                        // Improve existing text
                        const result = await fixGrammar(userText, 'Experience', targetRole, jobDesc);
                        if (result) {
                            showGrammarModal(result, descArea, (text) => {
                                state.experience[index].description = text;
                                updateAndRender();
                            });
                        }
                    }
                } finally {
                    showLoading(false);
                }
            });
            div.querySelector('.remove-item-btn').addEventListener('click', () => { state.experience.splice(index, 1); renderExp(); updateAndRender(); });
            expList.appendChild(div);
        });
    }
    document.getElementById('add-experience-btn').addEventListener('click', () => { state.experience.push({ title:'', company:'', date:'', description:'' }); renderExp(); updateAndRender(); });
    renderExp(); makeSortable('experience-list', state.experience, renderExp);

    // Education
    const eduList = document.getElementById('education-list');
    function renderEdu() {
        eduList.innerHTML = '';
        state.education.forEach((edu, index) => {
            const div = document.createElement('div');
            div.className = 'dynamic-item'; div.draggable = true; div.setAttribute('data-idx', index);
            div.innerHTML = `<i class="fa-solid fa-grip-vertical drag-handle"></i><button type="button" class="remove-item-btn" data-idx="${index}"><i class="fa-solid fa-times"></i></button><input type="text" placeholder="Degree" class="edu-degree" value="${edu.degree||''}"><input type="text" placeholder="School" class="edu-school" value="${edu.school||''}"><input type="text" placeholder="Year" class="edu-date" value="${edu.date||''}">`;
            div.querySelector('.edu-degree').addEventListener('input', (e) => { state.education[index].degree = e.target.value; updateAndRender(); });
            div.querySelector('.edu-school').addEventListener('input', (e) => { state.education[index].school = e.target.value; updateAndRender(); });
            div.querySelector('.edu-date').addEventListener('input', (e) => { state.education[index].date = e.target.value; updateAndRender(); });
            div.querySelector('.remove-item-btn').addEventListener('click', () => { state.education.splice(index, 1); renderEdu(); updateAndRender(); });
            eduList.appendChild(div);
        });
    }
    document.getElementById('add-education-btn').addEventListener('click', () => { state.education.push({ degree:'', school:'', date:'' }); renderEdu(); updateAndRender(); });
    renderEdu(); makeSortable('education-list', state.education, renderEdu);

    // Projects
    const projList = document.getElementById('projects-list');
    function renderProj() {
        projList.innerHTML = '';
        state.projects.forEach((proj, index) => {
            const div = document.createElement('div');
            div.className = 'dynamic-item'; div.draggable = true; div.setAttribute('data-idx', index);
            div.innerHTML = `<i class="fa-solid fa-grip-vertical drag-handle"></i><button type="button" class="remove-item-btn" data-idx="${index}"><i class="fa-solid fa-times"></i></button><input type="text" placeholder="Project Name" class="proj-title" value="${proj.title||''}"><input type="text" placeholder="Link / Tech Stack" class="proj-tech" value="${proj.tech||''}"><div class="textarea-container"><textarea placeholder="Description" rows="2" class="proj-desc">${proj.description||''}</textarea><button type="button" class="btn-improve improve-proj-btn" title="Improve with AI"><i class="fa-solid fa-bolt"></i></button></div>`;
            div.querySelector('.proj-title').addEventListener('input', (e) => { state.projects[index].title = e.target.value; updateAndRender(); });
            div.querySelector('.proj-tech').addEventListener('input', (e) => { state.projects[index].tech = e.target.value; updateAndRender(); });
            const descArea = div.querySelector('.proj-desc');
            descArea.addEventListener('input', (e) => { state.projects[index].description = e.target.value; updateAndRender(); });
            div.querySelector('.improve-proj-btn').addEventListener('click', async () => {
                const userText = descArea.value.trim();
                const targetRole = document.getElementById('target-role')?.value || '';
                const jobDesc = document.getElementById('job-description')?.value || '';
                const projName = div.querySelector('.proj-title').value || 'AI Project';
                const tech = div.querySelector('.proj-tech').value || 'React, Node.js';

                showLoading(true);
                try {
                    if (!userText) {
                        // Generate from scratch if empty
                        const generated = await generateBullets(projName, tech, targetRole, jobDesc);
                        if (generated) {
                            descArea.value = generated;
                            state.projects[index].description = generated;
                            updateAndRender();
                        }
                    } else {
                        // Improve existing text
                        const result = await fixGrammar(userText, 'Projects', targetRole, jobDesc);
                        if (result) {
                            showGrammarModal(result, descArea, (text) => {
                                state.projects[index].description = text;
                                updateAndRender();
                            });
                        }
                    }
                } finally {
                    showLoading(false);
                }
            });
            div.querySelector('.remove-item-btn').addEventListener('click', () => { state.projects.splice(index, 1); renderProj(); updateAndRender(); });
            projList.appendChild(div);
        });
    }
    document.getElementById('add-project-btn').addEventListener('click', () => { state.projects.push({ title:'', tech:'', description:'' }); renderProj(); updateAndRender(); });
    renderProj(); makeSortable('projects-list', state.projects, renderProj);
}

function setupSkills() {
    const input = document.getElementById('skill-input');
    const container = document.getElementById('skills-tags-container');
    const aiBtn = document.getElementById('enhance-skills-btn');
    
    function isDuplicate(skill) {
        const clean = skill.trim().toLowerCase().replace(/[.,!]$/, '');
        return state.skills.some(s => s.trim().toLowerCase().replace(/[.,!]$/, '') === clean);
    }

    function renderSkills() {
        container.innerHTML = '';
        state.skills.forEach((skill, index) => {
            const tag = document.createElement('span');
            tag.className = 'skill-tag';
            tag.innerHTML = `${skill} <i class="fa-solid fa-times" data-idx="${index}"></i>`;
            container.appendChild(tag);
        });
        container.querySelectorAll('i').forEach(icon => {
            icon.addEventListener('click', (e) => { 
                state.skills.splice(parseInt(e.target.getAttribute('data-idx')), 1); 
                renderSkills(); 
                updateAndRender(); 
            });
        });
    }

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { 
            e.preventDefault(); 
            const val = input.value.trim(); 
            if (val && !isDuplicate(val)) { 
                state.skills.push(val); 
                input.value = ''; 
                renderSkills(); 
                updateAndRender(); 
            } else {
                input.value = ''; // Just clear if duplicate
            }
        }
    });

    aiBtn.addEventListener('click', async () => {
        showLoading(true);
        const result = await callGeminiAPI(`Suggest 5 key professional skills for a ${state.personalInfo.title||'professional'}. Comma separated. No markdown.`);
        if (result) { 
            const newSkills = result.split(',')
                .map(s => s.trim())
                .filter(s => s && !isDuplicate(s));
            state.skills.push(...newSkills); 
            renderSkills(); 
            updateAndRender(); 
        }
        showLoading(false);
    });
    renderSkills();
}

function setupSummary() {
    const summaryText = document.getElementById('summary-text');
    const genBtn = document.getElementById('generate-summary-btn');
    const improveBtn = document.querySelector('.btn-improve[data-target="summary-text"]');
    const dropdown = document.getElementById('summary-suggestions');
    let debounceTimer;

    summaryText.addEventListener('input', (e) => {
        state.summary = e.target.value; updateAndRender();
        /*
        clearTimeout(debounceTimer); dropdown.style.display = 'none';
        const val = e.target.value;
        if (val.length > 10 && val.endsWith(' ')) {
            debounceTimer = setTimeout(async () => {
                const words = await getAutocomplete(val);
                if (words && words.length > 0) {
                    dropdown.innerHTML = '';
                    words.forEach(word => {
                        const li = document.createElement('li'); li.textContent = word;
                        li.addEventListener('click', () => { summaryText.value = val + word + ' '; state.summary = summaryText.value; dropdown.style.display = 'none'; updateAndRender(); });
                        dropdown.appendChild(li);
                    });
                    dropdown.style.display = 'block';
                }
            }, 500);
        }
        */
    });
    document.addEventListener('click', (e) => { if (e.target !== dropdown && e.target !== summaryText) dropdown.style.display = 'none'; });
    genBtn.addEventListener('click', async () => {
        showLoading(true);
        const result = await callGeminiAPI(`Write a professional resume summary for a ${state.personalInfo.title||'professional'} with expertise in ${state.skills.join(', ')||'various skills'}. 3-4 sentences, impactful, action-oriented. Return only the summary text without markdown or quotes.`);
        if (result) { summaryText.value = result; state.summary = result; updateAndRender(); }
        showLoading(false);
    });
    if (improveBtn) {
        improveBtn.addEventListener('click', async () => {
            if (!summaryText.value.trim()) return;
            showLoading(true);
            const targetRole = document.getElementById('target-role')?.value || '';
            const jobDesc = document.getElementById('job-description')?.value || '';
            const result = await fixGrammar(summaryText.value, 'Professional Summary', targetRole, jobDesc);
            showLoading(false);
            if (result) showGrammarModal(result, summaryText, (text) => { state.summary = text; updateAndRender(); });
        });
    }
}

function setupTargetControls() {
    const roleInput = document.getElementById('target-role');
    const jdInput = document.getElementById('job-description');
    
    if (roleInput) {
        roleInput.addEventListener('input', (e) => {
            state.targetRole = e.target.value;
            saveData();
        });
    }
    
    if (jdInput) {
        jdInput.addEventListener('input', (e) => {
            state.jobDescription = e.target.value;
            saveData();
        });
    }
}
