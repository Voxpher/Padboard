// Padboard by voxpher - Canvas Drawing Module

// Drawing variables
let canvas, ctx;
let currentDrawingMode = 'pen';
let isDrawing = false;
let drawingHistory = [];
let historyIndex = -1;
let lastX = 0;
let lastY = 0;

// Initialize canvas when DOM is loaded
function initializeCanvas() {
    canvas = document.getElementById('drawingCanvas');
    if (!canvas) {
        console.error('Drawing canvas not found!');
        return;
    }
    
    ctx = canvas.getContext('2d');
    
    // Set default drawing properties
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 1.0;
    
    // Add event listeners
    setupCanvasEventListeners();
    
    // Save initial state
    saveDrawingState();
    
    console.log('Drawing canvas initialized');
}

function setupCanvasEventListeners() {
    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Prevent scrolling when drawing on mobile
    canvas.addEventListener('touchstart', (e) => e.preventDefault());
    canvas.addEventListener('touchmove', (e) => e.preventDefault());
}

// Drawing functions
function startDrawing(e) {
    isDrawing = true;
    const coords = getCanvasCoordinates(e);
    lastX = coords.x;
    lastY = coords.y;
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    
    // Apply drawing mode settings
    applyDrawingMode();
}

function draw(e) {
    if (!isDrawing) return;
    
    const coords = getCanvasCoordinates(e);
    
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    
    lastX = coords.x;
    lastY = coords.y;
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        ctx.beginPath(); // Start a new path for next drawing
        saveDrawingState();
    }
}

function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

// Touch event handlers
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function handleTouchEnd(e) {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    canvas.dispatchEvent(mouseEvent);
}

// Drawing mode functions
function setDrawingMode(mode) {
    currentDrawingMode = mode;
    
    // Update UI
    document.querySelectorAll('.canvas-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.canvas-btn').classList.add('active');
    
    applyDrawingMode();
    console.log('Drawing mode changed to:', mode);
}

function applyDrawingMode() {
    switch (currentDrawingMode) {
        case 'pen':
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = document.getElementById('penColor').value;
            ctx.lineWidth = document.getElementById('penSize').value;
            break;
            
        case 'eraser':
            ctx.globalCompositeOperation = 'destination-out';
            ctx.globalAlpha = 1.0;
            ctx.lineWidth = 20;
            break;
            
        case 'highlighter':
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 15;
            break;
    }
}

// Color and size controls
function changePenColor() {
    const color = document.getElementById('penColor').value;
    if (currentDrawingMode === 'pen') {
        ctx.strokeStyle = color;
    }
    console.log('Pen color changed to:', color);
}

function changePenSize() {
    const size = document.getElementById('penSize').value;
    if (currentDrawingMode === 'pen') {
        ctx.lineWidth = size;
    }
    console.log('Pen size changed to:', size);
}

// History management
function saveDrawingState() {
    historyIndex++;
    
    // Remove any future history if we're not at the end
    if (historyIndex < drawingHistory.length) {
        drawingHistory.splice(historyIndex);
    }
    
    // Save current canvas state
    drawingHistory.push(canvas.toDataURL());
    
    // Limit history to prevent memory issues
    if (drawingHistory.length > 50) {
        drawingHistory.shift();
        historyIndex--;
    }
    
    console.log('Drawing state saved. History length:', drawingHistory.length);
}

function undoDrawing() {
    if (historyIndex > 0) {
        historyIndex--;
        restoreDrawingState();
        console.log('Undo performed. History index:', historyIndex);
    } else {
        console.log('Nothing to undo');
    }
}

function redoDrawing() {
    if (historyIndex < drawingHistory.length - 1) {
        historyIndex++;
        restoreDrawingState();
        console.log('Redo performed. History index:', historyIndex);
    } else {
        console.log('Nothing to redo');
    }
}

function restoreDrawingState() {
    const img = new Image();
    img.onload = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
    img.src = drawingHistory[historyIndex];
}

function clearCanvas() {
    if (confirm('Are you sure you want to clear the entire canvas?')) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveDrawingState();
        console.log('Canvas cleared');
    }
}

// Canvas utilities
function resizeCanvas(width, height) {
    // Save current drawing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Resize canvas
    canvas.width = width;
    canvas.height = height;
    
    // Restore drawing
    ctx.putImageData(imageData, 0, 0);
    
    // Reapply settings
    applyDrawingMode();
    
    console.log('Canvas resized to:', width, 'x', height);
}

function exportCanvasAsImage() {
    const link = document.createElement('a');
    link.download = `padboard-sketch-${new Date().getTime()}.png`;
    link.href = canvas.toDataURL();
    link.click();
    
    console.log('Canvas exported as image');
}

function importImageToCanvas(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            saveDrawingState();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    
    console.log('Importing image to canvas');
}

// Drawing window functions
function openDrawingWindow() {
    const drawingWindow = document.getElementById('drawingWindow');
    drawingWindow.style.display = 'block';
    
    // Initialize canvas if not already done
    if (!canvas) {
        setTimeout(initializeCanvas, 100);
    }
    
    console.log('Drawing window opened');
}

// Advanced drawing features
function addText() {
    const text = prompt('Enter text to add:');
    if (text) {
        ctx.font = '20px Poppins';
        ctx.fillStyle = document.getElementById('penColor').value;
        ctx.fillText(text, 50, 50);
        saveDrawingState();
    }
}

function drawShape(shape) {
    // This could be extended to draw predefined shapes
    console.log('Drawing shape:', shape);
    // Implementation would depend on specific shape requirements
}

// Export drawing functions for use by other modules
window.PadboardCanvas = {
    initializeCanvas,
    setDrawingMode,
    changePenColor,
    changePenSize,
    undoDrawing,
    redoDrawing,
    clearCanvas,
    openDrawingWindow,
    resizeCanvas,
    exportCanvasAsImage,
    importImageToCanvas,
    addText,
    drawShape
};