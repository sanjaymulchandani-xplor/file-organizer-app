// Application state
let currentDirectory = null;
let scannedData = null;

// DOM elements
const elements = {
    selectSection: document.getElementById('step-select'),
    scanSection: document.getElementById('step-scan'),
    organizeSection: document.getElementById('step-organize'),
    resultsSection: document.getElementById('step-results'),

    backButton: document.getElementById('back-button'),
    selectFolderBtn: document.getElementById('select-folder-btn'),
    changeFolderBtn: document.getElementById('change-folder-btn'),
    selectedPath: document.getElementById('selected-path'),
    currentPath: document.getElementById('current-path'),

    totalFiles: document.getElementById('total-files'),
    totalCategories: document.getElementById('total-categories'),
    totalSize: document.getElementById('total-size'),
    categoriesList: document.getElementById('categories-list'),

    previewBtn: document.getElementById('preview-btn'),
    organizeBtn: document.getElementById('organize-btn'),

    movedCount: document.getElementById('moved-count'),
    failedCount: document.getElementById('failed-count'),
    openFolderBtn: document.getElementById('open-folder-btn'),
    startOverBtn: document.getElementById('start-over-btn'),
    detailedResults: document.getElementById('detailed-results'),

    loadingOverlay: document.getElementById('loading-overlay'),
    loadingText: document.getElementById('loading-text'),
    errorToast: document.getElementById('error-toast'),
    errorMessage: document.getElementById('error-message')
};

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showLoading(text = 'Processing...') {
    elements.loadingText.textContent = text;
    elements.loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    elements.loadingOverlay.style.display = 'none';
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorToast.style.display = 'flex';

    setTimeout(() => {
        elements.errorToast.style.display = 'none';
    }, 5000);
}

function showStep(stepId) {
    // Hide all steps
    document.querySelectorAll('.step-section').forEach(section => {
        section.style.display = 'none';
    });

    // Show target step
    document.getElementById(stepId).style.display = 'block';

    // Show/hide back button based on step
    if (stepId === 'step-select') {
        elements.backButton.classList.remove('show');
    } else {
        elements.backButton.classList.add('show');
    }
}

// Directory selection
async function initializeQuickButtons() {
    try {
        const defaultDirs = await window.electronAPI.getDefaultDirectories();

        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const dirType = btn.getAttribute('data-dir');
                const dirPath = defaultDirs[dirType];

                if (dirPath) {
                    await selectDirectory(dirPath);
                }
            });
        });
    } catch (error) {
        console.error('Error initializing quick buttons:', error);
    }
}

async function selectDirectory(path = null) {
    try {
        showLoading('Selecting directory...');

        const selectedPath = path || await window.electronAPI.selectDirectory();

        if (selectedPath) {
            currentDirectory = selectedPath;
            elements.currentPath.textContent = selectedPath;
            elements.selectedPath.style.display = 'block';

            // Automatically scan the directory
            await scanDirectory();
        }
    } catch (error) {
        showError('Error selecting directory: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function scanDirectory() {
    if (!currentDirectory) return;

    try {
        showLoading('Scanning directory...');

        const result = await window.electronAPI.scanDirectory(currentDirectory);

        if (result.success) {
            scannedData = result.data;
            displayScanResults();
            showStep('step-scan');
            setTimeout(() => showStep('step-organize'), 100);
        } else {
            showError('Error scanning directory: ' + result.error);
        }
    } catch (error) {
        showError('Error scanning directory: ' + error.message);
    } finally {
        hideLoading();
    }
}

function displayScanResults() {
    if (!scannedData) return;

    // Calculate totals
    let totalFiles = 0;
    let totalSizeBytes = 0;
    let categoriesCount = 0;

    Object.entries(scannedData).forEach(([category, files]) => {
        if (files && files.length > 0) {
            categoriesCount++;
            totalFiles += files.length;
            totalSizeBytes += files.reduce((sum, file) => sum + file.size, 0);
        }
    });

    // Update summary
    elements.totalFiles.textContent = totalFiles;
    elements.totalCategories.textContent = categoriesCount;
    elements.totalSize.textContent = formatFileSize(totalSizeBytes);

    // Display categories
    elements.categoriesList.innerHTML = '';

    Object.entries(scannedData)
        .filter(([category, files]) => files && files.length > 0)
        .sort(([,a], [,b]) => b.length - a.length)
        .forEach(([category, files]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category-item';

            const categorySize = files.reduce((sum, file) => sum + file.size, 0);

            categoryDiv.innerHTML = `
                <div class="category-header">
                    <span class="category-name">${category}</span>
                    <span class="category-stats">${files.length} files • ${formatFileSize(categorySize)}</span>
                </div>
                <div class="file-list">
                    ${files.slice(0, 5).map(file => `
                        <div class="file-item">
                            <span class="file-name">${file.name}</span>
                            <span class="file-size">${formatFileSize(file.size)}</span>
                        </div>
                    `).join('')}
                    ${files.length > 5 ? `<div class="file-item"><em>... and ${files.length - 5} more files</em></div>` : ''}
                </div>
            `;

            elements.categoriesList.appendChild(categoryDiv);
        });
}

async function organizeFiles(dryRun = false) {
    if (!scannedData || !currentDirectory) return;

    try {
        showLoading(dryRun ? 'Previewing changes...' : 'Organizing files...');

        const result = await window.electronAPI.organizeFiles({
            fileInfo: scannedData,
            directoryPath: currentDirectory,
            dryRun: dryRun
        });

        if (result.success) {
            if (dryRun) {
                showPreviewResults(result.data);
            } else {
                showFinalResults(result.data);
                showStep('step-results');
            }
        } else {
            showError('Error organizing files: ' + result.error);
        }
    } catch (error) {
        showError('Error organizing files: ' + error.message);
    } finally {
        hideLoading();
    }
}

function showPreviewResults(data) {
    const { results } = data;

    let previewHtml = `
        <div class="preview-content">
            <h3>Preview: What will happen</h3>
            <div style="max-height: 300px; overflow-y: auto;">
    `;

    const groupedResults = {};
    results.forEach(result => {
        if (!groupedResults[result.category]) {
            groupedResults[result.category] = [];
        }
        groupedResults[result.category].push(result);
    });

    Object.entries(groupedResults).forEach(([category, files]) => {
        previewHtml += `
            <div class="preview-category">
                <strong>${category} Folder:</strong>
                <ul>
                    ${files.slice(0, 5).map(file => `<li>${file.fileName}</li>`).join('')}
                    ${files.length > 5 ? `<li><em>... and ${files.length - 5} more files</em></li>` : ''}
                </ul>
            </div>
        `;
    });

    previewHtml += `
            </div>
            <div class="preview-actions">
                <button onclick="organizeFiles(false)" class="primary-btn">Proceed with Organization</button>
            </div>
        </div>
    `;

    // Insert preview after organize section
    const organizeSection = document.getElementById('step-organize');
    const existingPreview = organizeSection.querySelector('.preview-results');
    if (existingPreview) {
        existingPreview.remove();
    }

    const previewDiv = document.createElement('div');
    previewDiv.className = 'preview-results';
    previewDiv.innerHTML = previewHtml;
    organizeSection.appendChild(previewDiv);
}

function showFinalResults(data) {
    const { movedCount, failedCount, results } = data;

    elements.movedCount.textContent = movedCount;
    elements.failedCount.textContent = failedCount;

    // Show detailed results
    elements.detailedResults.innerHTML = '';

    if (results.length > 0) {
        const groupedResults = {};
        results.forEach(result => {
            if (!groupedResults[result.category]) {
                groupedResults[result.category] = [];
            }
            groupedResults[result.category].push(result);
        });

        Object.entries(groupedResults).forEach(([category, files]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.innerHTML = `
                <h4 style="margin: 15px 0 10px 0; color: hsl(var(--foreground));">${category}</h4>
                ${files.map(result => `
                    <div class="result-item">
                        <span>${result.fileName}</span>
                        <span class="${result.success ? 'result-success' : 'result-error'}">
                            ${result.success ? 'Moved' : 'Failed'}
                        </span>
                    </div>
                `).join('')}
            `;
            elements.detailedResults.appendChild(categoryDiv);
        });
    }
}

async function openOrganizedFolder() {
    if (currentDirectory) {
        try {
            await window.electronAPI.openDirectory(currentDirectory);
        } catch (error) {
            showError('Error opening folder: ' + error.message);
        }
    }
}

function startOver() {
    currentDirectory = null;
    scannedData = null;
    elements.selectedPath.style.display = 'none';

    // Clear any preview results
    const previewResults = document.querySelector('.preview-results');
    if (previewResults) {
        previewResults.remove();
    }

    showStep('step-select');
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeQuickButtons();

    elements.backButton.addEventListener('click', startOver);
    elements.selectFolderBtn.addEventListener('click', () => selectDirectory());
    elements.changeFolderBtn.addEventListener('click', () => selectDirectory());

    elements.previewBtn.addEventListener('click', () => organizeFiles(true));
    elements.organizeBtn.addEventListener('click', () => organizeFiles(false));

    elements.openFolderBtn.addEventListener('click', openOrganizedFolder);
    elements.startOverBtn.addEventListener('click', startOver);

    // Close error toast
    document.querySelector('.toast-close').addEventListener('click', () => {
        elements.errorToast.style.display = 'none';
    });
});

// Make organizeFiles available globally for preview button
window.organizeFiles = organizeFiles;
