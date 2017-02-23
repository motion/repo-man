// @flow
/* eslint-disable global-require */

import Command from '../command'

export default class LinkCommand extends Command {
  name = 'link'
  description = 'Link NPM packages'
  options = [
    ['--scope', 'Limit to packages that match pattern (eg package-name or org/repo or org/repo/package-name)'],
    ['--ignore', 'Ignore packages that match pattern (eg package-name or org/repo or org/repo/package-name)'],
  ]

  async run(options: Object) {
    let packages = await this.getAllPackages()

    if (options.scope) {
      packages = this.matchPackages(packages, options.scope.split(',').filter(i => i))
    }
    if (options.ignore) {
      const ignored = this.matchPackages(packages, options.ignore.split(',').filter(i => i))
      packages = packages.filter(i => ignored.indexOf(i) === -1)
    }

    for (const pkg of packages) {
      if (!pkg.manifest.name || pkg.manifest.private || !pkg.manifest.version) {
        this.log(`Ignoring ${this.helpers.tildify(pkg.path)} because it's a not a public NPM package`)
        continue
      }
      this.log(`Linking ${this.helpers.tildify(pkg.path)}`)
      await this.spawn('npm', ['link'], {
        cwd: pkg.path,
        stdio: ['inherit', 'inherit', 'inherit'],
      })
    }
  }
}
