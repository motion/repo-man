// @flow

import Command from '../command'
import type { Package, RepositoryState } from '../types'

export default class StatusCommand extends Command {
  name = 'status'
  description = 'Get status of your projects'
  // TODO: Add --packages options

  showNpm: boolean;
  async run(options: Object) {
    const table = new this.helpers.Table({ head: ['project', ['changes', 'center'], ['branch', 'center'], options.packages && 'npm', 'path'] })

    if (options.packages) {
      const packages = await this.getAllPackages()
      const packagesRemote = await Promise.all(packages.map(pkg => this.getNodePackageState(pkg)))
      const repositories = await Promise.all(packages.map(pkg => this.getRepositoryState(pkg.project)))

      for (let i = 0, length = packages.length; i < length; i++) {
        table.push(this.getRow(packages[i], packagesRemote[i], repositories[i]))
      }
    } else {
      const projects = await this.getProjects()
      const repositories = await Promise.all(projects.map(project => this.getRepositoryState(project)))

      for (let i = 0, length = projects.length; i < length; i++) {
        table.push(this.getRow(projects[i], null, repositories[i]))
      }
    }
    this.log(table.show())
  }

  getRow(packageLocal: { name: string, path: string }, packageRemote: ?Package, repository: RepositoryState) {
    const { Color, Figure, Symbol, tildify } = this.helpers
    const gray = Color.xterm(8)
    const none = gray(' - ')
    const path = gray(tildify(packageLocal.path))

    const version = packageRemote
      ? [packageRemote.manifest.version.toString() || none, 'center']
      : false

    const isDirty = repository.clean ? Symbol.check : Symbol.x
    const numChanged = repository.filesDirty + repository.filesUntracked
    return [
      `${isDirty} ${packageLocal.name}`,
      [numChanged || none, 'center'],
      `${Color.yellow(repository.branchLocal)} ${gray(Figure.arrowRight)} ${repository.branchRemote}`,
      version,
      tildify(path),
    ]
  }
}
