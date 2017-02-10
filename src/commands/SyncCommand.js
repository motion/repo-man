// @flow

import FS from 'sb-fs'
import Path from 'path'
import copy from 'sb-copy'
import Command from '../command'
import { parseSourceURI, RepoManError } from '../helpers'

export default class SyncCommand extends Command {
  name = 'sync [org]'
  description = 'Sync configuration for projects, defaults to just current folder'

  async run(_: Object, orgName: string) {
    // until we get flags, lets just prompt
    const answer = await this.utils.prompt('Overwrite files on conflict?', ['no', 'yes'])
    const overwrite = answer === 'yes'

    const errors = []
    function handleError(e) {
      errors.push(e)
    }

    let statuses = null

    if (!orgName) {
      // current folder
      const currentProjectPath = await this.getCurrentProjectPath()
      if (!currentProjectPath) {
        throw new RepoManError('Current directory is not a Repoman project')
      }
      await this.syncRepo(currentProjectPath, overwrite, (path, status) => {
        statuses = { [path]: status }
        this.logStatuses(statuses)
      }, handleError)
    } else {
      // for entire organization
      const projects = await this.getProjects(orgName)
      statuses = projects.reduce((acc, cur) => ({ ...acc, [cur]: 0 }), {})
      this.logStatuses(statuses)
      await projects.map((projectPath) => {
        return this.syncRepo(projectPath, overwrite, (path, status) => {
          statuses[path] = status
          this.logStatuses(statuses)
        }, handleError)
      })
    }

    if (errors.length) {
      process.exitCode = 1
      this.log(new RepoManError('Unable to sync project dependencies'))
    }
    else {
      this.logStatuses(statuses, true)
    }
  }

  statuses = {
    0: this.utils.Symbol.x,
    1: this.utils.Symbol.check,
  }

  logStatuses(statuses: Object, persist: boolean) {
    let out = ''
    Object.keys(statuses).forEach((path) => {
      const status = statuses[path]
      out += ` ${this.statuses[status]} ${this.utils.tildify(path)}\n`
    })
    if (persist) {
      this.log(out)
    } else {
      process.stdout.clearLine()
      process.stdout.cursorTo(0)
      process.stdout.write(out)
    }
  }

  async syncRepo(projectPath: string, overwrite: boolean, onStatus: Function, onError: Function) {
    const log = chunk => this.log(chunk.toString().trim())
    const projectsRoot = await this.getProjectsRoot()

    // Dependencies
    const dependencies = []
    const currentProject = await this.getProjectDetails(projectPath)
    for (const entry of currentProject.dependencies) {
      try {
        const parsed = parseSourceURI(entry)
        const entryPath = Path.join(projectsRoot, parsed.username, parsed.repository)
        if (!await FS.exists(entryPath)) {
          dependencies.push(entry)
        }
      } catch (error) {
        onError(error)
      }
    }

    for (const dependency of dependencies) {
      try {
        await this.spawn(process.execPath, [process.argv[1] || require.resolve('../../cli'), 'get', dependency], {}, log, log)
      } catch (error) {
        onError(error)
      }
    }

    // Configurations
    const configsRoot = this.getConfigsRoot()
    for (const entry of currentProject.configurations) {
      try {
        const parsed = parseSourceURI(entry)
        const entryPath = Path.join(configsRoot, parsed.username, parsed.repository)
        if (!await FS.exists(entryPath)) {
          await this.spawn(process.execPath, [process.argv[1] || require.resolve('../../cli'), 'get-config', entry], {}, log, log)
        }
        // NOTE: We do not overwrite in install, we overwrite in update
        await copy(entryPath, projectPath, {
          dotFiles: true,
          overwrite,
          failIfExists: false,
        })

        onStatus(projectPath, 1)
      } catch (error) {
        onError(error)
      }
    }
  }
}
