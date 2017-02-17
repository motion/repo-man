// @flow

import Command from '../command'

export default class PublishCommand extends Command {
  name = 'publish <version_or_bump>'
  description = 'Publish repos (supports --scope and --ignore)'

  async run(options: Object, bumpType: string) {
    let projects = await this.getProjects()
    const changedProjects = []

    if (options.scope) {
      projects = this.matchProjects(projects, options.scope.split(',').filter(i => i))
    }
    if (options.ignore) {
      const ignored = this.matchProjects(projects, options.ignore.split(',').filter(i => i))
      projects = projects.filter(i => ignored.indexOf(i) === -1)
    }

    let foundDirty = false
    for (const project of projects) {
      const details = await this.getProjectDetails(project)
      if (!details.repository.clean) {
        foundDirty = true
        this.log(`Project has uncommited changes: ${this.helpers.tildify(project)}`)
      }
      let lastTag = ''
      const tagExitCode = await this.spawn('git', ['describe', '--tags', '--abbrev=0'], {
        cwd: project,
        stdio: ['pipe', 'pipe', 'inherit'],
      }, (chunk) => { lastTag = chunk.toString().trim() })
      if (tagExitCode === 0) {
        // Non-zero code means no tag yet
        let changes = ''
        const diffExitCode = await this.spawn('git', ['diff', `${lastTag}...HEAD`], {
          cwd: project,
          stdio: ['pipe', 'pipe', 'inherit'],
        }, (chunk) => { changes += chunk.toString().trim() })
        if (diffExitCode !== 0 || changes.length) {
          changedProjects.push(project)
        }
      } else {
        changedProjects.push(project)
      }
    }
    if (foundDirty) {
      process.exitCode = 1
      return
    }

    console.log('These repos have been changed since last release:', changedProjects.map(this.helpers.tildify).join(', '))
    for (const project of changedProjects) {
      const versionExitCode = await this.spawn('npm', ['version', bumpType], {
        cwd: project,
        stdio: ['inherit', 'inherit', 'inherit'],
      })
      if (versionExitCode !== 0) {
        continue
      }
      await this.spawn('npm', ['publish'], {
        cwd: project,
        stdio: ['inherit', 'inherit', 'inherit'],
      })
    }
  }
}
