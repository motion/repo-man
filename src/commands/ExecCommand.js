// @flow

import Command from '../command'

export default class ExecCommand extends Command {
  name = 'exec <command> [parameters...]'
  description = 'Run command in projects'

  async run(options: Object, command: string, parameters: Array<string>) {
    let packages = await this.getAllPackages()

    if (options.scope) {
      packages = this.matchPackages(packages, options.scope.split(',').filter(i => i))
    }
    if (options.ignore) {
      const ignored = this.matchPackages(packages, options.ignore.split(',').filter(i => i))
      packages = packages.filter(i => ignored.indexOf(i) === -1)
    }

    for (const pkg of packages) {
      await this.spawn(command, parameters, {
        cwd: pkg.path,
        stdio: ['inherit', 'inherit', 'inherit'],
      })
    }
  }
}
