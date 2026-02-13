import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { fork } from 'child_process';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';
const PORT = 3001;
let serverProcess;

// En producción, el backend se desempaqueta en app.asar.unpacked (fork no puede ejecutar dentro de asar)
function getServerPath() {
    if (app.isPackaged) {
        return path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'server.js');
    }
    return path.join(__dirname, '../backend/server.js');
}

function startServer() {
    const userDataPath = app.getPath('userData');
    console.log('App User Data Path:', userDataPath);

    const serverPath = getServerPath();
    console.log('Starting server at:', serverPath);

    const backendDir = path.dirname(serverPath);
    serverProcess = fork(serverPath, [], {
        cwd: backendDir,
        env: {
            ...process.env,
            USER_DATA_PATH: userDataPath,
            PORT: String(PORT)
        },
        stdio: 'inherit'
    });

    serverProcess.on('error', (err) => {
        console.error('Server process failed:', err);
    });
}

// Esperar a que el servidor responda antes de cargar la ventana (evita "Failed to fetch")
function waitForServer(maxAttempts = 30) {
    return new Promise((resolve, reject) => {
        const require = createRequire(import.meta.url);
        const http = require('http');
        let attempts = 0;

        function tryConnect() {
            attempts++;
            const req = http.get(`http://127.0.0.1:${PORT}/api/products`, { timeout: 500 }, (res) => {
                req.destroy();
                resolve();
            });
            req.on('error', () => {
                req.destroy();
                if (attempts >= maxAttempts) {
                    reject(new Error('El servidor no respondió a tiempo'));
                } else {
                    setTimeout(tryConnect, 200);
                }
            });
        }
        tryConnect();
    });
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        },
        autoHideMenuBar: true,
        icon: path.join(__dirname, '../public/icon.ico')
    });

    if (isDev) {
        win.loadURL('http://localhost:5173');
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(async () => {
    startServer();
    try {
        await waitForServer();
    } catch (err) {
        console.error('Server did not start in time:', err.message);
    }
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('will-quit', () => {
    if (serverProcess) {
        console.log('Killing server process...');
        serverProcess.kill();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
