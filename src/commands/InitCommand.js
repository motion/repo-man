// @flow

import FS from 'sb-fs'
import Path from 'path'
import ConfigFile from 'sb-config-file'
import Command from '../command'
import { RepoManError, CONFIG_FILE_NAME } from '../helpers'

export default class InitCommand extends Command {
  name = 'init'
  description = 'Add a .repoman.json config file to import configurations from'

  async run() {
    const project = await this.getCurrentProject()
    const configPath = Path.join(project.path, CONFIG_FILE_NAME)
    if (await FS.exists(configPath)) {
      throw new RepoManError('.repoman.json already exists')
    }

    this.log('Config source? (Github shorthand, comma separated eg: myorg/myrepo)')
    const config = await this.helpers.prompt.input(':')

    const configFile = await ConfigFile.get(configPath)
    await configFile.set('configurations', config.split(',').map(i => i.trim()).filter(i => i))

    this.log(`Created configuration for ${this.helpers.tildify(project.path)}`)
  }
}
