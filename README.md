# vscode-btex

VSCode integration for [bTeX](https://github.com/banana-space/btex).

## Features

- [ ] Syntax highlights.
- [X] Compiles the bTeX file and show the preview on save.
  - [X] Displays converted result assuming the server is running.
  - [X] Trigger result on save.
  - [X] Cache resources. (Maybe also cache KaTeX?)
  - [X] Keep track of panels, so that they are unique.
  - [X] Start up bTeX engine automatically.
  - [X] Format wiki-style links. (They don't actually link anywhere, of course.)
  - [ ] ~~Automatic bidirectional scrolling sync~~
- [ ] ~~Automatic installation.~~
- [ ] ~~Customize style options.~~
- [ ] Exports bTeX to html. (Does not look well without fitting a lot of resources in.)

## Requirements

- Install optionally tikz2svg. Start up (manually) tikz2svg on port 9292 to have full support for tikz format.

## Extension Settings

(...)

## Known Issues

- Wiki templates do not work, because they are stored on wiki servers. I'm not going to implement local wiki templates either.
- TikZ pictures will usually be black with transparent background unless specified in the TikZ code. Therefore in dark-themed VSCode they will not be very visible. I don't have a good way to solve it apart from adding a white background or simply switch to a light VSCode theme.

## Release Notes
