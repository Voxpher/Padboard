// Padboard by voxpher - Window Management Module

// Window management variables
let isDragging = false;
let isResizing = false;
let dragStartX, dragStartY, dragElement;
let resizeStartX, resizeStartY, resizeElement;
let windowZIndex = 500;

// Initialize window management
document.addEventListener('DOMContentLoaded', function() {
    setupWindowManagement();
    positionWindows();
});

function setupWindowManagement() {
    // Add global mouse event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Window boundary constraints
    window.addEventListener('resize', handleWindowResize);
    
    console.log('Window management initialized');
}

// Drag functionality
function startDrag(e, windowId) {
    e.preventDefault();
    isDragging = true;
    dragElement = document.getElementById(windowId);
    
    if (!dragElement) return;
    
    const rect = dragElement.getBoundingClientRect();
    dragStartX = e.clientX - rect.left;
    dragStartY = e.clientY - rect.top;
    
    // Bring window to front
    bringToFront(dragElement);
    
    // Add dragging class for styling
    dragElement.classList.add('dragging');
}

function handleMouseMove(e) {
    if (isDragging && dragElement) {
        handleDragMove(e);
    }
    
    if (isResizing && resizeElement) {
        handleResizeMove(e);
    }
}

function handleDragMove(e) {
    const headerHeight = document.querySelector('.header').offsetHeight;
    const footerHeight = document.querySelector('.footer').offsetHeight;
    
    let newX = e.clientX - dragStartX;
    let newY = e.clientY - dragStartY;
    
    // Boundary constraints
    const maxX = window.innerWidth - dragElement.offsetWidth;
    const maxY = window.innerHeight - footerHeight - dragElement.offsetHeight;
    
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(headerHeight, Math.min(newY, maxY));
    
    dragElement.style.left = newX + 'px';
    dragElement.style.top = newY + 'px';
}

function handleMouseUp() {
    if (isDragging && dragElement) {
        dragElement.classList.remove('dragging');
    }
    
    isDragging = false;
    isResizing = false;
    dragElement = null;
    resizeElement = null;
}

// Resize functionality
function startResize(e, windowId) {
    e.preventDefault();
    e.stopPropagation();
    
    isResizing = true;
    resizeElement = document.getElementById(windowId);
    
    if (!resizeElement) return;
    
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    
    // Bring window to front
    bringToFront(resizeElement);
    
    resizeElement.classList.add('resizing');
}

function handleResizeMove(e) {
    if (!resizeElement) return;
    
    const deltaX = e.clientX - resizeStartX;
    const deltaY = e.clientY - resizeStartY;
    
    const currentWidth = resizeElement.offsetWidth;
    const currentHeight = resizeElement.offsetHeight;
    
    const newWidth = Math.max(300, currentWidth + deltaX);
    const newHeight = Math.max(200, currentHeight + deltaY);
    
    // Ensure window doesn't go off screen
    const maxWidth = window.innerWidth - resizeElement.offsetLeft - 20;
    const maxHeight = window.innerHeight - resizeElement.offsetTop - 60;
    
    const finalWidth = Math.min(newWidth, maxWidth);
    const finalHeight = Math.min(newHeight, maxHeight);
    
    resizeElement.style.width = finalWidth + 'px';
    resizeElement.style.height = finalHeight + 'px';
    
    // Special handling for drawing window
    if (resizeElement.id === 'drawingWindow') {
        resizeDrawingCanvas(finalWidth, finalHeight);
    }
    
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
}

function handleResizeEnd() {
    if (resizeElement) {
        resizeElement.classList.remove('resizing');
    }
}

// Window state management
function minimizeWindow(windowId) {
    const windowElement = document.getElementById(windowId);
    if (!windowElement) return;
    
    windowElement.style.display = 'none';
    
    // Add to minimized windows taskbar
    addToMinimizedTaskbar(windowId, getWindowTitle(windowElement));
    
    console.log('Window minimized:', windowId);
}

function restoreWindow(windowId) {
    const windowElement = document.getElementById(windowId);
    if (!windowElement) return;
    
    windowElement.style.display = 'block';
    bringToFront(windowElement);
    
    // Remove from minimized taskbar
    removeFromMinimizedTaskbar(windowId);
    
    console.log('Window restored:', windowId);
}

function toggleMaximize(windowId) {
    const windowElement = document.getElementById(windowId);
    if (!windowElement) return;
    
    const headerHeight = document.querySelector('.header').offsetHeight;
    const footerHeight = document.querySelector('.footer').offsetHeight;
    
    if (windowElement.classList.contains('maximized')) {
        // Restore to previous size
        restoreWindowSize(windowElement);
    } else {
        // Maximize window
        maximizeWindow(windowElement, headerHeight, footerHeight);
    }
    
    console.log('Window maximize toggled:', windowId);
}

function maximizeWindow(windowElement, headerHeight, footerHeight) {
    // Store current size and position
    windowElement.dataset.prevLeft = windowElement.style.left;
    windowElement.dataset.prevTop = windowElement.style.top;
    windowElement.dataset.prevWidth = windowElement.style.width;
    windowElement.dataset.prevHeight = windowElement.style.height;
    
    // Maximize
    windowElement.style.left = '20px';
    windowElement.style.top = (headerHeight + 20) + 'px';
    windowElement.style.width = (window.innerWidth - 420) + 'px'; // Leave space for sidebar
    windowElement.style.height = (window.innerHeight - headerHeight - footerHeight - 40) + 'px';
    
    windowElement.classList.add('maximized');
    
    // Special handling for drawing window
    if (windowElement.id === 'drawingWindow') {
        resizeDrawingCanvas(
            parseInt(windowElement.style.width) - 40,
            parseInt(windowElement.style.height) - 150
        );
    }
}

function restoreWindowSize(windowElement) {
    // Restore previous size and position
    windowElement.style.left = windowElement.dataset.prevLeft || '200px';
    windowElement.style.top = windowElement.dataset.prevTop || '150px';
    windowElement.style.width = windowElement.dataset.prevWidth || '600px';
    windowElement.style.height = windowElement.dataset.prevHeight || '500px';
    
    windowElement.classList.remove('maximized');
    
    // Special handling for drawing window
    if (windowElement.id === 'drawingWindow') {
        resizeDrawingCanvas(
            parseInt(windowElement.style.width) - 40,
            parseInt(windowElement.style.height) - 150
        );
    }
}

function closeWindow(windowId) {
    const windowElement = document.getElementById(windowId);
    if (!windowElement) return;
    
    windowElement.style.display = 'none';
    removeFromMinimizedTaskbar(windowId);
    
    console.log('Window closed:', windowId);
}

// Minimized taskbar management
function addToMinimizedTaskbar(windowId, title) {
    const taskbar = document.getElementById('minimizedWindows');
    if (!taskbar) return;
    
    // Remove if already exists
    removeFromMinimizedTaskbar(windowId);
    
    const minimizedWindow = document.createElement('div');
    minimizedWindow.className = 'minimized-window';
    minimizedWindow.dataset.windowId = windowId;
    minimizedWindow.innerHTML = `<i class="fas fa-window-minimize"></i> ${title}`;
    minimizedWindow.onclick = () => restoreWindow(windowId);
    
    taskbar.appendChild(minimizedWindow);
}

function removeFromMinimizedTaskbar(windowId) {
    const taskbar = document.getElementById('minimizedWindows');
    if (!taskbar) return;
    
    const minimizedWindow = taskbar.querySelector(`[data-window-id="${windowId}"]`);
    if (minimizedWindow) {
        minimizedWindow.remove();
    }
}

// Utility functions
function getWindowTitle(windowElement) {
    const titleElement = windowElement.querySelector('.window-header span');
    return titleElement ? titleElement.textContent : 'Window';
}

function bringToFront(windowElement) {
    windowZIndex++;
    windowElement.style.zIndex = windowZIndex;
}

function positionWindows() {
    const windows = ['drawingWindow', 'pdfWindow', 'aiWindow'];
    const headerHeight = document.querySelector('.header').offsetHeight;
    
    windows.forEach((windowId, index) => {
        const windowElement = document.getElementById(windowId);
        if (windowElement) {
            windowElement.style.left = (100 + index * 100) + 'px';
            windowElement.style.top = (headerHeight + 50 + index * 50) + 'px';
            windowElement.style.zIndex = 500 + index;
        }
    });
}

function handleWindowResize() {
    // Ensure all windows stay within bounds after window resize
    const headerHeight = document.querySelector('.header').offsetHeight;
    const footerHeight = document.querySelector('.footer').offsetHeight;
    
    document.querySelectorAll('.floating-window').forEach(window => {
        if (window.style.display === 'none') return;
        
        const rect = window.getBoundingClientRect();
        
        // Adjust horizontal position
        if (rect.right > window.innerWidth) {
            window.style.left = Math.max(0, window.innerWidth - window.offsetWidth - 20) + 'px';
        }
        
        // Adjust vertical position
        if (rect.bottom > window.innerHeight - footerHeight) {
            window.style.top = Math.max(headerHeight + 20, window.innerHeight - footerHeight - window.offsetHeight - 20) + 'px';
        }
        
        if (rect.top < headerHeight) {
            window.style.top = (headerHeight + 20) + 'px';
        }
    });
}

// Special handling for drawing canvas resize
function resizeDrawingCanvas(windowWidth, windowHeight) {
    const canvas = document.getElementById('drawingCanvas');
    if (!canvas) return;
    
    const canvasWidth = Math.max(300, windowWidth - 60);
    const canvasHeight = Math.max(200, windowHeight - 180);
    
    // Use the canvas resize function from canvas.js if available
    if (window.PadboardCanvas && window.PadboardCanvas.resizeCanvas) {
        window.PadboardCanvas.resizeCanvas(canvasWidth, canvasHeight);
    } else {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
    }
}

// Window focus management
function focusWindow(windowId) {
    const windowElement = document.getElementById(windowId);
    if (windowElement && windowElement.style.display !== 'none') {
        bringToFront(windowElement);
        
        // Focus first input in window
        const firstInput = windowElement.querySelector('input, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

// Add click handlers to bring windows to front
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.floating-window').forEach(window => {
        window.addEventListener('mousedown', function() {
            bringToFront(this);
        });
    });
});

// Keyboard shortcuts for window management
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
            case 'm':
                e.preventDefault();
                // Minimize active window (you'd need to track active window)
                break;
            case 'w':
                e.preventDefault();
                // Close active window
                break;
        }
    }
    
    // Escape key to close windows
    if (e.key === 'Escape') {
        const visibleWindows = document.querySelectorAll('.floating-window[style*="block"]');
        if (visibleWindows.length > 0) {
            const topWindow = Array.from(visibleWindows).reduce((prev, current) => 
                parseInt(prev.style.zIndex || 0) > parseInt(current.style.zIndex || 0) ? prev : current
            );
            closeWindow(topWindow.id);
        }
    }
});

// Add custom styles for dragging and resizing
const windowStyles = document.createElement('style');
windowStyles.textContent = `
    .floating-window.dragging {
        opacity: 0.9;
        transform: rotate(1deg);
        transition: none;
    }
    
    .floating-window.resizing {
        transition: none;
    }
    
    .floating-window.maximized {
        transition: all 0.3s ease;
    }
    
    .window-header:hover {
        background: linear-gradient(45deg, #5a6fd8, #6b46a3);
    }
    
    .window-btn:hover {
        transform: scale(1.1);
    }
    
    .minimize-btn:hover { background: #ffed4e; }
    .maximize-btn:hover { background: #48ff48; }
    .close-btn:hover { background: #ff6b6b; }
    
    .resize-handle:hover {
        background: #5a6fd8;
        transform: scale(1.2);
    }
`;
document.head.appendChild(windowStyles);

// Export functions for global use
window.PadboardWindows = {
    startDrag,
    startResize,
    minimizeWindow,
    restoreWindow,
    toggleMaximize,
    closeWindow,
    focusWindow,
    bringToFront,
    positionWindows
};