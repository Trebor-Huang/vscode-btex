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

Wiki templates do not work, because they are stored on wiki servers. I'm not going to implement local wiki templates either.

## Release Notes
