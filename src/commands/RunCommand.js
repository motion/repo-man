// @flow

import Command from '../command'

export default class RunCommand extends Command {
  name = 'run <script> [parameters...]'
  description = 'Run the specified npm script in current project root (regardless of wherever you are in the project)'

  async run(options: Object, script: string, parameters: Array<string>) {
    const currentProject = await this.getCurrentProject()
    const npmParameters = ['run', script]
    if (parameters.length) {
      npmParameters.push('--', ...parameters)
    }
    await this.spawn('npm', npmParameters, {
      cwd: currentProject.path,
      stdio: 'inherit',
    }, currentProject)
  }
}
