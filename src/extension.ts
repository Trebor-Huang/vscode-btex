import * as vscode from 'vscode';
import * as path from 'path';
import * as http from 'http';

export function activate(context: vscode.ExtensionContext) {
    console.log('bTeX: Active.');
    let disposable = vscode.commands.registerCommand('vscode-btex.compile',
        () => { compile(context.extensionPath); });
    context.subscriptions.push(disposable);
}

function compile(extensionPath: string) {
    let doc = vscode.window.activeTextEditor?.document;
    if (doc === undefined) {
        return;
    }
    let text = doc.getText();
    var request = http.request({
        host: 'localhost',
        port: 7200,
        path: '/',
        method: 'POST',
        headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Type': 'application/json'
        }
    },
        function (response) {  // Collects the response
            var data = '';
            response.on('data', function (chunk) { data += chunk; });
            response.on('end', function () {
                render(extensionPath, JSON.parse(data));
            });
        });
    request.write(JSON.stringify({code: text}));
    request.end();
}

function render(extensionPath: string, data: { html: string; }) {
    const panel = vscode.window.createWebviewPanel(
        'bTeXpreview',
        'Preview bTeX',
        vscode.ViewColumn.Beside,
        {
            localResourceRoots: [
                vscode.Uri.file(path.join(extensionPath, 'resources'))
            ]
        }
    );
    const csssrc = panel.webview.asWebviewUri(
        vscode.Uri.file(
            path.join(extensionPath, 'resources', 'base.css')
        )
    );

    panel.webview.html = `<!DOCTYPE html>
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.css">
    <link rel="stylesheet" href="${csssrc}">
    <title>bTeX Preview</title>
</head>
<body>
${data.html}
</body>`;
}

// this method is called when your extension is deactivated
export function deactivate() {}
