// @flow

import FS from 'sb-fs'
import Path from 'path'
import Command from '../command'
import { parseSourceURI } from '../helpers'

export default class UpdateConfigsCommand extends Command {
  name = 'get-config <remote_path>'
  description = 'Clone the given path into configs root'

  async run() {
    const projectsRoot = this.getConfigsRoot()
    const allConfigs = await FS.readdir(projectsRoot)

    console.log(allConfigs)
  }
}
