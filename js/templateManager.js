function initTemplateManager() {
    const selector = document.getElementById('template-selector');
    selector.value = state.template;
    selector.addEventListener('change', (e) => {
        state.template = e.target.value;
        saveData();
        renderPreview();
    });
}
