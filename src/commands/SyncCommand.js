// @flow

import FS from 'sb-fs'
import Path from 'path'
import copy from 'sb-copy'
import invariant from 'assert'
import { Observable } from 'rxjs/Observable'

import Command from '../command'
import { parseSourceURI } from '../helpers'

export default class SyncCommand extends Command {
  name = 'sync [org]'
  description = 'Sync configuration for projects, defaults to just current folder'

  async run(options: Object, orgName: string) {
    const projectPaths = orgName ? await this.getProjects(orgName) : [await this.getCurrentProjectPath()]
    const overwrite = await this.helpers.prompt('Overwrite files on conflict?', ['no', 'yes']) === 'yes'
    const projects = await Promise.all(projectPaths.map(path => this.getProjectDetails(path)))

    const commandGet = this.repoMan.getCommand('get')
    const commandGetConfig = this.repoMan.getCommand('get-config')
    const projectsRoot = await this.getProjectsRoot()
    invariant(commandGet, 'get command not found when syncing repo')
    invariant(commandGetConfig, 'get-config command not found when syncing repo')

    await this.helpers.parallel('Syncing Projects', projects.map(project => ({
      title: project.name,
      // eslint-disable-next-line
      callback: () => new Observable(async (observer) => {
        observer.next('Processing dependencies')

        for (const entry of project.dependencies) {
          try {
            const parsed = parseSourceURI(entry)
            const entryPath = Path.join(projectsRoot, parsed.username, parsed.repository)
            if (!await FS.exists(entryPath)) {
              observer.next(`Installing ${entry}`)
              await commandGet.run({}, entry)
            }
          } catch (error) {
            observer.complete()
            observer.throw(error)
            return
          }
        }

        observer.next('Processing configurations')
        for (const entry of project.configurations) {
          try {
            const configPath = this.getConfigPath(parseSourceURI(entry))
            if (!await FS.exists(configPath)) {
              await commandGetConfig.run({ silent: true }, entry)
            }
            await copy(configPath, project.path, {
              filter: source => Path.basename(source) !== '.git',
              dotFiles: true,
              overwrite,
              failIfExists: false,
            })
          } catch (error) {
            observer.complete()
            observer.throw(error)
            return
          }
        }
        observer.complete()
      }),
    })))
  }
}
