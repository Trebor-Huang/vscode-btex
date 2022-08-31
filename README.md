# vscode-btex

VSCode integration for [bTeX](https://github.com/banana-space/btex).

Use the "Compile bTeX to HTML" command in the command palette to start. The
rendered content will update on save.

## Features

- [ ] Syntax highlights.
- [X] Compiles the bTeX file and show the preview on save.
- [ ] Exports bTeX to html. (Does not look well without fitting a lot of resources in.)

## Requirements

- Install optionally [tikz2svg](https://github.com/banana-space/tikz2svg). This is used to render TikZ images.

## Extension Settings

- `btex.command` and `btex.directory`: Used to specify the location of tikz2svg. You can leave blank to not let the plugin start up tikz2svg for you.
- `btex.invertAll`: Color settings for formulas, see settings description. It is only relevant in dark themes.

## Known Issues

- Wiki templates do not work, because they are stored on wiki servers. I'm not going to implement local wiki templates either. Similarly wiki-style links will show up as blue but don't link anywhere.
- Collapsible proofs do not work (yet) because it requires more javascript machinery.

## Release Notes
