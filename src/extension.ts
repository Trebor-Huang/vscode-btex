import * as vscode from 'vscode';
import * as path from 'path';
import { PanelManager } from './PanelManager';
import { BtexServer } from './BtexServer';

const server = new BtexServer();

export function activate(context: vscode.ExtensionContext) {
    console.log('bTeX: Active.');

    // Give PanelManager the necessary info
    PanelManager.extensionPath = context.extensionPath;
    PanelManager.diags = vscode.languages.createDiagnosticCollection('btex');
    context.subscriptions.push(
        // Register server to ensure disposal
        server,
        // Register diagonstics (i.e. "Problems" tab)
        PanelManager.diags,
        // Register compile command
        vscode.commands.registerCommand('vscode-btex.compile',
            () => {
                let pm = PanelManager.compileCommand();
                if (pm !== undefined) {
                    context.subscriptions.push(pm);
                }
            }
        ),
        // Register restart command
        vscode.commands.registerCommand('vscode-btex.restart',
            server.startServer.bind(server)),
        // Update document on save
        vscode.workspace.onDidSaveTextDocument(
            PanelManager.updateDocument
        ),
        // Close preview panel on close document
        vscode.workspace.onDidCloseTextDocument(
            PanelManager.closeDocument
        ),
        // Update config
        vscode.workspace.onDidChangeConfiguration(
            (event) => {
                if (event.affectsConfiguration('btex')) {
                    PanelManager.isInvertAll = vscode.workspace
                        .getConfiguration('btex')
                        .get('invertAll') ?? false;
                }
            }
        )
        // Register language features...
    );

    server.startServer();
}

export function deactivate() {}
