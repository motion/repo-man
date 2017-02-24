// @flow

import Command from '../command'

export default class ExecCommand extends Command {
  name = 'exec <command> [parameters...]'
  description = 'Run command in projects'
  options = [
    ['--scope <pattern>', 'Limit to packages that match comma separated pattern (eg package-name or org/repo or org/repo/package-name or org/* or *)'],
    ['--ignore <pattern>', 'Ignore packages that match pattern (eg package-name or org/repo or org/repo/package-name or org/*)'],
    ['--parallel', 'Execute tasks in parallel', false],
  ]

  async run(options: Object, command: string, parameters: Array<string>) {
    let packages = await this.getAllPackages()

    if (options.scope) {
      packages = this.matchPackages(packages, this.helpers.split(options.scope, ','))
    }
    if (options.ignore) {
      const ignored = this.matchPackages(packages, this.helpers.split(options.ignore, ','))
      packages = packages.filter(i => ignored.indexOf(i) === -1)
    }

    if (options.parallel) {
      await Promise.all(packages.map(pkg => this.spawn(command, parameters, {
        cwd: pkg.path,
        stdio: ['inherit', 'inherit', 'inherit'],
      }, pkg.project)))
    } else {
      for (const pkg of packages) {
        await this.spawn(command, parameters, {
          cwd: pkg.path,
          stdio: ['inherit', 'inherit', 'inherit'],
        }, pkg.project)
      }
    }
  }
}
