// @flow

import Path from 'path'
import ConfigFile from 'sb-config-file'
import FS from 'sb-fs'
import Command from '../command'
import { RepoManError, CONFIG_FILE_NAME } from '../helpers'

export default class InitCommand extends Command {
  name = 'init'
  description = 'Add a .repoman.json config file to import configurations from'

  async run() {
    if (await FS.exists(CONFIG_FILE_NAME)) {
      throw new RepoManError('.repoman.json already exists')
    }

    this.log('Config source? (any git repo, or Github shorthand)')
    const config = await this.helpers.prompt.input(':')

    const configFilePath = Path.join(process.cwd(), CONFIG_FILE_NAME)
    const configFile = await ConfigFile.get(configFilePath)
    await configFile.set('configurations', [config])

    this.log(`Created ${CONFIG_FILE_NAME}`)
  }
}
