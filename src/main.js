const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { exec } = require('child_process');
const os = require('os');

// File categories configuration
const FILE_CATEGORIES = {
    'Images': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg', '.webp', '.ico', '.heic'],
    'Documents': ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.pages', '.md', '.tex'],
    'Spreadsheets': ['.xls', '.xlsx', '.csv', '.ods', '.numbers'],
    'Presentations': ['.ppt', '.pptx', '.odp', '.key'],
    'Videos': ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.3gp'],
    'Audio': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus'],
    'Archives': ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.dmg', '.pkg', '.deb', '.rpm'],
    'Code': ['.py', '.js', '.html', '.css', '.java', '.cpp', '.c', '.h', '.php', '.rb', '.go', '.rs', '.swift'],
    'Executables': ['.exe', '.msi', '.app', '.deb', '.rpm', '.run', '.bin'],
    'Fonts': ['.ttf', '.otf', '.woff', '.woff2', '.eot'],
    'Data': ['.json', '.xml', '.yaml', '.yml', '.sql', '.db', '.sqlite'],
    'Design': ['.psd', '.ai', '.sketch', '.fig', '.xd', '.indd']
};

let mainWindow;

function createWindow() {
    const iconPath = path.join(__dirname, '../assets/icon.png');
    console.log('Icon path:', iconPath);
    console.log('Icon exists:', fsSync.existsSync(iconPath));

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: iconPath,
        titleBarStyle: 'default'
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Open DevTools in development
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    // Set the app icon for macOS dock
    const iconPath = path.join(__dirname, '../assets/icon.png');
    if (process.platform === 'darwin' && fsSync.existsSync(iconPath)) {
        app.dock.setIcon(iconPath);
    }
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Helper functions
function getFileCategory(fileExtension) {
    fileExtension = fileExtension.toLowerCase();
    for (const [category, extensions] of Object.entries(FILE_CATEGORIES)) {
        if (extensions.includes(fileExtension)) {
            return category;
        }
    }
    return 'Others';
}

async function scanDirectory(directoryPath) {
    const fileInfo = {};

    try {
        const items = await fs.readdir(directoryPath);

        for (const item of items) {
            const itemPath = path.join(directoryPath, item);
            const stats = await fs.stat(itemPath);

            // Skip directories and hidden files
            if (stats.isDirectory() || item.startsWith('.')) {
                continue;
            }

            const extension = path.extname(item);
            const category = extension ? getFileCategory(extension) : 'Others';

            if (!fileInfo[category]) {
                fileInfo[category] = [];
            }

            fileInfo[category].push({
                name: item,
                path: itemPath,
                extension: extension,
                size: stats.size
            });
        }

        return fileInfo;
    } catch (error) {
        throw new Error(`Cannot access directory: ${error.message}`);
    }
}

async function createCategoryFolders(basePath, categories) {
    const createdFolders = [];

    for (const category of categories) {
        const folderPath = path.join(basePath, category);
        try {
            await fs.mkdir(folderPath, { recursive: true });
            createdFolders.push(folderPath);
        } catch (error) {
            console.error(`Error creating folder ${folderPath}:`, error);
        }
    }

    return createdFolders;
}

async function moveFiles(fileInfo, basePath, dryRun = false) {
    let movedCount = 0;
    let failedCount = 0;
    const results = [];

    for (const [category, files] of Object.entries(fileInfo)) {
        if (!files || files.length === 0) continue;

        const categoryFolder = path.join(basePath, category);

        for (const file of files) {
            const sourcePath = file.path;
            let destinationPath = path.join(categoryFolder, file.name);

            try {
                if (!dryRun) {
                    // Handle duplicate filenames
                    if (fsSync.existsSync(destinationPath)) {
                        const baseName = path.parse(file.name).name;
                        const extension = path.parse(file.name).ext;
                        let counter = 1;

                        while (fsSync.existsSync(destinationPath)) {
                            const newName = `${baseName}_${counter}${extension}`;
                            destinationPath = path.join(categoryFolder, newName);
                            counter++;
                        }
                    }

                    await fs.rename(sourcePath, destinationPath);
                }

                results.push({
                    success: true,
                    fileName: file.name,
                    category: category,
                    action: dryRun ? 'would_move' : 'moved'
                });

                movedCount++;
            } catch (error) {
                results.push({
                    success: false,
                    fileName: file.name,
                    category: category,
                    error: error.message
                });

                failedCount++;
            }
        }
    }

    return { movedCount, failedCount, results };
}

// IPC handlers
ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Select folder to organize'
    });

    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }

    return null;
});

ipcMain.handle('scan-directory', async (event, directoryPath) => {
    try {
        const fileInfo = await scanDirectory(directoryPath);
        return { success: true, data: fileInfo };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('organize-files', async (event, { fileInfo, directoryPath, dryRun }) => {
    try {
        // Create category folders
        const categories = Object.keys(fileInfo).filter(category =>
            fileInfo[category] && fileInfo[category].length > 0
        );

        await createCategoryFolders(directoryPath, categories);

        // Move files
        const result = await moveFiles(fileInfo, directoryPath, dryRun);

        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-default-directories', () => {
    return {
        home: os.homedir(),
        downloads: path.join(os.homedir(), 'Downloads'),
        desktop: path.join(os.homedir(), 'Desktop'),
        documents: path.join(os.homedir(), 'Documents')
    };
});

ipcMain.handle('open-directory', async (event, directoryPath) => {
    return new Promise((resolve) => {
        const command = process.platform === 'win32' ? 'explorer' :
                      process.platform === 'darwin' ? 'open' : 'xdg-open';

        exec(`${command} "${directoryPath}"`, (error) => {
            resolve({ success: !error });
        });
    });
});
