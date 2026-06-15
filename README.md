Right now, only Florida marriage leads are implemented.

To be able to run the Python lead generator script from with the GUI app, run the command `npm run build:python` from the `./gui` directory.

To create a new application installer, run `npm run package`.

To publish a new release to GitHub, first bump the version number in `package.json`.
Next, set the environment variable `GH_TOKEN` with your GitHub access token.
You can optionally associate a code version with the release by pushing a tag with the same name as the version in `package.json`.
Lastly, run `npm run publish`.
