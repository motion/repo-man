// @flow
/* eslint-disable global-require */

import FS from 'sb-fs'
import Path from 'path'
import Command from '../command'

export default class PublishCommand extends Command {
  name = 'publish <version_or_bump>'
  description = 'Publish repos (supports --scope and --ignore)'

  async run(options: Object, bumpType: string) {
    let projectPaths = await this.getProjects()
    if (options.scope) {
      projectPaths = this.matchProjects(projectPaths, options.scope.split(',').filter(i => i))
    }
    if (options.ignore) {
      const ignored = this.matchProjects(projectPaths, options.ignore.split(',').filter(i => i))
      projectPaths = projectPaths.filter(i => ignored.indexOf(i) === -1)
    }

    const projectsFiltered = []
    const projects = await Promise.all(projectPaths.map(project => this.getProjectState(project)))
    const repositories = await Promise.all(projects.map(project => this.getRepositoryState(project)))

    await this.helpers.parallel('Filtering projects', projects.map(project => ({
      title: project.name,
      async callback() {
        const manifestPath = Path.join(project.path, 'package.json')
        if (!await FS.exists(manifestPath)) {
          return
        }
        // $FlowIgnore: We have to.
        const manifest = require(manifestPath)
        if (manifest && manifest.version && manifest.name && !manifest.private) {
          projectsFiltered.push(project)
        }
      },
    })))

    const projectsToPublish = []
    try {
      await this.helpers.parallel('Preparing to publish', repositories.map(repository => ({
        title: repository.project.name,
        // eslint-disable-next-line
        callback: async () => {
          if (!repositories.clean) {
            throw new Error(`Project has uncommited changes: ${this.helpers.tildify(repository.project.path)}`)
          }
          let lastTag = ''
          const tagExitCode = await this.spawn('git', ['describe', '--tags', '--abbrev=0'], {
            cwd: repository.project.path,
            stdio: ['pipe', 'pipe', 'ignore'],
          }, (chunk) => { lastTag = chunk.toString().trim() })
          if (!lastTag || tagExitCode !== 0) {
            projectsToPublish.push(repository.project)
            return
          }
          let changes = ''
          const diffExitCode = await this.spawn('git', ['diff', `${lastTag}...HEAD`], {
            cwd: repository.project.path,
            stdio: ['pipe', 'pipe', 'inherit'],
          }, (chunk) => { changes += chunk.toString().trim() })
          if (diffExitCode !== 0 || changes.length) {
            projectsToPublish.push(repository.project)
          }
        },
      })))
    } catch (_) {
      // Ignore because taskr already logged it to console
      return
    }

    try {
      await this.helpers.parallel('Executing prepublish scripts', projectsFiltered.map(project => ({
        title: project.name,
        // eslint-disable-next-line
        callback: async () => {
          let script
          // $FlowIgnore: Sorry flow
          const manifest = require(Path.join(project.path, 'package.json'))
          if (manifest.scripts) {
            if (manifest.scripts.prepublish) {
              script = manifest.scripts.prepublish
            } else if (manifest.scripts.build) {
              script = manifest.scripts.build
            } else if (manifest.scripts.compile) {
              script = manifest.scripts.compile
            }
          }
          if (script) {
            await this.spawn(process.env.SHELL || 'sh', ['-c', `cd "${project.path}"; ${script}`], {
              cwd: project.path,
              stdio: ['inherit', 'ignore', 'inherit'],
              env: Object.assign({}, process.env, {
                PATH: [process.env.PATH, Path.join(project.path, 'node_modules', '.bin')].join(Path.delimiter),
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
      await this.helpers.parallel('Publishing to NPM', projectsFiltered.map(project => ({
        title: project.name,
        // eslint-disable-next-line
        callback: async () => {
          const versionExitCode = await this.spawn('npm', ['version', bumpType], {
            cwd: project.path,
            stdio: ['ignore', 'ignore', 'inherit'],
          })
          if (versionExitCode !== 0) {
            return
          }
          await this.spawn('npm', ['publish'], {
            cwd: project.path,
            stdio: ['ignore', 'ignore', 'inherit'],
          })
        },
      })))
    } catch (_) {
      // Ignore because taskr already logged it to console
      return
    }

    try {
      await this.helpers.parallel('Pushing to git remote', projectsFiltered.map(project => ({
        title: project.name,
        // eslint-disable-next-line
        callback: async () => {
          await this.spawn('git', ['push', '-u', 'origin', 'HEAD', '--follow-tags'], {
            cwd: project.path,
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
