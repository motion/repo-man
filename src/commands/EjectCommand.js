// @flow

import FS from 'sb-fs'
import Path from 'path'
import ConfigFile from 'sb-config-file'
import copy from 'sb-copy'
import Command from '../command'
import * as Helpers from '../helpers'

export default class EjectCommand extends Command {
  name = 'eject [directories...]'
  description = 'Move files at path to to-org and track'

  async run({ config }, ...list: Array<string>) {
    const directories = list || ['.']
    await this.ensureProjectsRoot()
    for (const dir of directories) {
      await this.eject(config, dir)
    }
    this.log('👍, to delete:')
    this.log(`rm -r ${directories.join(' ')}`)
  }
  eject = async (config: string, directory: string) => {
    const { Color, tildify, prompt, Figure } = this.utils

    const sourceDir = Path.resolve(directory)
    const sourceDirList = sourceDir.split(Path.sep)
    const sourceName = sourceDirList[sourceDirList.length - 1]

    const orgs = await this.getOrganizations()

    // prompt for org to eject to
    const projectsPath = this.getProjectsRoot()
    const prefixPath = tildify(projectsPath)
    const orgOpts = orgs.map(({ name, path }) => ({
      name: `${new Array(prefixPath.length + 2).fill().join(' ')}${name}`,
      value: path,
    }))
    const answerOrg = await prompt(`${prefixPath}/_____/${sourceName}`, orgOpts)
    this.newline()
    let finalConfig = config
    if (!config) {
      this.log('Config source? (git url or github/repo)')
      finalConfig = await prompt.input(':')
    }

    const org = orgs[orgs.findIndex(x => x.path === answerOrg)]
    const targetDir = Path.join(org.path, sourceName)

    if (await FS.exists(targetDir)) {
      this.log(Color.brightBlack(`Skipping ${tildify(targetDir)}`))
      return
    }
    await copy(sourceDir, targetDir)
    // add config
    if (finalConfig) {
      const configFile = new ConfigFile(Path.join(targetDir, Helpers.CONFIG_FILE_NAME))
      configFile.set('configurations', [finalConfig])
    }
    this.log(`${Color.white(tildify(sourceDir))} ${Figure.rightArrow} ${Color.yellow.bold(tildify(targetDir))}`)
  }
}
