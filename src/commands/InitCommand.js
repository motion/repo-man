// @flow

import Path from 'path'
import ConfigFile from 'sb-config-file'
import FS from 'sb-fs'
import Command from '../command'
import * as Helpers from '../helpers'

export default class InitCommand extends Command {
  name = 'init'
  description = 'Add a .repoman.json config file to import configurations from'

  async run() {
    if (await FS.exists(Helpers.CONFIG_FILE_NAME)) {
      this.error('.repoman.json already exists')
    }

    this.log('Config source? (any git repo, or Github shorthand)')
    const config = await this.helpers.prompt.input(':')

    const configFilePath = Path.join(process.cwd(), Helpers.CONFIG_FILE_NAME)
    const configFile = new ConfigFile(configFilePath)
    configFile.set('configurations', [config])

    this.log(`Created ${Helpers.CONFIG_FILE_NAME}`)
  }
}
