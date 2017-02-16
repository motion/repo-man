// @flow

import Command from '../command'

export default class InitCommand extends Command {
  name = 'exec <command> [parameters...]'
  description = 'Run command in a set of repos'

  // TODO: Remove variadic on parameters when sb-command returns it as an array by default
  async run(_: Object, command: string, ...parameters: Array<string>) {
    const currentProjectPath = await this.getCurrentProjectPath()
    await this.spawn(command, parameters, {
      cwd: currentProjectPath,
      stdio: ['inherit', 'inherit', 'inherit'],
    })
  }
}
