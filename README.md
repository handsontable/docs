# API Documentation for Handsontable

## Installation

Prerequisites: you need to have Ruby and Sass installed on your machine.

Install the npm dependencies by typing:
```sh
npm install
```
Create a `.env.json` file in the main directory, and fill it with your Github token data as follows:
```json
{
  "GITHUB_TOKEN": "[insert your gihub token here]"
}
```
Fetch source code of the Handsontable and build the documentation:
```sh
npm run start
```
If you encounter the
`Warning: ENOENT: no such file or directory, open 'generated/scripts/doc-versions.js' Use --force to continue.`
problem, create a `generated/scripts` directory structure, by typing:
```sh
mkdir -p generated/scripts
```

## Building
The documentation needs to be prepared with a valid directory structure to make static files accessible for the HTTP server. 
```bash
handsontable-docs
  ├── 6.1.0
  │    ├── ...
  │    └── package.json
  ├── 6.0.0
  │    ├── ...
  │    └── package.json
  └── next (this is a folder which can contain future documentation)
```
After cloning the documentation, fetching the source code of the Handsontable and installing all dependencies you can use the
```sh
npm run build
```
command, to build the documentation without cloning the Handsontable repos.

To preview the documentation run docker-compose:
```sh
docker-compose -f docker/docker-compose.yml up
```
By default the documentation will be available at http://localhost:8085/docs/{your-docs-version}/tutorial-introduction.html.

## Building a feature documentation
Feature documentation can be shared under `draft-next` branch. To build this version it has to be cloned to the `next` directory and build using
```sh
npm run start -- --hot-version=6.1.0 # Handsontable version which will be used to build API Ref
```
After all, it is necessary to rebuild templates to use valid paths to assets (as `/docs/next/...`) by executing
```sh
npm run build:next
```
