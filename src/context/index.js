// @flow

import FS from 'sb-fs'
import Path from 'path'
import invariant from 'assert'
import ConfigFile from 'sb-config-file'
import ChildProcess from 'child_process'

import * as Helpers from '../helpers'
import type { Options, Command } from '../types'

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
  async getProjects(): Promise<Array<string>> {
    const projectsRoot = this.getProjectsRoot()
    const entries = await FS.readdir(projectsRoot)
    const projects = []
    await Promise.all(entries.map(async function(entry) {
      const path = Path.join(projectsRoot, entry)
      const stat = await FS.lstat(path)
      if (stat.isDirectory()) {
        projects.push(path)
      }
      return true
    }))
    return projects
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
  addCommand(name: string, description: string, callback: (() => any)) {
    invariant(typeof name === 'string', 'name must be a string')
    invariant(typeof description === 'string', 'description must be a string')
    invariant(typeof callback === 'string', 'callback must be a function')

    this.removeCommand(name)
    this.commands.push({ name, description, callback })
  }
  removeCommand(name: string, callback: ?(() => any) = null) {
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
