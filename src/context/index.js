// @flow

import FS from 'sb-fs'
import Path from 'path'
import ConfigFile from 'sb-config-file'
import ChildProcess from 'child_process'

import * as Helpers from '../helpers'
import type { Options } from '../types'

export default class Context {
  state: ConfigFile;
  config: ConfigFile;
  options: Options;
  constructor(options: Options) {
    this.state = new ConfigFile(Path.join(options.stateDirectory, 'state.json'))
    this.config = new ConfigFile(Path.join(options.stateDirectory, 'config.json'))
    this.options = options
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

  log(text: string) {
    console.log(text)
  }
}
