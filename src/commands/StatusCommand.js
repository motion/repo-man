// @flow

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

    // TODO: show a loader or something when this is happening
    const packagesRemote = await Promise.all(packages.map(pkg => this.getNodePackageState(pkg)))
    const repositories = await Promise.all(packages.map(pkg => this.getRepositoryState(pkg.project)))

    for (let i = 0, length = packages.length; i < length; i++) {
      table.push(this.getRow(packages[i].project, packages[i], packagesRemote[i], repositories[i]))
    }
    this.log(table.show())
  }
  async statusRepositories(options: Object) {
    const table = new this.helpers.Table({ head: ['project', 'changes', 'branch', 'path'] })
    let projects = await this.getProjects()
    if (options.scope) {
      projects = this.matchProjects(projects, this.helpers.split(options.scope, ','))
    }

    const repositories = await Promise.all(projects.map(project => this.getRepositoryState(project)))

    for (let i = 0, length = projects.length; i < length; i++) {
      table.push(this.getRow(projects[i], null, null, repositories[i]))
    }
    this.log(table.show())
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
