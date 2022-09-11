import * as vscode from 'vscode';
import * as child_process from 'child_process';

export class BtexServer {
    server: child_process.ChildProcess | undefined = undefined;
    dispose() : void {
        console.log("bTeX: Shutting down.");
        this.server?.kill();
    }

    startServer() : boolean {  // Returns whether the server is started
        if (this.server !== undefined) {
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
        this.server = child_process.spawn(cmd, args, {
            detached: false,
            stdio: 'ignore',
            cwd: bTeXcwd  // We can also just use yarn --cwd ...
        });
        this.server.on('exit', (code, signal) => {
            vscode.window.showErrorMessage(
                `tikz2svg server exited with code ${code} and signal ${signal}.`
            );
            this.server = undefined;
        });
        this.server.on('error', (err) => { console.log(err); });
        console.log('bTeX: Starting tikz2svg on pid', this.server.pid);
        return true;
    }
}
