const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const rimraf = require("rimraf");
const cpy = require("cpy");
const { quote } = require("shell-quote");

function root(...segments) {
  return path.join(__dirname, "..", ...segments);
}

function q(s) {
  return quote([s]);
}

module.exports = async function createReactProject(options) {
  // Prevent writing to non-empty directory if flag "--force" HAS NOT been set.
  if (!options.force && fs.existsSync(options.out)) {
    throw new Error(
      `Cannot write files to non-empty directory ${q(
        path.resolve(options.out)
      )}`
    );
  }

  // Copy template directories to output.
  for (const dir of [
    ".vscode",
    "babel",
    "pages",
    "public",
    "scripts",
    "src",
    "typings",
  ]) {
    // "-P" don't allow symbolic links
    execSync(`cp -R -P ${root(`template/${dir}`)} ${q(options.out)}`, {
      stdio: "inherit",
    });
  }

  // Copy top-level files from template dir.
  await cpy([root("template/*"), root("template/.*")], options.out, {
    // Make sure we will copy top-level files only.
    expandDirectories: false,
    // Ignore paths specified in gitignore.
    gitignore: true,
  });

  // Remove yarn.lock.
  // It will be regenerated by yarn when installing.
  rimraf.sync(path.join(options.out, "yarn.lock"));

  // We want to install dependencies before pre-commit hooks is added,
  // so test project won't install it in repo.
  if (!process.env.SKIP_SCRIPTS) {
    execSync(`(cd ${q(options.out)} && yarn)`, {
      stdio: "inherit",
    });
  }

  // eslint-disable-next-line import/no-dynamic-require, global-require
  const pkg = require(require.resolve(root("template/package.json")));

  // Set correct project name in package.json
  pkg.name = options.name;

  // Set husky config.
  pkg.husky = pkg.__husky;
  delete pkg.__husky;

  fs.writeFileSync(
    path.join(options.out, "package.json"),
    JSON.stringify(pkg, null, 2),
    "utf-8"
  );

  // Lint, typecheck and test generated project.
  if (!process.env.SKIP_SCRIPTS) {
    execSync(`(cd ${q(options.out)} && yarn lint --fix && yarn typecheck)`, {
      stdio: "inherit",
    });

    // Test if everything is set up correctly.
    execSync(
      `CRP_ARG_OUT=${q(options.out)} CRP_ARG_NAME=${q(options.name)} yarn test`,
      {
        stdio: "inherit",
      }
    );
  }
};
