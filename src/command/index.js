// @flow

import FS from 'sb-fs'
import Path from 'path'
import promisify from 'sb-promisify'
import multimatch from 'multimatch'
import ConfigFile from 'sb-config-file'
import expandTilde from 'expand-tilde'
import ChildProcess from 'child_process'

import Helpers, { CONFIG_FILE_NAME, CONFIG_DEFAULT_VALUE, RepoManError } from './helpers'
import type RepoMan from '../'
import type { Options, Project, Package, RepositoryState, Organization } from '../types'

const glob = promisify(require('glob'))
const packageInfo = promisify(require('package-info'))

const INTERNAL_VAR = {}

export default class Command {
  name: string;
  state: ConfigFile;
  config: ConfigFile;
  options: Array<[string, string] | [string, string, any]>;
  helpers: typeof Helpers;
  repoMan: RepoMan;
  description: string;

  constructor(internalVar: Object, repoMan: RepoMan, state: ConfigFile, config: ConfigFile) {
    if (internalVar !== INTERNAL_VAR) {
      throw new Error('Invalid usage of new Command() use Command.get() instead')
    }

    this.state = state
    this.config = config
    this.repoMan = repoMan
    this.helpers = Helpers
    this.options = []
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
  async getCurrentProject(): Promise<Project> {
    const currentDirectory = process.cwd()
    const projectsRoot = this.getProjectsRoot()
    const rootIndex = currentDirectory.indexOf(projectsRoot)
    if (rootIndex === 0) {
      const chunks = currentDirectory.slice(projectsRoot.length + 1).split(Path.sep).slice(0, 2)
      if (chunks.length === 2) {
        const itemPath = Path.join(projectsRoot, chunks[0], chunks[1])
        const configFile = await ConfigFile.get(Path.join(itemPath, CONFIG_FILE_NAME), CONFIG_DEFAULT_VALUE, {
          createIfNonExistent: false,
        })
        return Object.assign(await configFile.get(), {
          org: chunks[0],
          path: itemPath,
          name: chunks[1],
        })
      }
    }
    throw new RepoManError('Current directory is not a Repoman project (maybe use --scope if command supports it?)')
  }
  async getOrganizations(): Promise<Array<Organization>> {
    const organizations = []
    const projectsRoot = this.getProjectsRoot()
    const entries = await FS.readdir(projectsRoot)
    await Promise.all(entries.map(async function(entry) {
      const path = Path.join(projectsRoot, entry)
      if (entry.substr(0, 1) === '.') {
        // Ignore dot dirs (for ex .config is configs root)
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
        if (item.substr(0, 1) === '.') {
          // Ignore dot dirs, some IDEs create dot dirs in roots
          continue
        }

        const itemPath = Path.join(path, item)
        const stat = await FS.lstat(itemPath)
        if (stat.isDirectory()) {
          const configFile = await ConfigFile.get(Path.join(itemPath, CONFIG_FILE_NAME), CONFIG_DEFAULT_VALUE, {
            createIfNonExistent: false,
          })
          projects.push(Object.assign(await configFile.get(), {
            org: Path.basename(path),
            path: itemPath,
            name: item,
          }))
        }
      }
      return null
    }))
    return projects
  }
  async getProjectPackages(project: Project): Promise<Array<Package>> {
    const packages = []
    await Promise.all(project.packages.map(async function(packagePath) {
      const entries = await glob(packagePath, {
        cwd: project.path,
        follow: false,
      })
      for (const entry of entries) {
        const pkg = {
          name: '',
          path: Path.resolve(project.path, entry),
          project,
          manifest: {},
        }
        const manifestPath = Path.join(pkg.path, 'package.json')
        if (await FS.exists(manifestPath)) {
          Object.assign(pkg.manifest, await (await ConfigFile.get(manifestPath)).get())
        }
        pkg.name = pkg.manifest.name ? pkg.manifest.name : Path.basename(pkg.path)
        packages.push(pkg)
      }
      return null
    }))
    return packages
  }
  async getAllPackages(): Promise<Array<Package>> {
    let packages = []
    const projects = await this.getProjects()
    await Promise.all(projects.map(project => this.getProjectPackages(project).then((projectPackages) => {
      packages = packages.concat(projectPackages)
    })))
    return packages
  }
  matchProjects(projects: Array<Project>, queries: Array<string>): Array<Project> {
    return projects.filter(project => multimatch([project.name, `${project.org}/${project.name}`], queries).length)
  }
  matchPackages(packages: Array<Package>, queries: Array<string>): Array<Package> {
    return packages.filter(pkg => multimatch([pkg.path === pkg.project.path ? pkg.project.path : pkg.name, `${pkg.project.org}/${pkg.project.name}`, `${pkg.project.org}/${pkg.project.name}/${pkg.manifest.name}`], queries).length)
  }
  async getRepositoryState(project: Project): Promise<RepositoryState> {
    return Helpers.getRepositoryState(project)
  }
  async getNodePackageState(pkg: Package): Promise<Package> {
    if (!pkg.manifest.name || !pkg.manifest.version || pkg.manifest.private) {
      return pkg
    }
    const cloned = Object.assign({}, pkg)
    try {
      Object.assign(cloned.manifest, await packageInfo(pkg.manifest.name))
    } catch (_) {
      console.log('error doing', cloned.name)
      /* No Op */
    }
    return cloned
  }
  async spawn(name: string, parameters: Array<string>, givenOptions: Object, project: ?Project, onStdout: ?((chunk: string) => any), onStderr: ?((chunk: string) => any)): Promise<number> {
    const options = Object.assign({}, givenOptions, { env: Object.assign({}, givenOptions.env || process.env) })
    if (options.cwd) {
      options.env = Object.assign(options.env, {
        PATH: [options.env.PATH, Path.join(options.cwd, 'node_modules', '.bin')].join(Path.delimiter),
      })
    }
    if (project && project.path !== options.cwd) {
      options.env = Object.assign(options.env, {
        PATH: [options.env.PATH, Path.join(project.path, 'node_modules', '.bin')].join(Path.delimiter),
      })
    }
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
    }).catch(function(error) {
      if (error && typeof error === 'object' && options.cwd) {
        error.directory = options.cwd
      }
      throw error
    })
  }
  log(text: any = '') {
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
    return new this(INTERNAL_VAR, repoMan, state, config)
  }
}
