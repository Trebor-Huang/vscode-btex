# vscode-btex

VSCode integration for [bTeX](https://github.com/banana-space/btex).

## Features

- [ ] Syntax highlights.
- [ ] Compiles the bTeX file and show the preview on save.
  - [X] Displays converted result assuming the server is running.
  - [ ] Cache KaTeX modules.
  - [ ] Run node.js module process to start up bTeX engine automatically.
  - [ ] Display HTML properly, customize style options.
  - [ ] Keep track of processes and panels, so that they are unique.
  - [ ] Handle errors.
- [ ] Exports bTeX to html.

## Requirements

- Install bTeX and tikz2svg. Currently bTeX must be up and running on port 7200.
  You can optionally start up tikz2svg on port 9292 to have full support for
  tikz format.

## Extension Settings

(...)

## Known Issues

The `cd` environment doesn't seem to render correctly. Not fixing for now.

## Release Notes
