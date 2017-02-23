
// @flow

import FS from 'sb-fs'
import Path from 'path'
import copy from 'sb-copy'
import invariant from 'assert'
import { uniq, flatten } from 'lodash'
import { Observable } from 'rxjs/Observable'
import Command from '../command'
import { parseSourceURI } from '../helpers'

export default class SyncCommand extends Command {
  name = 'sync [org]'
  description = 'Sync configuration for projects, defaults to just current project'

  async run(options: Object, orgName: string) {
    const overwrite = await this.helpers.prompt('Overwrite files on conflict?', ['no', 'yes']) === 'yes'

    const configsRoot = await this.getConfigsRoot()
    const projectsRoot = await this.getProjectsRoot()
    const projects = orgName ? await this.getProjects(orgName) : [await this.getCurrentProject()]

    const commandGet = this.repoMan.getCommand('get')
    const commandGetConfig = this.repoMan.getCommand('get.config')
    invariant(commandGet, 'get command not found when syncing repo')
    invariant(commandGetConfig, 'get.config command not found when syncing repo')

    // update all configuration repos
    const configs = uniq(flatten(projects.map(project => project.configurations)))
    await Promise.all(
      configs.map(config => commandGetConfig.run({}, config))
    )

    // copy configs
    await this.helpers.parallel('Syncing Projects', projects.map(project => ({
      title: project.name,
      // eslint-disable-next-line
      callback: () => new Observable(async (observer) => {
        observer.next('Processing dependencies')

        for (const entry of project.dependencies) {
          try {
            const parsed = parseSourceURI(projectsRoot, entry)
            if (!await FS.exists(parsed.path)) {
              observer.next(`Installing ${entry}`)
              await commandGet.run({}, entry)
            }
          } catch (error) {
            observer.complete()
            this.log(error)
            return
          }
        }

        observer.next('Processing configurations')
        for (const entry of project.configurations) {
          try {
            const parsed = parseSourceURI(configsRoot, entry)
            const sourcePath = Path.join(parsed.path, parsed.subpath || '')
            await copy(sourcePath, project.path, {
              filter: source => Path.basename(source) !== '.git',
              dotFiles: true,
              overwrite,
              failIfExists: false,
            })
          } catch (error) {
            observer.complete()
            this.log(error)
            return
          }
        }
        observer.complete()
      }),
    })))
  }
}
