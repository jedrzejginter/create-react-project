/* eslint-disable import/no-dynamic-require, global-require */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const cpy = require("cpy");
const { quote } = require("shell-quote");

function root(...segments) {
  return path.join(__dirname, "..", ...segments);
}

function q(s) {
  return quote([s]);
}

function log(m) {
  process.stdout.write(`${m}\n`);
}

function requireJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
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

  // Create out dir, so `cp` will work correctly.
  fs.mkdirSync(q(options.out), { recursive: true });

  // Copy template directories to output.
  for (const dir of [
    ".github",
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

  // Add tailwind.
  if (options.withTailwind) {
    log("Adding Tailwind support");

    require("../with-tailwind/build")({
      out: options.out,
    });
  }

  // We want to install dependencies before pre-commit hooks is added,
  // so test project won't install it in repo.
  execSync(`(cd ${q(options.out)} && yarn)`, {
    stdio: "inherit",
  });

  const pkg = requireJSON(path.join(options.out, "package.json"));

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

  // Format generated project.
  execSync(`(cd ${q(options.out)} && yarn lint --fix)`, { stdio: "inherit" });
};
