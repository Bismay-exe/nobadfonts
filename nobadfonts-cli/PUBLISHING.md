# How to Publish NoBadFonts CLI

You have the source code for the CLI tool in this folder. To make it available to everyone via `npx nobadfonts`, you need to publish it to npm.

## Prerequisites

1. Create an account on [npmjs.com](https://www.npmjs.com/).
2. Login to npm in your terminal:
   ```bash
   npm login
   ```

## publishing

1. Navigate to this folder:
   ```bash
   cd nobadfonts-cli
   ```
2. Update the `package.json` name if `nobadfonts-cli` is taken (it might be!). heavily recommended to scope it e.g. `@yourusername/nobadfonts` or just `nobadfonts-official`.
   - If you change the name, update the `bin` command in `package.json` if you want the command to differ.
3. Publish:
   ```bash
   npm publish --access public
   ```

## Testing Locally (Without Publishing)

You can test the CLI globally on your machine:

```bash
npm link
```

Now you can run `nobadfonts` anywhere in your terminal.
