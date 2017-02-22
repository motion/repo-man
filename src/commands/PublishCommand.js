// @flow
/* eslint-disable global-require */

import Path from 'path'
import Command from '../command'

export default class PublishCommand extends Command {
  name = 'publish <version_or_bump>'
  description = 'Publish repos (supports --scope and --ignore)'

  async run(options: Object, bumpType: string) {
    let packages = await this.getAllPackages()

    if (options.scope) {
      packages = this.matchPackages(packages, options.scope.split(',').filter(i => i))
    }
    if (options.ignore) {
      const ignored = this.matchPackages(packages, options.ignore.split(',').filter(i => i))
      packages = packages.filter(i => ignored.indexOf(i) === -1)
    }

    const packagesFiltered = []
    await this.helpers.parallel('Filtering projects', packages.map(pkg => ({
      title: pkg.name,
      async callback() {
        if (pkg.manifest.version && pkg.manifest.name && !pkg.manifest.private) {
          packagesFiltered.push(pkg)
        }
      },
    })))

    const packagesToPublish = []
    try {
      await this.helpers.parallel('Preparing to publish', packagesFiltered.map(pkg => ({
        title: pkg.name,
        // eslint-disable-next-line
        callback: async () => {
          const repository = this.getRepositoryState(pkg.project)
          if (!repository.clean) {
            throw new Error(`Project has uncommited changes: ${this.helpers.tildify(pkg.path)}`)
          }
          let lastTag = ''
          const tagExitCode = await this.spawn('git', ['describe', '--tags', '--abbrev=0'], {
            cwd: pkg.path,
            stdio: ['pipe', 'pipe', 'ignore'],
          }, (chunk) => { lastTag = chunk.toString().trim() })
          if (!lastTag || tagExitCode !== 0) {
            packagesToPublish.push(pkg)
            return
          }
          let changes = ''
          const diffExitCode = await this.spawn('git', ['diff', `${lastTag}...HEAD`], {
            cwd: pkg.path,
            stdio: ['pipe', 'pipe', 'inherit'],
          }, (chunk) => { changes += chunk.toString().trim() })
          if (diffExitCode !== 0 || changes.length) {
            packagesToPublish.push(pkg)
          }
        },
      })))
    } catch (_) {
      // Ignore because taskr already logged it to console
      return
    }

    try {
      await this.helpers.parallel('Executing prepublish scripts', packagesToPublish.map(pkg => ({
        title: pkg.name,
        // eslint-disable-next-line
        callback: async () => {
          let script
          if (pkg.manifest.scripts) {
            if (pkg.manifest.scripts.prepublish) {
              script = pkg.manifest.scripts.prepublish
            } else if (pkg.manifest.scripts.build) {
              script = pkg.manifest.scripts.build
            } else if (pkg.manifest.scripts.compile) {
              script = pkg.manifest.scripts.compile
            }
          }
          if (script) {
            await this.spawn(process.env.SHELL || 'sh', ['-c', `cd "${pkg.path}"; ${script}`], {
              cwd: pkg.path,
              stdio: ['inherit', 'ignore', 'inherit'],
              env: Object.assign({}, process.env, {
                PATH: [process.env.PATH, Path.join(pkg.path, 'node_modules', '.bin')].join(Path.delimiter),
              }),
            })
          }
        },
      })))
    } catch (_) {
      // Ignore because taskr already logged it to console
      return
    }

    try {
      await this.helpers.parallel('Publishing to NPM', packagesToPublish.map(pkg => ({
        title: pkg.name,
        // eslint-disable-next-line
        callback: async () => {
          const versionExitCode = await this.spawn('npm', ['version', bumpType], {
            cwd: pkg.path,
            stdio: ['ignore', 'ignore', 'inherit'],
          })
          if (versionExitCode !== 0) {
            return
          }
          await this.spawn('npm', ['publish'], {
            cwd: pkg.path,
            stdio: ['ignore', 'ignore', 'inherit'],
          })
        },
      })))
    } catch (_) {
      // Ignore because taskr already logged it to console
      return
    }

    try {
      await this.helpers.parallel('Pushing to git remote', packagesToPublish.map(pkg => ({
        title: pkg.name,
        // eslint-disable-next-line
        callback: async () => {
          await this.spawn('git', ['push', '-u', 'origin', 'HEAD', '--follow-tags'], {
            cwd: pkg.path,
            stdio: ['ignore', 'ignore', 'ignore'],
          })
        },
      })))
    } catch (_) {
      // Ignore because taskr already logged it to console
      return
    }
  }
}
