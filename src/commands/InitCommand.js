// @flow

import FS from 'sb-fs'
import Path from 'path'
import ConfigFile from 'sb-config-file'
import Command from '../command'
import { RepoManError, CONFIG_FILE_NAME, CONFIG_DEFAULT_VALUE } from '../helpers'

export default class InitCommand extends Command {
  // TODO: -f to force even if config already exists
  name = 'init'
  description = 'Add a .repoman.json config file to import configurations from'

  async run() {
    const project = await this.getCurrentProject()
    const configPath = Path.join(project.path, CONFIG_FILE_NAME)
    if (await FS.exists(configPath)) {
      throw new RepoManError('.repoman.json already exists')
    }

    const packagePaths = await this.helpers.prompt.input('Location of packages (packages/*/ for monorepo or ./ for non-monorepo):')
    const dependencies = await this.helpers.prompt.input('Project dependencies (Github shorthand, comma separated eg: myorg/myrepo):')
    const configurations = await this.helpers.prompt.input('Project configurations (Github shorthand, comma separated eg: myorg/myrepo):')

    const configFile = await ConfigFile.get(configPath, CONFIG_DEFAULT_VALUE)
    await configFile.set('packages', this.helpers.split(packagePaths || './', ','))
    await configFile.set('dependencies', this.helpers.split(dependencies, ','))
    await configFile.set('configurations', this.helpers.split(configurations, ','))

    this.log(`Created configuration for ${this.helpers.tildify(project.path)}`)
  }
}
