// @flow

import FS from 'sb-fs'
import Path from 'path'
import ConfigFile from 'sb-config-file'
import ChildProcess from 'child_process'
import getPackageInfo from 'package-info'
import gitStatus from './helpers/git-status'
import * as Utils from './context-utils'

import * as Helpers from './helpers'
import type { Options, Project, Repository, Organization } from './types'

export default class Command {
  name: string;
  description: string;

  state: ConfigFile;
  config: ConfigFile;
  options: Options;
  utils: Utils;
  fs: FS;
  // eslint-disable-next-line
  run(...params: Array<any>) {
    throw new Error('Command::run() is unimplemented')
  }
  initialize(options: Options) {
    this.state = new ConfigFile(Path.join(options.stateDirectory, 'state.json'))
    this.config = new ConfigFile(Path.join(options.stateDirectory, 'config.json'))
    this.options = options
    this.utils = Utils
    this.fs = FS
  }
  getProjectsRoot(): string {
    return Helpers.processPath(this.config.get('projectsRoot'))
  }
  async ensureProjectsRoot(): void {
    const projectsRoot = this.getProjectsRoot()
    await FS.mkdirp(projectsRoot)
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
  async getOrganizations(): Promise<Array<Organization>> {
    const organizations = []
    const projectsRoot = this.getProjectsRoot()
    const entries = await FS.readdir(projectsRoot)
    await Promise.all(entries.map(async function(entry) {
      const path = Path.join(projectsRoot, entry)
      const stat = await FS.lstat(path)
      if (stat.isDirectory()) {
        organizations.push({ name: entry, path })
      }
      return true
    }))
    return organizations
  }
  async getProjects(): Promise<Array<string>> {
    const projects = []
    const organizations = await this.getOrganizations()
    await Promise.all(organizations.map(async function({ path }) {
      const items = await FS.readdir(path)
      for (const item of items) {
        const itemPath = Path.join(path, item)
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
      version: await this.getPackageVersion(path),
      repository: await this.getRepositoryDetails(path),
    })
  }
  async getRepositoryDetails(path: string): Promise<Repository> {
    return {
      path,
      ...await gitStatus(path),
    }
  }
  async getPackageVersion(path: string): Promise<?string> {
    const manifestPath = Path.join(path, 'package.json')
    if (!await FS.exists(manifestPath)) {
      return null
    }
    const manifest = (new ConfigFile(manifestPath)).get()
    if (typeof manifest.name !== 'string') {
      return null
    }
    try {
      const remoteManifest = await new Promise(resolve => getPackageInfo(manifest.name, resolve))
      return remoteManifest || null
    } catch (_) { return null }
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

  log(text: any) {
    if (text && text.name === 'RepoManError') {
      console.log('Error:', text.message)
    } else {
      console.log(text)
    }
  }
  newline() {
    console.log('')
  }
  error(value: string) {
    throw new Helpers.RepoManError(value)
  }
}
