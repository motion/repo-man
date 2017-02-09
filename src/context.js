// @flow

import FS from 'sb-fs'
import Path from 'path'
import invariant from 'assert'
import gitState from 'git-state'
import promisify from 'sb-promisify'
import ConfigFile from 'sb-config-file'
import ChildProcess from 'child_process'

import * as Helpers from './helpers'
import type { Options, Command, Project, Repository } from './types'

const getGitState = promisify(gitState.check)

export default class Context {
  state: ConfigFile;
  config: ConfigFile;
  options: Options;
  commands: Array<Command>;
  constructor(options: Options) {
    this.state = new ConfigFile(Path.join(options.stateDirectory, 'state.json'))
    this.config = new ConfigFile(Path.join(options.stateDirectory, 'config.json'))
    this.options = options
    this.commands = []
  }
  getProjectsRoot(): string {
    return Helpers.processPath(this.config.get('projectsRoot'))
  }
  async getCurrentProjectPath(): Promise<?string> {
    const currentDirectory = process.cwd()
    const projectsRoot = this.getProjectsRoot()
    const rootIndex = currentDirectory.indexOf(projectsRoot)
    if (rootIndex !== 0) {
      return null
    }
    const chunks = currentDirectory.slice(projectsRoot.length + 1).split(Path.sep).slice(0, 2)
    if (chunks.length !== 2) {
      return null
    }
    return Path.join(projectsRoot, chunks[0], chunks[1])
  }
  async getProjects(): Promise<Array<string>> {
    const projects = []
    const organizations = []
    const projectsRoot = this.getProjectsRoot()

    const entries = await FS.readdir(projectsRoot)
    await Promise.all(entries.map(async function(entry) {
      const path = Path.join(projectsRoot, entry)
      const stat = await FS.lstat(path)
      if (stat.isDirectory()) {
        organizations.push(path)
      }
      return true
    }))

    await Promise.all(organizations.map(async function(orgPath) {
      const items = await FS.readdir(orgPath)
      for (const item of items) {
        const itemPath = Path.join(orgPath, item)
        const stat = await FS.lstat(itemPath)
        if (stat.isDirectory()) {
          projects.push(itemPath)
        }
      }
      return null
    }))
    return projects
  }
  async getProjectDetails(path: string): Promise<Project> {
    const name = path.split(Path.sep).slice(-2).join('/')
    const config = new ConfigFile(Path.join(path, Helpers.CONFIG_FILE_NAME), {
      dependencies: [],
      configurations: [],
    })
    return Object.assign(config.get(), {
      path,
      name,
      repository: await this.getRepositoryDetails(path),
    })
  }
  async getRepositoryDetails(path: string): Promise<Repository> {
    const state = await getGitState(path)
    return {
      path,
      ahead: state.ahead,
      branch: state.branch,
      stashes: state.stashes,
      filesDirty: state.dirty,
      filesUntracked: state.untracked,
    }
  }
  async spawn(name: string, parameters: Array<string>, options: Object, onStdout: ?((chunk: string) => any), onStderr: ?((chunk: string) => any)) {
    return new Promise((resolve, reject) => {
      const spawned = ChildProcess.spawn(name, parameters, options)
      if (onStdout) {
        spawned.stdout.on('data', onStdout)
      }
      if (onStderr) {
        spawned.stderr.on('data', onStderr)
      }
      spawned.on('close', resolve)
      spawned.on('error', reject)
    })
  }

  getCommands(): Array<Command> {
    return this.commands.map(({ name, description, callback }) => ({
      name,
      description,
      callback: (...params) => callback.apply(this, params),
    }))
  }
  addCommand(name: string, description: string, callback: Function) {
    invariant(typeof name === 'string', 'name must be a string')
    invariant(typeof description === 'string', 'description must be a string')
    invariant(typeof callback === 'function', 'callback must be a function')

    this.removeCommand(name)
    this.commands.push({ name, description, callback })
  }
  removeCommand(name: string, callback: ?Function = null) {
    let i = this.commands.length
    while (i--) {
      const entry = this.commands[i]
      if (entry.name === name && (!callback || entry.callback === callback)) {
        this.commands.splice(i, 1)
      }
    }
  }

  log(text: string) {
    console.log(text)
  }
}
