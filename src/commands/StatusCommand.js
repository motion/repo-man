// @flow

import invariant from 'assert'
import { uniqBy } from 'lodash'
import Command from '../command'
import type { Project, Package, RepositoryState } from '../types'

export default class StatusCommand extends Command {
  name = 'status'
  description = 'Get status of your projects'
  options = [
    ['--packages', 'Show status of packages instead of repositories'],
    ['--scope <pattern>', 'Limit to results to packages or repositories that match the given pattern'],
  ]

  async run(options: Object) {
    if (options.packages) {
      await this.statusPackages(options)
    } else {
      await this.statusRepositories(options)
    }
  }
  async statusPackages(options: Object) {
    const table = new this.helpers.Table({ head: ['project', 'changes', 'branch', 'path', 'npm'] })
    let packages = await this.getAllPackages()
    if (options.scope) {
      packages = this.matchPackages(packages, this.helpers.split(options.scope, ','))
    }

    const repositories = await this.processRepositories(uniqBy(packages.map(p => p.project), project => project.path))
    const packagesRemote: Map<Package, Package> = new Map()

    await this.helpers.parallel('Getting remote details', packages.map(pkg => ({
      title: pkg.path === pkg.project.path ? `${pkg.project.org}/${pkg.project.name}` : `${pkg.project.org}/${pkg.project.name}/${pkg.name}`,
      // eslint-disable-next-line arrow-parens
      callback: async () => {
        packagesRemote.set(pkg, await this.getNodePackageState(pkg))
      },
    })))

    for (let i = 0, length = packages.length; i < length; i++) {
      const pkg = packages[i]
      const repository = repositories.get(pkg.project)
      const packageRemote = packagesRemote.get(pkg)
      invariant(repository && packageRemote)
      table.push(this.getRow(pkg.project, pkg, packageRemote, repository))
    }
    this.log(table.show())
  }
  async statusRepositories(options: Object) {
    const table = new this.helpers.Table({ head: ['project', 'changes', 'branch', 'path'] })
    let projects = await this.getProjects()
    if (options.scope) {
      projects = this.matchProjects(projects, this.helpers.split(options.scope, ','))
    }

    const repositories = await this.processRepositories(projects)

    for (let i = 0, length = projects.length; i < length; i++) {
      const repository = repositories.get(projects[i])
      invariant(repository)
      table.push(this.getRow(projects[i], null, null, repository))
    }
    this.log(table.show())
  }
  async processRepositories(projects: Array<Project>): Promise<Map<Project, RepositoryState>> {
    const repositories = new Map()
    // eslint-disable-next-line arrow-parens
    await Promise.all(projects.map(async (project) => {
      repositories.set(project, await this.getRepositoryState(project))
      return null
    }))
    await this.helpers.parallel('Refreshing repositories', projects.map(project => ({
      title: `${project.org}/${project.name}`,
      // eslint-disable-next-line arrow-parens
      callback: async () => {
        const repository = repositories.get(project)
        invariant(repository)
        await this.spawn('git', ['fetch', '--all'], { cwd: project.path, stdio: 'ignore' })
      },
    })))
    // NOTE: We are re-reading them to pick up the changes
    // eslint-disable-next-line arrow-parens
    await Promise.all(projects.map(async (project) => {
      repositories.set(project, await this.getRepositoryState(project))
      return null
    }))
    return repositories
  }
  getRow(project: Project, packageLocal: ?Package, packageRemote: ?Package, repository: RepositoryState) {
    const { tildify, Color, Figure, Symbol } = this.helpers
    const gray = Color.xterm(8)
    const none = gray(' - ')

    const version = packageRemote
      ? packageRemote.manifest.version.toString() || none
      : ''

    const isDirty = repository.clean ? Symbol.check : Symbol.x
    const numChanged = repository.filesDirty + repository.filesUntracked

    let name
    if (packageLocal && packageLocal.path !== project.path) {
      name = `${project.org} / ${project.name} / ${packageLocal.name}`
    } else {
      name = `${project.org} / ${project.name}`
    }

    return [
      `${isDirty} ${name}`,
      numChanged.toString() || none,
      `${Color.yellow(repository.branchLocal)} ${gray(Figure.arrowRight)} ${repository.branchRemote}`,
      gray(tildify(packageLocal ? packageLocal.path : project.path)),
      version,
    ]
  }
}
