import * as vscode from 'vscode';
import * as path from 'path';
import * as http from 'http';

var saveListener: vscode.Disposable, closeListener: vscode.Disposable;
var extensionPath: string;

class PanelManager {
    readonly doc: vscode.TextDocument;
    readonly panel: vscode.WebviewPanel;

    constructor(doc: vscode.TextDocument) {
        this.doc = doc;
        // TODO: maybe set back the focus? which is better?
        this.panel = vscode.window.createWebviewPanel(
            'bTeXpreview',
            'Preview bTeX',
            vscode.ViewColumn.Beside,
            {
                localResourceRoots: [
                    vscode.Uri.file(path.join(extensionPath, 'resources'))
                ]
            }
        );
        this.panel.onDidDispose(
            () => {
                let i = openPanels.indexOf(this);
                if (i >= 0) { openPanels.splice(i, 1); }
            }
        );
    }

    compile(): void {
        let text = this.doc.getText();
        const request = http.request({
            host: 'localhost',
            port: 7200,
            path: '/',
            method: 'POST',
            headers: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Content-Type': 'application/json'
            }
        },
            (response) => {  // Collects the response
                var data = '';
                response.on('data', (chunk) => data += chunk);
                response.on('end', () => this.render(JSON.parse(data)));
                response.on('error', (err) => vscode.window.showErrorMessage(err.message));
            });
        request.write(JSON.stringify({ code: text }));
        request.end();
    }

    render(data: { html: string; }): void {
        const csssrc = this.panel.webview.asWebviewUri(
            vscode.Uri.file(
                path.join(extensionPath, 'resources', 'banana.css')
            )
        );
        // TODO we will make the template better once we get to styles
        this.panel.webview.html = `<!DOCTYPE html>
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.css">
    <link rel="stylesheet" href="${csssrc}">
    <title>bTeX Preview</title>
</head>
<body class="b-page-body">
${data.html}
</body>`;
    }

    close(): void {
        console.log("bTeX: closing");
        this.panel.dispose();
    }
}

var openPanels: PanelManager[] = [];

export function activate(context: vscode.ExtensionContext) {
    console.log('bTeX: Active.');
    extensionPath = context.extensionPath;
    let disposable = vscode.commands.registerCommand('vscode-btex.compile',
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
            pm.compile();
        });
    context.subscriptions.push(disposable);

    saveListener = vscode.workspace.onDidSaveTextDocument(
        function (doc) {
            // Update panels
            for (const pm of openPanels) {
                if (doc === pm.doc) {
                    pm.compile();
                }
            }
        }
    );

    closeListener = vscode.workspace.onDidCloseTextDocument(
        function (doc) {
            for (const pm of openPanels) {
                if (doc === pm.doc) {
                    pm.close();
                }
            }
        }
    );
}

export function deactivate() {
    saveListener.dispose();
    closeListener.dispose();
}
