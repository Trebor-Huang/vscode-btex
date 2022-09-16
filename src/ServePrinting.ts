import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { AddressInfo } from 'net';  // types only

export async function serve(content: string, extensionPath: string) : Promise<number> {
    const server = http.createServer((req, res) => {
        if (req.url === '/') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
        } else {
            res.writeHead(200);
            const resource = path.join(extensionPath, 'resources', req.url ?? '');
            fs.readFile(resource, (err, data) => {
                res.end(data, 'utf-8');
            });
        }
    });
    setTimeout(() => { server.close(); }, 10000);  // A generous 10 seconds
    server.listen();
    return await new Promise((res, rej) => {
        server.on('listening', () => {
            res((server.address() as AddressInfo).port);
        });
    });
}

