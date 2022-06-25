# vscode-btex README

(...)

## Features

- [ ] Syntax highlights.
- [ ] Compiles the bTeX file and show the preview either on save.
  - [X] Displays converted result assuming the server is running.
  - [ ] Cache KaTeX modules.
  - [ ] Run node.js module process to start up bTeX engine automatically (or disable that as a server).
  - [ ] Display HTML properly, customize style options.
  - [ ] Keep track of processes and panels, so that they are unique.
  - [ ] Handle errors.
- [ ] Exports bTeX to html.

## Requirements

- Install bTeX and TikZ2svg. (...)

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: enable/disable this extension
* `myExtension.thing`: set to `blah` to do something

## Known Issues

The `cd` environment doesn't seem to render correctly. Not fixing for now.

## Release Notes
