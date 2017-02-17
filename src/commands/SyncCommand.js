// @flow

import FS from 'sb-fs'
import Path from 'path'
import copy from 'sb-copy'
import invariant from 'assert'

import Command from '../command'
import { parseSourceURI } from '../helpers'
import type { Project } from '../types'

const STATE = {
  ERR: 0,
  SKIP: 1,
  PASS: 2,
  FAIL: 3,
  EMPTY: 4,
}

export default class SyncCommand extends Command {
  name = 'sync [org]'
  description = 'Sync configuration for projects, defaults to just current folder'

  async run(_: Object, orgName: string) {
    // until we get flags, lets just prompt
    const answer = await this.helpers.prompt('Overwrite files on conflict?', ['no', 'yes'])
    const overwrite = answer === 'yes'

    const projectPaths = orgName
      ? await this.getProjects(orgName)
      : [await this.getCurrentProjectPath()]
    const statuses = projectPaths.reduce((acc, cur) => ({
      ...acc,
      [cur]: STATE.EMPTY,
    }), {})

    const errors = []
    const handleError = (project: Project, error) => errors.push({ project, error })
    const handleStatus = (project: Project, status: number) => {
      // log updated statuses
      statuses[project.path] = status
      this.logStatuses(statuses)
    }

    // log once before run
    this.logStatuses(statuses)

    // run syncs
    const projects = await Promise.all(projectPaths.map(project => this.getProjectDetails(project)))
    // update project config files // TODO add flag
    let configs: Array<string> = []
    projects.forEach(function(project) {
      configs = configs.concat(project.configurations)
    })
    const commandGetConfig = this.repoMan.getCommand('get-config')
    invariant(commandGetConfig, 'get-config command not found while updating configs')

    await Promise.all(configs.map(config => commandGetConfig.run({ silent: true }, config)))

    await Promise.all(projects.map(project =>
      this.syncRepo(project, overwrite, handleStatus, handleError)
    ))

    // persist statuses
    this.logStatuses(statuses, true)

    if (errors.length) {
      process.exitCode = 1
      this.log(new this.helpers.RepoManError('Unable to sync project dependencies'))
      this.log('Errors:')
      this.log(errors.map(e => e.error.message).join('\n'))
    }
  }

  statuses = {
    [STATE.EMPTY]: this.helpers.Symbol.dot,
    [STATE.SKIP]: this.helpers.Symbol.dot,
    [STATE.PASS]: this.helpers.Symbol.check,
    [STATE.FAIL]: this.helpers.Symbol.x,
  }

  logStatuses(statuses: Object, persist: boolean = false) {
    const out = []
    Object.keys(statuses).forEach((path) => {
      const status = statuses[path]
      out.push(` ${this.statuses[status]} ${Path.basename(path)}`)
    })
    // clear screen
    process.stdout.write('\u001B[2J\u001B[0;0f')
    process.stdout.write(out.join('\n'))
    if (persist) {
      console.log('\n')
    }
  }

  async syncRepo(project: Project, overwrite: boolean, onStatus: Function, onErrorCb: Function) {
    const onError = (err) => {
      onErrorCb(project, err)
      onStatus(project, STATE.FAIL)
    }
    const projectsRoot = await this.getProjectsRoot()
    const commandGet = this.repoMan.getCommand('get')
    const commandGetConfig = this.repoMan.getCommand('get-config')

    invariant(commandGet, 'get command not found when syncing repo')
    invariant(commandGetConfig, 'get-config command not found when syncing repo')

    // Dependencies
    const dependencies = []
    if (project.dependencies) {
      for (const entry of project.dependencies) {
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
          await commandGet.run({}, dependency)
        } catch (error) {
          onError(error)
        }
      }
    }

    // Configurations
    if (!project.configurations) {
      onStatus(project, STATE.SKIP)
    } else {
      for (const entry of project.configurations) {
        try {
          const configPath = this.getConfigPath(parseSourceURI(entry))
          if (!await FS.exists(configPath)) {
            await commandGetConfig.run({ silent: true }, entry)
          }
          // NOTE: We do not overwrite in install, we overwrite in update
          await copy(configPath, project.path, {
            filter: source => Path.basename(source) !== '.git',
            dotFiles: true,
            overwrite,
            failIfExists: false,
          })

          onStatus(project, STATE.PASS)
        } catch (error) {
          onError(error)
        }
      }
    }
  }
}
