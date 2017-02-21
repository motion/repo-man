// @flow

import FS from 'sb-fs'
import Path from 'path'
import promisify from 'sb-promisify'
import ConfigFile from 'sb-config-file'
import expandTilde from 'expand-tilde'
import ChildProcess from 'child_process'

import Helpers, { CONFIG_FILE_NAME, RepoManError } from './helpers'
import type RepoMan from '../'
import type { Options, Project, ProjectState, RepositoryState, NodePackageState, Organization } from '../types'

const packageInfo = promisify(require('package-info'))

const INTERNAL_VAR = {}

export default class Command {
  name: string;
  state: ConfigFile;
  silent: boolean;
  config: ConfigFile;
  options: Options;
  helpers: typeof Helpers;
  repoMan: RepoMan;
  description: string;

  constructor(internalVar: Object, options: Options, repoMan: RepoMan, state: ConfigFile, config: ConfigFile) {
    if (internalVar !== INTERNAL_VAR) {
      throw new Error('Invalid usage of new Command() use Command.get() instead')
    }

    this.state = state
    this.config = config
    this.options = options
    this.repoMan = repoMan
    this.helpers = Helpers
  }
  // eslint-disable-next-line
  run(...params: Array<any>) {
    throw new Error('Command::run() is unimplemented')
  }
  getProjectsRoot(): string {
    return expandTilde(this.config.getSync('projectsRoot'))
  }
  getConfigsRoot(): string {
    return Path.join(this.getProjectsRoot(), '.config')
  }
  matchProjects(projects: Array<Project>, queries: Array<string>): Array<Project> {
    return projects.filter(project => queries.some(query => (query.indexOf('/') === -1 ? query === project.name : query === `${project.org}/${project.name}`)))
  }
  async getCurrentProject(): Promise<Project> {
    const currentDirectory = process.cwd()
    const projectsRoot = this.getProjectsRoot()
    const rootIndex = currentDirectory.indexOf(projectsRoot)
    if (rootIndex === 0) {
      const chunks = currentDirectory.slice(projectsRoot.length + 1).split(Path.sep).slice(0, 2)
      if (chunks.length === 2) {
        return {
          org: chunks[0],
          name: chunks[1],
          path: Path.join(projectsRoot, chunks[0], chunks[1]),
        }
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
      if (path.substr(0, 1) === '.') {
        // Ignore dot files
        return true
      }
      const stat = await FS.lstat(path)
      if (stat.isDirectory()) {
        organizations.push({ name: entry, path })
      }
      return true
    }))
    return organizations
  }
  async getOrganization(name: string): Promise<Organization> {
    const organizations = await this.getOrganizations()
    const index = organizations.findIndex(org => org.name === name)
    if (index !== -1) {
      return organizations[index]
    }
    throw new RepoManError(`Organization not found: ${name}`)
  }
  async getProjects(organization: ?string = null): Promise<Array<Project>> {
    const projects = []
    const organizations = organization ? [await this.getOrganization(organization)] : await this.getOrganizations()
    await Promise.all(organizations.map(async function({ path }) {
      const items = await FS.readdir(path)
      for (const item of items) {
        const itemPath = Path.join(path, item)
        const stat = await FS.lstat(itemPath)
        if (stat.isDirectory()) {
          projects.push({ org: Path.basename(path), name: item, path: itemPath })
        }
      }
      return true
    }))
    return projects
  }
  async getProjectState(project: Project): Promise<ProjectState> {
    const configFile = await ConfigFile.get(Path.join(project.path, CONFIG_FILE_NAME), {
      packages: ['./'],
      dependencies: [],
      configurations: [],
    }, {
      createIfNonExistent: false,
    })
    return Object.assign(await configFile.get(), {
      org: project.org,
      path: project.path,
      name: project.name,
    })
  }
  async getRepositoryState(project: Project): Promise<RepositoryState> {
    return Helpers.getRepositoryState(project)
  }
  async getNodePackageState(project: Project, remote: boolean = false): Promise<NodePackageState> {
    const contents = {
      name: '',
      version: '',
      description: '',
      project,
    }
    const manifestPath = Path.join(project.path, 'package.json')
    if (!await FS.exists(manifestPath)) {
      return contents
    }
    const manifest = await (await ConfigFile.get(manifestPath)).get()
    if (!remote || !manifest.name || !manifest.version || manifest.private) {
      Object.assign(contents, manifest, { project })
    } else {
      try {
        Object.assign(contents, await packageInfo(manifest.name), { project })
      } catch (_) { /* No Op */ }
    }
    return contents
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
  log(text: any = '') {
    if (this.silent) {
      return
    }
    if (text && text.name === 'RepoManError') {
      console.log('Error:', text.message)
    } else {
      console.log(text)
    }
  }
  static async get(options: Options, repoMan: RepoMan): Promise<this> {
    const state = await ConfigFile.get(Path.join(options.stateDirectory, 'state.json'), {
      plugins: [],
    }, {
      prettyPrint: true,
      createIfNonExistent: true,
    })
    const config = await ConfigFile.get(Path.join(options.stateDirectory, 'config.json'), {
      projectsRoot: '~/projects',
    }, {
      prettyPrint: true,
      createIfNonExistent: true,
    })
    return new this(INTERNAL_VAR, options, repoMan, state, config)
  }
}
