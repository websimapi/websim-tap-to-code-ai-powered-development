export class CodeRenderer {
    constructor() {
        this.panel = document.getElementById('code-panel');
        this.tabs = document.getElementById('file-tabs');
        this.display = document.getElementById('code-display');
    }
    
    render(project) {
        this.clearTabs();
        this.renderFiles(project.files);
        
        if (Object.keys(project.files).length > 0) {
            const firstFile = Object.keys(project.files)[0];
            this.showFile(firstFile, project.files[firstFile]);
        }
    }
    
    clearTabs() {
        this.tabs.innerHTML = '';
    }
    
    renderFiles(files) {
        Object.keys(files).forEach(filename => {
            const tab = document.createElement('button');
            tab.className = 'file-tab';
            tab.textContent = filename;
            tab.addEventListener('click', () => {
                this.showFile(filename, files[filename]);
                this.setActiveTab(tab);
            });
            this.tabs.appendChild(tab);
        });
    }
    
    showFile(filename, content) {
        this.display.textContent = content;
    }
    
    setActiveTab(activeTab) {
        document.querySelectorAll('.file-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        activeTab.classList.add('active');
    }
}

