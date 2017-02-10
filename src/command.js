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
  utils: Utils;
  state: ConfigFile;
  config: ConfigFile;
  options: Options;
  commands: Object<string, Command>;

  constructor(options: Options) {
    this.state = new ConfigFile(Path.join(options.stateDirectory, 'state.json'))
    this.config = new ConfigFile(Path.join(options.stateDirectory, 'config.json'))
    this.options = options
    this.utils = Utils

    // $FlowIgnore: Dirty patch but required
    this.run = this.run.bind(this)
  }
  setCommands(commands: Object<string, Command>) {
    this.commands = commands
  }
  // eslint-disable-next-line
  run(...params: Array<any>) {
    throw new Error('Command::run() is unimplemented')
  }
  getCommands(): Object<string, Command> {
    return this.commands
  }
  getProjectsRoot(): string {
    return Helpers.processPath(this.config.get('projectsRoot'))
  }
  getConfigsRoot(): string {
    return Path.join(this.getProjectsRoot(), 'configs')
  }
  async ensureProjectsRoot(): Promise<void> {
    await FS.mkdirp(this.getProjectsRoot())
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
      if (stat.isDirectory() && entry !== 'configs') {
        organizations.push({ name: entry, path })
      }
      return true
    }))
    return organizations
  }
  async getOrganization(name: string): Promise<Organization> {
    const organizations = await this.getOrganizations()
    const index = organizations.findIndex(org => this.lastFolder(org.path) === name)
    if (index === -1) {
      this.error(`No organization found: ${name}`)
    }
    return organizations[index]
  }
  async getProjects(orgName?: string): Promise<Array<string>> {
    const projects = []
    let organizations = []
    // allow finding for specific organization
    if (orgName) {
      organizations = [await this.getOrganization(orgName)]
    }
    else {
      organizations = await this.getOrganizations()
    }
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
  async getProjectDetails(path: string, npm: boolean): Promise<Project> {
    const name = path.split(Path.sep).slice(-2).join('/')
    const configFilePath = Path.join(path, Helpers.CONFIG_FILE_NAME)
    let config = {}

    // get config from .repoman.json if exists
    if (await FS.exists(configFilePath)) {
      config = new ConfigFile(configFilePath, {
        dependencies: [],
        configurations: [],
      }).get()
    }

    return Object.assign(config, {
      path,
      name,
      version: npm ? await this.getPackageVersion(path) : null,
      repository: await this.getRepositoryDetails(path),
    })
  }
  async getRepositoryDetails(path: string): Promise<Repository> {
    try {
      return {
        path,
        ...await gitStatus(path),
      }
    } catch (e) {
      return { path }
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
  async updateConfigs(projects: Array<Project>): void {
    // flatten
    const configs = [].concat([
      ...projects
        .filter(p => p.configurations && p.configurations.length)
        .map(p => p.configurations)
    ])

    await Promise.all(
      configs.map(config => this.commands['get-config'].run({ silent: true }, config))
    )
  }
  lastFolder(path: string) {
    const list = path.split(Path.sep)
    return list[list.length - 1]
  }

  log(text: any) {
    if (this.silent) {
      return
    }
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
