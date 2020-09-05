const pkgJson = require('./out/package.json')
const config = require('./config');

describe('package.json', () => {
  it('should have project name set', () => {
    expect(pkgJson.name).toBe(config.PROJECT_NAME)
  })

  it('should have all packages with exact versions', () => {
    const inexact = [];
    const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };

    for (const dependency in deps) {
      if (!/^[\da-z]/.test(deps[dependency])) {
        inexact.push(dependency)
      }
    }

    expect(inexact).toStrictEqual([]);
  })
})
