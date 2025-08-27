// Padboard by voxpher - Main Application Logic
let pageCount = 1;
let currentDrawingMode = 'pen';
let isDrawing = false;

// Auto-save functionality
setInterval(() => {
    saveToLocalStorage();
}, 30000);

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    updatePageNumbers();
});

// Text formatting functions
function formatText(command) {
    document.execCommand(command, false, null);
    focusEditor();
}

function focusEditor() {
    const activeElement = document.activeElement;
    if (activeElement && activeElement.contentEditable === 'true') {
        activeElement.focus();
    }
}

function changeFontSize() {
    const size = document.getElementById('fontSize').value;
    document.execCommand('fontSize', false, '7');
    const fontElements = document.querySelectorAll('font[size="7"]');
    fontElements.forEach(element => {
        element.removeAttribute('size');
        element.style.fontSize = size + 'px';
    });
    focusEditor();
}

function changeFontFamily() {
    const font = document.getElementById('fontFamily').value;
    document.execCommand('fontName', false, font);
    focusEditor();
}

function changeFontColor() {
    const color = document.getElementById('fontColor').value;
    document.execCommand('foreColor', false, color);
    focusEditor();
}

// List functions
function insertNumberedList() {
    document.execCommand('insertOrderedList', false, null);
    focusEditor();
}

function insertBulletList() {
    document.execCommand('insertUnorderedList', false, null);
    focusEditor();
}

// Page management
function addNewPage() {
    pageCount++;
    const pagesContainer = document.getElementById('pagesContainer');
    const newPage = document.createElement('div');
    newPage.className = 'page';
    newPage.setAttribute('data-page', pageCount);
    newPage.innerHTML = `
        <div class="page-content" contenteditable="true">
            Start typing your notes here...
        </div>
        <div class="page-controls">
            <span class="page-number">Page ${pageCount}</span>
            <button class="btn btn-secondary" onclick="removePage(${pageCount})">Remove</button>
        </div>
    `;
    pagesContainer.appendChild(newPage);
    updatePageNumbers();
}

function removePage(pageNumber) {
    if (pageCount <= 1) {
        alert('Cannot remove the last page!');
        return;
    }
    
    const pageToRemove = document.querySelector(`[data-page="${pageNumber}"]`);
    if (pageToRemove) {
        pageToRemove.remove();
        pageCount--;
        updatePageNumbers();
    }
}

function updatePageNumbers() {
    const pages = document.querySelectorAll('.page');
    pages.forEach((page, index) => {
        const pageNumber = page.querySelector('.page-number');
        if (pageNumber) {
            pageNumber.textContent = `Page ${index + 1}`;
        }
        page.setAttribute('data-page', index + 1);
    });
}

// Window functions
function openAIWindow() {
    const aiWindow = document.getElementById('aiWindow');
    aiWindow.style.display = 'block';
    PadboardWindows.bringToFront(aiWindow);
}

// Local storage functions
function saveToLocalStorage() {
    const pages = document.querySelectorAll('.page-content');
    const data = [];
    pages.forEach((page, index) => {
        data.push({
            content: page.innerHTML,
            pageNumber: index + 1
        });
    });
    localStorage.setItem('padboard-data', JSON.stringify(data));
    console.log('Data saved to localStorage');
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('padboard-data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            const pagesContainer = document.getElementById('pagesContainer');
            pagesContainer.innerHTML = '';
            
            data.forEach((pageData, index) => {
                const newPage = document.createElement('div');
                newPage.className = 'page';
                newPage.setAttribute('data-page', index + 1);
                newPage.innerHTML = `
                    <div class="page-content" contenteditable="true">${pageData.content}</div>
                    <div class="page-controls">
                        <span class="page-number">Page ${index + 1}</span>
                        <button class="btn btn-secondary" onclick="removePage(${index + 1})">Remove</button>
                    </div>
                `;
                pagesContainer.appendChild(newPage);
            });
            
            pageCount = data.length;
            console.log('Data loaded from localStorage');
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }
}

// ===== WORKING PDF EXPORT WITH STYLES =====
async function exportAllPagesToPDF() {
    if (!window.html2pdf) {
        alert('PDF library not loaded. Please refresh the page.');
        return;
    }

    const pages = document.querySelectorAll('.page');
    if (!pages.length) {
        alert('No pages found to export.');
        return;
    }

    // Create export container with preserved styles
    const exportContainer = document.createElement('div');
    exportContainer.style.cssText = `
        font-family: 'Poppins', Arial, sans-serif;
        background: white;
        padding: 20px;
        width: 210mm;
        margin: 0 auto;
    `;

    // Clone each page with all styles preserved
    pages.forEach((page, index) => {
        const pageClone = page.cloneNode(true);
        pageClone.style.cssText += `
            page-break-after: ${index < pages.length - 1 ? 'always' : 'avoid'};
            margin-bottom: 20px;
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: none;
            border: none;
        `;
        
        // Ensure all text formatting is preserved
        const elements = pageClone.querySelectorAll('*');
        elements.forEach(el => {
            const computedStyle = window.getComputedStyle(el);
            el.style.fontFamily = computedStyle.fontFamily;
            el.style.fontSize = computedStyle.fontSize;
            el.style.fontWeight = computedStyle.fontWeight;
            el.style.fontStyle = computedStyle.fontStyle;
            el.style.textDecoration = computedStyle.textDecoration;
            el.style.color = computedStyle.color;
        });
        
        exportContainer.appendChild(pageClone);
    });

    // Temporarily add to document for rendering
    exportContainer.style.position = 'fixed';
    exportContainer.style.top = '-9999px';
    exportContainer.style.left = '-9999px';
    document.body.appendChild(exportContainer);

    const options = {
        margin: 10,
        filename: `Padboard-Notes-${new Date().toISOString().slice(0,10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            letterRendering: true
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
        }
    };

    try {
        await html2pdf().set(options).from(exportContainer).save();
        console.log('PDF exported successfully with styles');
    } catch (error) {
        console.error('PDF export error:', error);
        alert('Error exporting PDF. Please try again.');
    } finally {
        document.body.removeChild(exportContainer);
    }
}

// ===== PDF UPLOAD AND VIEWER =====
const PDFViewer = {
    pdf: null,
    currentPage: 1,
    scale: 1.5,
    
    async loadFile(file) {
        if (!pdfjsLib) {
            alert('PDF.js library not loaded. Please refresh the page.');
            return;
        }
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            this.pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
            this.currentPage = 1;
            await this.renderPage();
            this.updatePageInfo();
            console.log(`PDF loaded successfully: ${this.pdf.numPages} pages`);
        } catch (error) {
            console.error('Error loading PDF:', error);
            alert('Error loading PDF file. Please try a different file.');
        }
    },
    
    async renderPage() {
        if (!this.pdf) return;
        
        try {
            const page = await this.pdf.getPage(this.currentPage);
            const viewport = page.getViewport({ scale: this.scale });
            
            const canvas = document.getElementById('pdfCanvas');
            const context = canvas.getContext('2d');
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            console.log(`Rendered page ${this.currentPage}`);
        } catch (error) {
            console.error('Error rendering page:', error);
        }
    },
    
    async previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            await this.renderPage();
            this.updatePageInfo();
        }
    },
    
    async nextPage() {
        if (this.pdf && this.currentPage < this.pdf.numPages) {
            this.currentPage++;
            await this.renderPage();
            this.updatePageInfo();
        }
    },
    
    async zoomIn() {
        this.scale *= 1.2;
        await this.renderPage();
    },
    
    async zoomOut() {
        this.scale /= 1.2;
        await this.renderPage();
    },
    
    async resetZoom() {
        this.scale = 1.5;
        await this.renderPage();
    },
    
    updatePageInfo() {
        const info = document.getElementById('pdfPageInfo');
        if (info && this.pdf) {
            info.textContent = `Page ${this.currentPage} of ${this.pdf.numPages}`;
        }
    }
};

function openPDFUploadWindow() {
    const window = document.getElementById('pdfUploadWindow');
    if (window) {
        window.style.display = 'block';
        if (window.PadboardWindows && window.PadboardWindows.bringToFront) {
            window.PadboardWindows.bringToFront(window);
        }
        console.log('PDF upload window opened');
    }
}

// Wire Save PDF button and PDF file input on page load
document.addEventListener('DOMContentLoaded', function() {
    // Wire Save PDF button
    const savePdfBtn = document.getElementById('savePdfBtn');
    if (savePdfBtn) {
        savePdfBtn.onclick = exportAllPagesToPDF;
        console.log('PDF export function connected');
    }
    
    // Wire PDF file input
    const fileInput = document.getElementById('pdfFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type === 'application/pdf') {
                PDFViewer.loadFile(file);
            } else if (file) {
                alert('Please select a valid PDF file.');
            }
        });
        console.log('PDF file input wired');
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
            case 'b':
                e.preventDefault();
                formatText('bold');
                break;
            case 'i':
                e.preventDefault();
                formatText('italic');
                break;
            case 'u':
                e.preventDefault();
                formatText('underline');
                break;
            case 's':
                e.preventDefault();
                exportAllPagesToPDF();
                break;
            case 'n':
                e.preventDefault();
                addNewPage();
                break;
            case 'd':
                e.preventDefault();
                openDrawingWindow();
                break;
        }
    }
});
