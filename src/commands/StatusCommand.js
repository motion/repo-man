// @flow

import Command from '../command'
import type { Package, RepositoryState } from '../types'

export default class StatusCommand extends Command {
  name = 'status'
  description = 'Get status of your projects'
  // TODO: Add --packages options

  showNpm: boolean;
  async run(options: Object) {
    this.showNpm = !!Object.keys(options).filter(x => x === 'npm').length

    const table = new this.helpers.Table({ head: ['project', ['changes', 'center'], ['branch', 'center'], this.showNpm && 'npm', 'path'] })

    const packages = await this.getAllPackages()
    const packagesRemote = await Promise.all(packages.map(pkg => this.getNodePackageState(pkg)))
    const repositories = await Promise.all(packages.map(pkg => this.getRepositoryState(pkg.project)))

    for (let i = 0, length = packages.length; i < length; i++) {
      table.push(this.getRow(packages[i], packagesRemote[i], repositories[i]))
    }
    this.log(table.show())
  }

  getRow(packageLocal: { name: string, path: string }, packageRemote: Package, repository: RepositoryState) {
    const { Color, Figure, Symbol, tildify } = this.helpers
    const gray = Color.xterm(8)
    const none = gray(' - ')
    const path = gray(tildify(packageLocal.path))

    const version = this.showNpm
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
