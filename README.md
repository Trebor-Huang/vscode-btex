# vscode-btex

VSCode integration for [bTeX](https://github.com/banana-space/btex).

Use the "Compile bTeX to HTML" command to start.

## Features

- [ ] Syntax highlights.
- [X] Compiles the bTeX file and show the preview on save.
- [ ] Exports bTeX to html. (Does not look well without fitting a lot of resources in.)

## Requirements

- Install optionally [tikz2svg](https://github.com/banana-space/tikz2svg). This is used to render TikZ images.

## Extension Settings

- `btex.command` and `btex.directory`: Used to specify the location of tikz2svg. You can leave blank to not let the plugin start up tikz2svg for you.

## Known Issues

- Wiki templates do not work, because they are stored on wiki servers. I'm not going to implement local wiki templates either.
- TikZ pictures will usually be black with transparent background unless specified in the TikZ code. Therefore in dark-themed VSCode they will not be very visible. I don't have a good way to solve it apart from adding a white background or simply switch to a light VSCode theme.

## Release Notes
