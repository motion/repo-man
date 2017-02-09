// @flow

import FS from 'sb-fs'
import Path from 'path'
import copy from 'sb-copy'
import Command from '../command'
import { parseSourceURI, RepoManError } from '../helpers'

export default class InstallCommand extends Command {
  name = 'install'
  description = 'Install current project dependencies'

  async run() {
    const currentProjectPath = await this.getCurrentProjectPath()
    if (!currentProjectPath) {
      throw new RepoManError('Current directory is not a Repoman project')
    }
    const log = chunk => this.log(chunk.toString().trim())
    const projectsRoot = await this.getProjectsRoot()

    // Dependencies
    const dependencies = []
    const currentProject = await this.getProjectDetails(currentProjectPath)
    for (const entry of currentProject.dependencies) {
      try {
        const parsed = parseSourceURI(entry)
        const entryPath = Path.join(projectsRoot, parsed.username, parsed.repository)
        if (!await FS.exists(entryPath)) {
          dependencies.push(entry)
        }
      } catch (error) {
        this.log(error)
        process.exitCode = 1
      }
    }

    for (const dependency of dependencies) {
      try {
        await this.spawn(process.execPath, [process.argv[1] || require.resolve('../../cli'), 'get', dependency], {}, log, log)
      } catch (error) {
        this.log(error)
        process.exitCode = 1
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
        await copy(entryPath, currentProjectPath, {
          dotFiles: true,
          overwrite: false,
          failIfExists: false,
        })
      } catch (error) {
        this.log(error)
        process.exitCode = 1
      }
    }

    if (process.exitCode === 1) {
      this.log(new RepoManError('Unable to install project dependencies'))
    } else {
      this.log('Successfully installed project dependencies')
    }
  }
}
