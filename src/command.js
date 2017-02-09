// @flow

import FS from 'sb-fs'
import Path from 'path'
import gitState2 from 'git-state'
import promisify from 'sb-promisify'
import ConfigFile from 'sb-config-file'
import ChildProcess from 'child_process'
import PackageInfo from 'package-info'
import gitState from './helpers/gitState'
import * as Utils from './context-utils'

const getPackageInfo = promisify(PackageInfo)
const getGitState = promisify(gitState2.check)

import * as Helpers from './helpers'
import type { Options, Project, Repository, Package, Organization } from './types'

export default class Command {
  state: ConfigFile;
  config: ConfigFile;
  options: Options;
  utils: Utils;
  fs: FS;
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
      repository: await this.getRepositoryDetails(path),
      package: await this.getPackageDetails(path),
    })
  }
  async getRepositoryDetails(path: string): Promise<Repository> {
    const [state, state2] = await Promise.all([
      gitState(path),
      getGitState(path),
    ])
    return {
      path,
      localBranch: state.localBranch,
      remoteBranch: state.remoteBranch,
      remoteDiff: state.remoteDiff,
      isClean: state.isClean,
      files: state.files,
      filesDirty: state2.dirty,
      filesUntracked: state2.untracked,
      ahead: state2.ahead,
    }
  }
  async getPackageDetails(path: string): Promise<Package> {
    try {
      const info = await getPackageInfo(path)
      return {
        version: info.version,
      }
    } catch (e) {
      // no npm package
    }
    return {
      version: null,
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

  log(text: string) {
    console.log(text)
  }
  newline() {
    console.log('')
  }
  error(value: string) {
    throw new Helpers.RepoManError(value)
  }
}
