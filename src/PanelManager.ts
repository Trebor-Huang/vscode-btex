import * as vscode from 'vscode';
import * as path from 'path';
import { serve } from './ServePrinting';  // Actually lazy loaded
import { runWorker } from 'btex';
var _runWorker : typeof runWorker;
var _serve : typeof serve;

// Generate CSS for fonts
function cssFonts(awvu: (file : string) => string) {
    return `
@font-face {
    font-family: 'Cascadia Code';
    src: url(${awvu('CascadiaCode.woff2')}) format('woff2'), url(${awvu('CascadiaCode.woff')}) format('woff')
}

@font-face {
    font-family: Lato_Bbb;
    src: url(${awvu('LatoBbb.woff2')}) format('woff2'), url(${awvu('LatoBbb.woff')}) format('woff')
}

@font-face {
    font-family: PunctCJK;
    src: url(${awvu('PunctCJK.woff2')}) format('woff2'), url(${awvu('PunctCJK.woff')}) format('woff');
    unicode-range: U+21-22, U+27-29, U+2C, U+2E, U+3A-3B, U+3F, U+2018-201A, U+201C-201E, U+2022, U+2026, U+2218, U+25AA-25AB, U+3001-3002, U+3008-300F, U+FF64
}

@font-face {
    font-family: PunctCJK;
    font-style: italic;
    src: url(${awvu('PunctCJK-Italic.woff2')}) format('woff2'), url(${awvu('PunctCJK-Italic.woff')}) format('woff');
    unicode-range: U+21-22, U+27-29, U+2C, U+2E, U+3A-3B, U+3F, U+2018-201A, U+201C-201E, U+2022, U+2026, U+2218, U+25AA-25AB, U+3001-3002, U+3008-300F, U+FF64
}

@font-face {
    font-family: PunctCJK;
    font-weight: bold;
    src: url(${awvu('PunctCJK-Bold.woff2')}) format('woff2'), url(${awvu('PunctCJK-Bold.woff')}) format('woff');
    unicode-range: U+21-22, U+27-29, U+2C, U+2E, U+3A-3B, U+3F, U+2018-201A, U+201C-201E, U+2022, U+2026, U+2218, U+25AA-25AB, U+3001-3002, U+3008-300F, U+FF64
}

@font-face {
    font-family: PunctCJK;
    font-weight: bold;
    font-style: italic;
    src: url(${awvu('PunctCJK-BoldItalic.woff2')}) format('woff2'), url(${awvu('PunctCJK-BoldItalic.woff')}) format('woff');
    unicode-range: U+21-22, U+27-29, U+2C, U+2E, U+3A-3B, U+3F, U+2018-201A, U+201C-201E, U+2022, U+2026, U+2218, U+25AA-25AB, U+3001-3002, U+3008-300F, U+FF64
}

.b-page-body {
    --external-link-svg: url(${awvu('external-link.svg')})
}
`;
}

function getResource(...name: string[]) {
    return path.join(PanelManager.extensionPath, 'resources', ...name);
}

async function gotoPosition(editor: vscode.TextEditor, position: number[]) {
    await vscode.window.showTextDocument(editor.document, editor.viewColumn);
    if (position.length === 0) {
        return;
    }
    await vscode.commands.executeCommand(
        'revealLine',
        {
            lineNumber: position[0] - 1,
            at: 'center'
        }
    );
    editor.selection = new vscode.Selection(
        editor.document.lineAt(position[0]-1).range.start,
        editor.document.lineAt(position[position.length-1]-1).range.end
    );
}

export class PanelManager implements vscode.Disposable {
    readonly doc: vscode.TextDocument;
    readonly editor: vscode.TextEditor;
    readonly panel: vscode.WebviewPanel;
    private static _isInvertAll : boolean = false;
    private listener ?: vscode.Disposable;
    static extensionPath: string;
    static diags: vscode.DiagnosticCollection;
    static openPanels: PanelManager[] = [];

    constructor(editor: vscode.TextEditor) {
        this.editor = editor;
        this.doc = editor.document;
        this.panel = vscode.window.createWebviewPanel(
            'bTeXpreview',
            'Preview bTeX',
            vscode.ViewColumn.Beside,
            {
                localResourceRoots: [
                    vscode.Uri.file(
                        path.join(PanelManager.extensionPath, 'resources'))
                ],
                enableScripts: true
            }
        );
        this.initialize();
        this.panel.onDidDispose(
            () => {  // remove itself from openPanels list
                let i = PanelManager.openPanels.indexOf(this);
                if (i >= 0) { PanelManager.openPanels.splice(i, 1); }
            }
        );
    }

    compile(printing=false): void {
        const text = this.doc.getText();
        if (_runWorker === undefined) {
            _runWorker = require('btex').runWorker;
        }
        _runWorker(text, '' /* TODO: Preamble */, {
            maxErrors: 100,
            maxMacroExpansions: 50000,
            maxBuffer: 1000000,
            maxNesting: 1000,
            inline: false,
            equationMode: false,
          }, {
            inverseSearch: true,
            noKatex: false
          })
        .then(result => {
            const data : {
                lang ?: string,
                htmlTitle ?: string,
                displayTitle ?: string
            } = JSON.parse(result.data);
            const diagnostics = [];
            for (const err of result.errors) {
                // code:LINE:COL MSG
                const res = /^code:([0-9]+):([0-9]+) (.*)$/.exec(err);
                if (res === null || res.length !== 4) {
                    vscode.window.showErrorMessage(
                        'Unknown btex error: ' + err
                    );  // Most probably just "UNKNOWN"
                    continue;
                }
                const pos = new vscode.Position(
                    parseInt(res[1])-1,parseInt(res[2])-1
                );  // TODO better position (doc.getWordRangeAtPosition)
                const range = new vscode.Range(pos, pos);
                diagnostics.push(new vscode.Diagnostic(range, res[3]));
            }
            // Update errors (including clearing them)
            PanelManager.diags.set(this.doc.uri, diagnostics);
            // This guard prevents the contents from emptying.
            if (result.html !== '' || result.errors.length === 0) {
                if (printing) {
                    const html = `<!DOCTYPE html>
<head>
    <meta charset="UTF-8">
    <style>${cssFonts(x => x)}</style>
    <link rel="stylesheet" href="katex/katex.min.css">
    <link rel="stylesheet" href="banana.css">
    <title>${data.htmlTitle ?? 'Preview bTeX'}</title>
</head>
<body lang="${data.lang ?? 'zh'}">
<div id="render-content" class="b-page-body" ${PanelManager.isInvertAll ? 'invert-all' : 'invert-only'}>
${result.html}
</div>
<script defer>
    window.onfocus = () => {window.close();};
    window.print();
</script>
</body>`;
                    if (_serve === undefined) {
                        _serve = require('./ServePrinting').serve;
                    }
                    _serve(html, PanelManager.extensionPath).then((port) => {
                        vscode.env.openExternal(
                            vscode.Uri.parse('http://localhost:' + port.toString())
                        );
                    });
                }
                this.render(result.html, data);
            } else {
                // If the user wants to print, stop them!
                if (printing) {
                    vscode.window.showErrorMessage(
                        "Printing Empty File",
                        {
                            modal: true,
                            detail: "The rendered result is empty, either because of error or your document is empty."
                        }
                    );
                }
            }
        }).catch(reason => {
            // This is probably error unexpected by the btex engine
            vscode.window.showErrorMessage(reason);
        });
    }

    initialize(): void {
        const awvu = (...name: string[]) => this.panel.webview.asWebviewUri(
            vscode.Uri.file(getResource(...name))
        ).toString();  // shorthand for asWebviewUri.
        this.panel.webview.html = `<!DOCTYPE html>
<head>
    <meta charset="UTF-8">
    <style>${cssFonts(awvu)}</style>
    <link rel="stylesheet" href="${awvu('katex', 'katex.min.css')}">
    <link rel="stylesheet" href="${awvu('banana.css')}">
</head>
<body>
    <div id="render-content" class="b-page-body" ${PanelManager.isInvertAll ? 'invert-all' : 'invert-only'}>
        <div class="loading-prompt" style="display: flex; justify-content: center; align-items: center;  margin-top: 30%; font-size: 24px; font-weight: bold">
            Loading...
        </div>
    </div>
    <script>
      (function(){
        const vscode = acquireVsCodeApi();
        const bdy = document.getElementById("render-content");
        async function updateSearch () {
            for (const sp of bdy.getElementsByTagName("span")) {
                if (sp.hasAttribute('data-pos')) {
                    sp.addEventListener('dblclick', event => {
                        vscode.postMessage({
                            position: sp.getAttribute('data-pos')
                        });
                    });
                }
            }
        }
        function updatebTeX(data) {
            if ('html' in data) {
                bdy.innerHTML = data.html;
                // Inverse search
                updateSearch();
            } else {
                data.html = bdy.innerHTML;
            }
            if (data.isInvertAll == bdy.hasAttribute('invert-only')) {
                bdy.toggleAttribute('invert-all');
                bdy.toggleAttribute('invert-only');
            }
            bdy.setAttribute('lang', data.data.lang ?? 'zh');
            vscode.setState(data);
        }
        const previousState = vscode.getState();
        if (previousState) {
            updatebTeX(previousState);
        }
        window.addEventListener('message', event => {
            updatebTeX(event.data);
        });
      })();
    </script>
</body>`;
        this.listener = this.panel.webview.onDidReceiveMessage(
            (data : {position: string}) => {
                gotoPosition(
                    this.editor,
                    data.position.split(',').map(
                        str => parseInt(str)
                    )
                );
            });
    }

    render(content: string, data: {
        lang?: string,
        htmlTitle?: string,
        displayTitle?: string
    }): void {
        this.panel.title = data.displayTitle ?? 'Preview';
        this.panel.webview.postMessage({
            html : content,
            data : data,
            isInvertAll : PanelManager.isInvertAll
        });
    }

    static set isInvertAll(value: boolean) {
        PanelManager._isInvertAll = value;
        for (const pm of PanelManager.openPanels) {
            pm.panel.webview.postMessage({
                isInvertAll: value
            });
        }
    }

    static get isInvertAll() {
        return PanelManager._isInvertAll;
    }

    dispose(): void {
        this.listener?.dispose();
        this.panel.dispose();
    }

    static compileCommand(printing=false): PanelManager | undefined {
        // Get active document
        const editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            vscode.window.showErrorMessage("No active text editor found.");
            return;
        }
        // Check old panels
        for (const pm of PanelManager.openPanels) {
            if (editor.document === pm.doc) {
                pm.panel.reveal();
                if (printing) {
                    pm.compile(true);
                }
                return;
            }
        }
        // Spawn new panel
        const pm = new PanelManager(editor);
        PanelManager.openPanels.push(pm);
        pm.compile(printing);
        return pm;
    }

    static closeDocument(doc: vscode.TextDocument): void {
        for (const pm of PanelManager.openPanels) {
            if (doc === pm.doc) {
                pm.dispose();
                PanelManager.diags.delete(pm.doc.uri);
                return;
            }
        }
    }

    static updateDocument(doc: vscode.TextDocument): void {
        for (const pm of PanelManager.openPanels) {
            if (doc === pm.doc) {
                pm.compile();
                return;
            }
        }
    }
}
