Right now, only Florida marriage leads are implemented.

To be able to run the Python lead generator script from with the GUI app, run the command `npm run build:python` from the `./gui` directory.

To create a new application installer, run `npm run package`.

To publish a new release to GitHub: 
1. Bump the version number in `package.json`.
2. Set the environment variable `GH_TOKEN` with your GitHub access token.
4. Run `npm run publish`.
5. The new release will be created in GitHub as a draft. To allow it to be seen by the public, navigate to the GitHub releases page and publish the release.
