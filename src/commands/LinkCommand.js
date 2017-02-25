// @flow
/* eslint-disable global-require */

import FS from 'sb-fs'
import Path from 'path'
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
    ['--npm-client <name>', 'Executable used to install external dependencies (eg. npm / pnpm / yarn)', 'npm'],
    ['--scope <pattern>', 'Limit to packages that match comma separated pattern (eg package-name or org/repo or org/repo/package-name or org/* or *)'],
    ['--ignore <pattern>', 'Ignore packages that match pattern (eg package-name or org/repo or org/repo/package-name or org/*)'],
  ]

  async run(options: Object, orgs: Array<string>) {
    let packages = await this.getAllPackages()

    if (!options.scope) {
      const currentProject = await this.getCurrentProject()
      options.scope = `${currentProject.org}/${options.together ? '*' : currentProject.name}`
    }
    if (options.scope !== '*') {
      packages = this.matchPackages(packages, this.helpers.split(options.scope, ','))
    }
    if (options.ignore) {
      const ignored = this.matchPackages(packages, this.helpers.split(options.ignore, ','))
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
      }, pkg.project)
    }
  }
  async linkTogether(packages: Array<Package>, options: Object): Promise<void> {
    const packagesMap = {}
    packages.forEach((pkg) => {
      packagesMap[pkg.name] = {
        path: pkg.path,
        internal: [],
        external: [],
        version: pkg.manifest.version || '',
        manifest: pkg.manifest,
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
          // NOTE: Do not try to link as internal if internal's version is empty
          if (packagesMap[key] && packagesMap[key].version && semver.satisfies(packagesMap[key].version, expectedVersion)) {
            packagesMap[pkg.name].internal.push(key)
          } else {
            packagesMap[pkg.name].external.push(key)
          }
        }
      },
    })))

    if (!options.noInstall) {
      await this.helpers.parallel('Installing external dependencies', packages.map(pkg => ({
        title: pkg.name,
        // eslint-disable-next-line arrow-parens
        callback: async () => {
          const externalDependencies = packagesMap[pkg.name].external
          if (!externalDependencies.length) {
            return
          }
          const parameters = ['install'].concat(packagesMap[pkg.name].external)
          if (options.npmClient === 'npm') {
            parameters.push('--loglevel', 'error')
          }
          await this.spawn(options.npmClient, parameters, {
            cwd: pkg.path,
            stdio: ['ignore', 'ignore', 'inherit'],
          }, pkg.project)
        },
      })))
    }

    await this.helpers.parallel('Linking internal dependencies', packages.map(pkg => ({
      title: pkg.name,
      // eslint-disable-next-line arrow-parens
      callback: async () => {
        const internalDependencies = packagesMap[pkg.name].internal
        if (!internalDependencies.length) {
          return
        }
        await FS.mkdirp(Path.join(pkg.path, 'node_modules'))

        for (const dependency of internalDependencies) {
          const destPath = Path.join(pkg.path, 'node_modules', dependency)
          try {
            await FS.unlink(destPath)
          } catch (_) { /* No Op */ }
          try {
            await FS.rimraf(destPath)
          } catch (_) { /* No Op */ }
          await FS.symlink(packagesMap[dependency].path, destPath)
        }
      },
    })))

    const processedPackages = []
    for (const name in packagesMap) {
      if (!{}.hasOwnProperty.call(packagesMap, name)) continue
      const pkg = packagesMap[name]
      if (pkg.internal.length || (pkg.external.length && !production)) {
        processedPackages.push(pkg.manifest.name)
      }
    }
    if (processedPackages.length) {
      this.log(` ${this.helpers.Color.green('✔')} Processed ${processedPackages.join(', ')}`)
    } else {
      this.log(` ${this.helpers.Color.red('x')} No packages were linked together`)
    }
  }
}
