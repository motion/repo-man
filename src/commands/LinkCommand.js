// @flow
/* eslint-disable global-require */

import FS from 'sb-fs'
import Path from 'path'
import Command from '../command'

export default class LinkCommand extends Command {
  name = 'link'
  description = 'Link NPM packages'

  async run(options: Object) {
    let projects = await this.getProjects()

    if (options.scope) {
      projects = this.matchProjects(projects, options.scope.split(',').filter(i => i))
    }
    if (options.ignore) {
      const ignored = this.matchProjects(projects, options.ignore.split(',').filter(i => i))
      projects = projects.filter(i => ignored.indexOf(i) === -1)
    }
    const npmProjects = []

    for (const project of projects) {
      const manifestPath = Path.join(project.path, 'package.json')
      if (await FS.exists(manifestPath)) {
        // $FlowIgnore: We have to.
        const manifest = require(manifestPath)
        if (!manifest.name || manifest.private || !manifest.version) {
          this.log(`Ignoring ${this.helpers.tildify(project)} because it's a private package`)
        } else {
          npmProjects.push(project)
        }
      } else {
        this.log(`Ignoring ${this.helpers.tildify(project)} because it's not an npm package`)
      }
    }
    for (const project of npmProjects) {
      this.log(`Linking ${this.helpers.tildify(project)}`)
      await this.spawn('npm', ['link'], {
        cwd: project,
        stdio: ['inherit', 'inherit', 'inherit'],
      })
    }
  }
}
