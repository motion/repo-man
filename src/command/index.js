// @flow

import FS from 'sb-fs'
import Path from 'path'
import promisify from 'sb-promisify'
import packageInfo from 'package-info'
import expandTilde from 'expand-tilde'
import ConfigFile from 'sb-config-file'
import ChildProcess from 'child_process'

import Helpers from './helpers'

import { CONFIG_FILE_NAME, RepoManError } from '../helpers'
import type RepoMan from '../'
import type { Options, Project, Repository, Organization, ParsedRepo } from '../types'

const getPackageInfo = promisify(packageInfo)

export default class Command {
  name: string;
  state: ConfigFile;
  silent: boolean;
  config: ConfigFile;
  options: Options;
  helpers: typeof Helpers;
  repoMan: RepoMan;
  description: string;

  constructor(options: Options, repoMan: RepoMan) {
    this.state = new ConfigFile(Path.join(options.stateDirectory, 'state.json'))
    this.config = new ConfigFile(Path.join(options.stateDirectory, 'config.json'))
    this.options = options
    this.repoMan = repoMan
    this.helpers = Helpers
  }
  // eslint-disable-next-line
  run(...params: Array<any>) {
    throw new Error('Command::run() is unimplemented')
  }
  getProjectsRoot(): string {
    return expandTilde(this.config.get('projectsRoot'))
  }
  getConfigsRoot(): string {
    return Path.join(this.getProjectsRoot(), 'configs')
  }
  getConfigPath(parsed: ParsedRepo): string {
    const subfolder = parsed.subfolder || ''
    return Path.join(...[
      this.getConfigsRoot(),
      parsed.username,
      parsed.repository,
      subfolder,
    ].filter(x => !!x))
  }
  matchProjects(projects: Array<string>, queries: Array<string>): Array<string> {
    return projects.filter((project: string) => {
      const projectBase = Path.basename(project)
      const projectName = project.split(Path.sep).slice(-2).join(Path.sep)

      for (let i = 0, length = queries.length; i < length; i++) {
        const query = queries[i]
        const chunks = query.split('/')
        if (chunks.length === 1 && projectBase === query) {
          return true
        } else if (chunks.length === 2 && projectName === query) {
          return true
        }
      }
      return false
    })
  }
  async ensureProjectsRoot(): Promise<void> {
    await FS.mkdirp(this.getProjectsRoot())
  }
  async getCurrentProjectPath(): Promise<string> {
    const currentDirectory = process.cwd()
    const projectsRoot = this.getProjectsRoot()
    const rootIndex = currentDirectory.indexOf(projectsRoot)
    if (rootIndex === 0) {
      const chunks = currentDirectory.slice(projectsRoot.length + 1).split(Path.sep).slice(0, 2)
      if (chunks.length === 2) {
        return Path.join(projectsRoot, chunks[0], chunks[1])
      }
    }
    throw new RepoManError('Current directory is not a Repoman project')
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
    const index = organizations.findIndex(org => Path.basename(org.path) === name)
    if (index === -1) {
      this.error(`Organization not found: ${name}`)
    }
    return organizations[index]
  }
  async getProjects(orgName?: string): Promise<Array<string>> {
    const projects = []
    let organizations = []
    // allow finding for specific organization
    if (orgName) {
      organizations = [await this.getOrganization(orgName)]
    } else {
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
  async getProjectDetails(path: string, npm: boolean = false): Promise<Project> {
    const name = path.split(Path.sep).slice(-2).join('/')
    const configFilePath = Path.join(path, CONFIG_FILE_NAME)
    let config: Object = {
      dependencies: [],
      configurations: [],
    }

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
      npm: npm ? await this.getPackageInfo(path) : null,
      repository: await this.getRepositoryDetails(path),
    })
  }
  async getRepositoryDetails(path: string): Promise<Repository> {
    try {
      return {
        path,
        ...await Helpers.gitStatus(path),
      }
    } catch (e) {
      return {
        path,
        clean: true,
        branchLocal: '',
        branchRemote: '',
        filesDirty: 0,
        filesUntracked: 0,
      }
    }
  }
  async getPackageInfo(path: string): Promise<?string> {
    const manifestPath = Path.join(path, 'package.json')
    if (!await FS.exists(manifestPath)) {
      return null
    }
    const manifest = (new ConfigFile(manifestPath)).get()
    if (typeof manifest.name !== 'string') {
      return null
    }
    try {
      const remoteManifest = await getPackageInfo(manifest.name)
      return remoteManifest || null
    } catch (_) {
      return null
    }
  }
  async spawn(name: string, parameters: Array<string>, options: Object, onStdout: ?((chunk: string) => any), onStderr: ?((chunk: string) => any)): Promise<number> {
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
    throw new RepoManError(value)
  }
}