// @flow

import Command from '../command'

export default class InitCommand extends Command {
  name = 'exec <command> [parameters...]'
  description = 'Run command in all repos'

  // TODO: Remove variadic on parameters when sb-command returns it as an array by default
  async run(_: Object, command: string, ...parameters: Array<string>) {
    const projects = await this.getProjects()
    for (const project of projects) {
      await this.spawn(command, parameters, {
        cwd: project,
        stdio: ['inherit', 'inherit', 'inherit'],
      })
    }
  }
}
