// @flow

import Command from '../command'
import type { Package, RepositoryState } from '../types'

export default class StatusCommand extends Command {
  name = 'status'
  description = 'Get status of your projects'

  showNpm: boolean;
  async run(options: Object) {
    this.showNpm = !!Object.keys(options).filter(x => x === 'npm').length

    const packages = await this.getAllPackages()
    const packagesRemote = await Promise.all(packages.map(pkg => this.getNodePackageState(pkg)))
    const repositories = await Promise.all(packages.map(pkg => this.getRepositoryState(pkg.project)))

    const titles = ['project', 'changes', 'branch', 'npm', 'path']
      .map(c => this.helpers.Color.xterm(247)(c))
    const head = [
      `  ${titles[0]}`,
      this.crow(titles[1]),
      this.crow(titles[2]),
      this.showNpm && this.crow(titles[3]),
      titles[4],
    ]
      .filter(x => !!x)

    const { min, round } = Math
    const columns = process.stdout.columns
    const getWidth = () => min(30, round((columns / head.length) * 0.9))
    const colWidths = head.map(getWidth)
    const table = new this.helpers.Table({ head, colWidths })

    for (let i = 0, length = packages.length; i < length; i++) {
      table.push(this.getRow(packages[i], packagesRemote[i], repositories[i]))
    }
    this.log(table.show())
  }

  row = (content, props) => ({ content, ...props })
  crow = content => this.row(content, { hAlign: 'center' })

  getRow(packageLocal: Package, packageRemote: Package, repository: RepositoryState) {
    const { Color, Figure, Symbol, tildify } = this.helpers
    const gray = Color.xterm(8)
    const isGit = typeof repository.clean !== 'undefined'
    const none = gray(' - ')
    const path = gray(tildify(packageLocal.path))

    let response
    const version = this.showNpm
      ? this.crow(packageRemote.manifest.version || none)
      : false

    if (isGit) {
      const isDirty = repository.clean ? Symbol.check : Symbol.x
      const numChanged = repository.filesDirty + repository.filesUntracked
      response = [
        `${isDirty} ${packageLocal.name}`,
        this.crow(numChanged || none),
        `${Color.yellow(repository.branchLocal)} ${gray(Figure.arrowRight)} ${repository.branchRemote}`,
        version,
        tildify(path),
      ]
    } else {
      response = [
        `  ${packageLocal.name}`,
        this.crow(none),
        this.crow(none),
        version,
        tildify(path),
      ]
    }
    return response.filter(x => !!x)
  }
}
