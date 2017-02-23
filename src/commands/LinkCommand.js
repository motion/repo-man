// @flow
/* eslint-disable global-require */

import semver from 'semver'
import Command from '../command'
import type { Package } from '../types'

export default class LinkCommand extends Command {
  name = 'link'
  description = 'Link NPM packages [org...]'
  options = [
    ['--together', 'Link packages inside each other instead of linking them globally'],
    ['--no-install', 'Only link packages without installing other dependencies'],
    ['--production', 'Do not install devDependencies when installing dependencies'],
    ['--scope <pattern>', 'Limit to packages that match comma separated pattern (eg package-name or org/repo or org/repo/package-name)'],
    ['--ignore <pattern>', 'Ignore packages that match pattern (eg package-name or org/repo or org/repo/package-name)'],
  ]

  async run(options: Object, orgs: Array<string>) {
    let packages = await this.getAllPackages()

    if (options.scope) {
      packages = this.matchPackages(packages, options.scope.split(',').filter(i => i))
    }
    if (options.ignore) {
      const ignored = this.matchPackages(packages, options.ignore.split(',').filter(i => i))
      packages = packages.filter(i => ignored.indexOf(i) === -1)
    }
    if (orgs) {
      packages = packages.filter(pkg => orgs.indexOf(pkg.project.org) !== -1)
    }

    if (options.together) {
      await this.linkTogether(packages, options)
    } else {
      await this.linkGlobally(packages)
    }
  }
  async linkGlobally(packages: Array<Package>): Promise<void> {
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
  async linkTogether(packages: Array<Package>, options: Object): Promise<void> {
    const packagesMap = {}
    packages.forEach((pkg) => {
      packagesMap[pkg.name] = {
        local: [],
        external: [],
        version: pkg.manifest.version || '',
      }
    })
    const production = options.production || process.env.NODE_ENV === 'production'

    await this.helpers.parallel('Preparing packages', packages.map(pkg => ({
      title: pkg.name,
      // eslint-disable-next-line arrow-parens
      callback: async () => {
        const dependencies = {}
        if (pkg.manifest.dependencies) {
          Object.assign(dependencies, pkg.manifest.dependencies)
        }
        if (pkg.manifest.devDependencies && !production) {
          Object.assign(dependencies, pkg.manifest.devDependencies)
        }
        for (const key in dependencies) {
          if (!{}.hasOwnProperty.call(dependencies, key)) continue
          const expectedVersion = dependencies[key]
          // NOTE: Do not try to link as local if local's version is empty
          if (packagesMap[key] && packagesMap[key].verison && semver.satisfies(packagesMap[key].version, expectedVersion)) {
            packagesMap[pkg.name].local.push(key)
          } else {
            packagesMap[pkg.name].external.push(key)
          }
        }
      },
    })))

    console.dir(packagesMap, { depth: Infinity })
  }
}
