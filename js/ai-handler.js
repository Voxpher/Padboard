// AI Handler - Google Gemini Integration
// Hardcoded API key for easy use - no setup required!
const GEMINI_API_KEY = 'AIzaSyBlauDhS9sbzQMxCOhXo0kGLousaWAmgB4';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyBlauDhS9sbzQMxCOhXo0kGLousaWAmgB4`;
// AI Chat functionality for sidebar
function handleAIInput(event) {
    if (event.key === 'Enter') {
        sendAIMessage();
    }
}

async function sendAIMessage() {
    const input = document.getElementById('aiInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat('user', message, 'aiChat');
    input.value = '';
    
    // Show typing indicator
    const typingId = addTypingIndicator('aiChat');
    
    try {
        // Check for special commands
        if (message.toLowerCase().includes('analyze notes') || message.toLowerCase().includes('analyze my notes')) {
            await analyzeNotes('aiChat', typingId);
            return;
        }
        
        if (message.toLowerCase().includes('study questions') || message.toLowerCase().includes('generate questions')) {
            await generateStudyQuestions('aiChat', typingId);
            return;
        }
        
        if (message.toLowerCase().includes('summarize') || message.toLowerCase().includes('summary')) {
            await summarizeNotes('aiChat', typingId);
            return;
        }
        
        // Regular AI chat
        const response = await callGeminiAPI(message);
        removeTypingIndicator(typingId);
        addMessageToChat('ai', response, 'aiChat');
        
    } catch (error) {
        removeTypingIndicator(typingId);
        addMessageToChat('ai', 'Sorry, I encountered an error. Please try again. Make sure you have an internet connection.', 'aiChat');
        console.error('AI Error:', error);
    }
}

// AI Chat functionality for window
function handleWindowAIInput(event) {
    if (event.key === 'Enter') {
        sendWindowAIMessage();
    }
}

async function sendWindowAIMessage() {
    const input = document.getElementById('windowAiInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to window chat
    addMessageToChat('user', message, 'windowAiChat');
    input.value = '';
    
    // Show typing indicator
    const typingId = addTypingIndicator('windowAiChat');
    
    try {
        // Check for special commands
        if (message.toLowerCase().includes('analyze notes') || message.toLowerCase().includes('analyze my notes')) {
            await analyzeNotes('windowAiChat', typingId);
            return;
        }
        
        if (message.toLowerCase().includes('study questions') || message.toLowerCase().includes('generate questions')) {
            await generateStudyQuestions('windowAiChat', typingId);
            return;
        }
        
        if (message.toLowerCase().includes('summarize') || message.toLowerCase().includes('summary')) {
            await summarizeNotes('windowAiChat', typingId);
            return;
        }
        
        // Regular AI chat
        const response = await callGeminiAPI(message);
        removeTypingIndicator(typingId);
        addMessageToChat('ai', response, 'windowAiChat');
        
    } catch (error) {
        removeTypingIndicator(typingId);
        addMessageToChat('ai', 'Sorry, I encountered an error. Please try again. Make sure you have an internet connection.', 'windowAiChat');
        console.error('AI Error:', error);
    }
}

// Core Gemini API call
async function callGeminiAPI(message) {
    try {
        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyBlauDhS9sbzQMxCOhXo0kGLousaWAmgB4", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: message
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Invalid response format from API');
        }
    } catch (error) {
        console.error('Gemini API Error:', error);
        if (error.message.includes('403')) {
            return 'API key might be invalid or quota exceeded. Please check your internet connection and try again.';
        } else if (error.message.includes('400')) {
            return 'There was an issue with the request format. Please try rephrasing your question.';
        } else {
            return 'Sorry, I\'m having trouble connecting to the AI service. Please check your internet connection and try again.';
        }
    }
}

// Analyze all notes
async function analyzeNotes(chatId, typingId) {
    const pages = document.querySelectorAll('.page-content');
    let allText = '';
    
    pages.forEach((page, index) => {
        const content = page.textContent || page.innerText || '';
        if (content.trim()) {
            allText += `Page ${index + 1}: ${content.trim()}\n\n`;
        }
    });
    
    if (!allText.trim()) {
        removeTypingIndicator(typingId);
        addMessageToChat('ai', 'I don\'t see any notes to analyze. Please write some notes first!', chatId);
        return;
    }
    
    const analysisPrompt = `Please analyze these notes and provide insights, key themes, and suggestions for improvement:\n\n${allText}`;
    
    try {
        const response = await callGeminiAPI(analysisPrompt);
        removeTypingIndicator(typingId);
        addMessageToChat('ai', '📊 **Notes Analysis:**\n\n' + response, chatId);
    } catch (error) {
        removeTypingIndicator(typingId);
        addMessageToChat('ai', 'Sorry, I couldn\'t analyze your notes right now. Please try again.', chatId);
    }
}

// Generate study questions
async function generateStudyQuestions(chatId, typingId) {
    const pages = document.querySelectorAll('.page-content');
    let allText = '';
    
    pages.forEach((page, index) => {
        const content = page.textContent || page.innerText || '';
        if (content.trim()) {
            allText += `Page ${index + 1}: ${content.trim()}\n\n`;
        }
    });
    
    if (!allText.trim()) {
        removeTypingIndicator(typingId);
        addMessageToChat('ai', 'I need some notes to generate study questions from. Please write some notes first!', chatId);
        return;
    }
    
    const questionPrompt = `Based on these notes, generate 5-8 study questions that would help someone review and understand the material better. Include a mix of recall, comprehension, and application questions:\n\n${allText}`;
    
    try {
        const response = await callGeminiAPI(questionPrompt);
        removeTypingIndicator(typingId);
        addMessageToChat('ai', '📚 **Study Questions:**\n\n' + response, chatId);
    } catch (error) {
        removeTypingIndicator(typingId);
        addMessageToChat('ai', 'Sorry, I couldn\'t generate study questions right now. Please try again.', chatId);
    }
}

// Summarize notes
async function summarizeNotes(chatId, typingId) {
    const pages = document.querySelectorAll('.page-content');
    let allText = '';
    
    pages.forEach((page, index) => {
        const content = page.textContent || page.innerText || '';
        if (content.trim()) {
            allText += `Page ${index + 1}: ${content.trim()}\n\n`;
        }
    });
    
    if (!allText.trim()) {
        removeTypingIndicator(typingId);
        addMessageToChat('ai', 'I don\'t see any notes to summarize. Please write some notes first!', chatId);
        return;
    }
    
    const summaryPrompt = `Please provide a concise summary of these notes, highlighting the main points and key takeaways:\n\n${allText}`;
    
    try {
        const response = await callGeminiAPI(summaryPrompt);
        removeTypingIndicator(typingId);
        addMessageToChat('ai', '📝 **Notes Summary:**\n\n' + response, chatId);
    } catch (error) {
        removeTypingIndicator(typingId);
        addMessageToChat('ai', 'Sorry, I couldn\'t summarize your notes right now. Please try again.', chatId);
    }
}

// Helper functions
function addMessageToChat(sender, message, chatId) {
    const chat = document.getElementById(chatId);
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    if (sender === 'user') {
        messageDiv.innerHTML = `<div class="message-content">${escapeHtml(message)}</div>`;
    } else {
        // Process AI message for better formatting
        const formattedMessage = formatAIMessage(message);
        messageDiv.innerHTML = `<div class="message-content">${formattedMessage}</div>`;
    }
    
    chat.appendChild(messageDiv);
    chat.scrollTop = chat.scrollHeight;
}

function formatAIMessage(message) {
    // Convert markdown-like formatting to HTML
    let formatted = escapeHtml(message);
    
    // Bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic text
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Code blocks (basic)
    formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
    
    return formatted;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function addTypingIndicator(chatId) {
    const chat = document.getElementById(chatId);
    const typingDiv = document.createElement('div');
    const typingId = 'typing-' + Date.now();
    typingDiv.id = typingId;
    typingDiv.className = 'message ai-message typing-indicator';
    typingDiv.innerHTML = `
        <div class="message-content">
            <span class="typing-dots">
                <span>.</span><span>.</span><span>.</span>
            </span>
            Thinking...
        </div>
    `;
    
    chat.appendChild(typingDiv);
    chat.scrollTop = chat.scrollHeight;
    
    return typingId;
}

function removeTypingIndicator(typingId) {
    const element = document.getElementById(typingId);
    if (element) {
        element.remove();
    }
}

// Initialize AI with welcome message
document.addEventListener('DOMContentLoaded', function() {
    // Add welcome messages with helpful tips
    setTimeout(() => {
        addMessageToChat('ai', 'Welcome to Padboard! 🎉 I\'m ready to help! Try asking me:\n\n• "Analyze my notes" - I\'ll review your content\n• "Generate study questions" - Create practice questions\n• "Summarize my notes" - Get key points\n• Or ask me anything else!', 'aiChat');
        
        if (document.getElementById('windowAiChat')) {
            addMessageToChat('ai', 'Advanced AI Analysis Window ready! 🚀\n\nI can help with complex questions, detailed analysis, and in-depth explanations. What would you like to explore?', 'windowAiChat');
        }
    }, 1000);
});

// Quick action buttons
function quickAnalyze() {
    addMessageToChat('user', 'Analyze my notes', 'aiChat');
    sendAIMessage();
}

function quickQuestions() {
    addMessageToChat('user', 'Generate study questions', 'aiChat');
    sendAIMessage();
}

function quickSummary() {
    addMessageToChat('user', 'Summarize my notes', 'aiChat');
    sendAIMessage();
}