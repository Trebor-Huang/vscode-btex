import * as vscode from 'vscode';
import * as path from 'path';
import * as btex from 'btex';
import * as child_process from 'child_process';

var extensionPath: string;
var server: child_process.ChildProcess | undefined = undefined;
var isInvertAll : boolean = false;
var diags: vscode.DiagnosticCollection;

function startServer(){  // Returns whether the server is started
    if (server !== undefined) {
        return true;
    }

    const config = vscode.workspace.getConfiguration('btex');
    const bTeXcmd : string | undefined = config.get('command');
    const bTeXcwd : string | undefined = config.get('directory');
    // Get some settings

    if (bTeXcmd === '') {
        console.log('bTeX: Skipping server startup.');
        return false;
    }
    if (bTeXcmd === undefined || bTeXcwd === undefined || bTeXcwd === '') {
        vscode.window.showErrorMessage("bTeX server path is not configured.");
        return false;
    }

    // Start up language server
    const [cmd, ...args] = bTeXcmd.split(' ');
    server = child_process.spawn(cmd, args, {
        detached: false,
        cwd: bTeXcwd  // We can also just use yarn --cwd ...
    });
    server.on('exit', (code, signal) => {
        vscode.window.showErrorMessage(
            `tikz2svg server exited with code ${code} and signal ${signal}.`
        );
        server = undefined;
    });
    server.on('error', (err) => { console.log(err); });
    console.log('bTeX: Starting tikz2svg on pid', server.pid);
    return true;
}

class PanelManager implements vscode.Disposable {
    readonly doc: vscode.TextDocument;
    readonly panel: vscode.WebviewPanel;

    constructor(doc: vscode.TextDocument) {
        this.doc = doc;
        this.panel = vscode.window.createWebviewPanel(
            'bTeXpreview',
            'Preview bTeX',
            vscode.ViewColumn.Beside,
            {
                localResourceRoots: [
                    vscode.Uri.file(path.join(extensionPath, 'resources'))
                ],
                enableScripts: true
            }
        );
        this.initialize();
        this.panel.onDidDispose(
            () => {  // remove itself from openPanels list
                let i = openPanels.indexOf(this);
                if (i >= 0) { openPanels.splice(i, 1); }
            }
        );
    }

    compile(): void {
        // TODO inverse Search
        const text = this.doc.getText();
        btex.runWorker(text, undefined, undefined, undefined)
        .then(result => {
            const diagnostics = [];
            for (const err of result.errors) {
                // code:LINE:COL MSG
                const res = /^code:([0-9]+):([0-9])+ (.*)$/.exec(err);
                if (res === null || res.length !== 4) {
                    vscode.window.showErrorMessage(
                        'Unknown btex error.',
                        {
                            modal: true,
                            detail: err
                        }
                    );
                    continue;
                }
                const pos = new vscode.Position(
                    parseInt(res[1])-1,parseInt(res[2])-1
                );
                const range = new vscode.Range(pos, pos);
                diagnostics.push(new vscode.Diagnostic(range, res[3]));
            }
            diags.set(this.doc.uri, diagnostics);
            if (result.html !== '' || result.errors.length === 0) {
                // This prevents the contents from emptying.
                this.render(result.html);
            }
        }).catch(reason => {
            // This is probably error unexpected by the btex engine
            vscode.window.showErrorMessage(reason);
        });
    }

    initialize(): void {
        const auvu = (...name: string[]) => this.panel.webview.asWebviewUri(
            vscode.Uri.file(
                path.join(extensionPath, 'resources', ...name)
            )
        );  // shorthand for asWebviewUri.
        // Collect the local resources.
        const src = `
@font-face {
    font-family: 'Cascadia Code';
    src: url(${auvu('CascadiaCode.woff2')}) format('woff2'), url(${auvu('CascadiaCode.woff')}) format('woff')
}

@font-face {
    font-family: Lato_Bbb;
    src: url(${auvu('LatoBbb.woff2')}) format('woff2'), url(${auvu('LatoBbb.woff')}) format('woff')
}

@font-face {
    font-family: PunctCJK;
    src: url(${auvu('PunctCJK.woff2')}) format('woff2'), url(${auvu('PunctCJK.woff')}) format('woff');
    unicode-range: U+21-22, U+27-29, U+2C, U+2E, U+3A-3B, U+3F, U+2018-201A, U+201C-201E, U+2022, U+2026, U+2218, U+25AA-25AB, U+3001-3002, U+3008-300F, U+FF64
}

@font-face {
    font-family: PunctCJK;
    font-style: italic;
    src: url(${auvu('PunctCJK-Italic.woff2')}) format('woff2'), url(${auvu('PunctCJK-Italic.woff')}) format('woff');
    unicode-range: U+21-22, U+27-29, U+2C, U+2E, U+3A-3B, U+3F, U+2018-201A, U+201C-201E, U+2022, U+2026, U+2218, U+25AA-25AB, U+3001-3002, U+3008-300F, U+FF64
}

@font-face {
    font-family: PunctCJK;
    font-weight: bold;
    src: url(${auvu('PunctCJK-Bold.woff2')}) format('woff2'), url(${auvu('PunctCJK-Bold.woff')}) format('woff');
    unicode-range: U+21-22, U+27-29, U+2C, U+2E, U+3A-3B, U+3F, U+2018-201A, U+201C-201E, U+2022, U+2026, U+2218, U+25AA-25AB, U+3001-3002, U+3008-300F, U+FF64
}

@font-face {
    font-family: PunctCJK;
    font-weight: bold;
    font-style: italic;
    src: url(${auvu('PunctCJK-BoldItalic.woff2')}) format('woff2'), url(${auvu('PunctCJK-BoldItalic.woff')}) format('woff');
    unicode-range: U+21-22, U+27-29, U+2C, U+2E, U+3A-3B, U+3F, U+2018-201A, U+201C-201E, U+2022, U+2026, U+2218, U+25AA-25AB, U+3001-3002, U+3008-300F, U+FF64
}

.b-page-body {
    --external-link-svg: url(${auvu('external-link.svg')})
}
`;
        this.panel.webview.html = `<!DOCTYPE html>
<head>
    <meta charset="UTF-8">
    <style>${src}</style>
    <link rel="stylesheet" href="${auvu('katex', 'katex.min.css')}">
    <link rel="stylesheet" href="${auvu('banana.css')}">
    <title>bTeX Preview</title>
</head>
<body>
    <div id="render-content" class="b-page-body" ${isInvertAll ? 'invert-all' : 'invert-only'}>
        <div class="loading-prompt" style="display: flex; justify-content: center; align-items: center;  margin-top: 30%; font-size: 24px; font-weight: bold">
            Loading...
        </div>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        const bdy = document.getElementById("render-content");
        function updatebTeX(data) {
            if ('html' in data) {
                bdy.innerHTML = data.html;
            } else {
                data.html = bdy.innerHTML;
            }
            if (data.isInvertAll == bdy.hasAttribute('invert-only')) {
                bdy.toggleAttribute('invert-all');
                bdy.toggleAttribute('invert-only');
            }
            vscode.setState(data);
        }
        const previousState = vscode.getState();
        if (previousState) {
            updatebTeX(previousState);
        }
        window.addEventListener('message', event => {
            updatebTeX(event.data);
        });
    </script>
</body>`;
        this.compile();  // Update content
    }

    render(data: string): void {
        this.panel.webview.postMessage({
            html : data,
            isInvertAll : isInvertAll
        });
    }

    dispose(): void {
        this.panel.dispose();
    }
}

var openPanels: PanelManager[] = [];

export function activate(context: vscode.ExtensionContext) {
    console.log('bTeX: Active.');
    extensionPath = context.extensionPath;
    startServer();
    const registerCompile = vscode.commands.registerCommand('vscode-btex.compile',
        () => {
            // Get active document
            const doc = vscode.window.activeTextEditor?.document;
            if (doc === undefined) {
                vscode.window.showErrorMessage("No active text editor found.");
                return;
            }
            // Check old panels
            for (const pm of openPanels) {
                if (doc === pm.doc) {
                    pm.panel.reveal();
                    return;
                }
            }
            // Spawn new panel
            const pm = new PanelManager(doc);
            openPanels.push(pm);
            context.subscriptions.push(pm);
        });
    context.subscriptions.push(registerCompile);
    const restartServer = vscode.commands.registerCommand('vscode-btex.restart', startServer);
    context.subscriptions.push(restartServer);

    const saveListener = vscode.workspace.onDidSaveTextDocument(
        function (doc) {
            // Update panels
            for (const pm of openPanels) {
                if (doc === pm.doc) {
                    pm.compile();
                    return;
                }
            }
        }
    );
    context.subscriptions.push(saveListener);

    const closeListener = vscode.workspace.onDidCloseTextDocument(
        function (doc) {
            for (const pm of openPanels) {
                if (doc === pm.doc) {
                    pm.dispose();
                    diags.delete(pm.doc.uri);
                    return;
                }
            }
        }
    );
    context.subscriptions.push(closeListener);

    const settingsListener = vscode.workspace.onDidChangeConfiguration(
        function (event) {
            if (event.affectsConfiguration('btex')) {
                isInvertAll = vscode.workspace
                    .getConfiguration('btex')
                    .get('invertAll') ?? false;
            }
        }
    );
    context.subscriptions.push(settingsListener);

    diags = vscode.languages.createDiagnosticCollection('btex');
    context.subscriptions.push(diags);
    // Register language features
}

export function deactivate() {
    console.log("bTeX: Shutting down.");
    server?.kill();
}
