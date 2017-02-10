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
    const orgOpts = orgs.map(({ name, path }) => ({ name: `${new Array(prefixPath.length + 2).fill().join(' ')}${name}`, value: path }))
    const answer = await prompt(`${prefixPath}/_____/${sourceName}`, orgOpts)

    this.newline()

    let finalConfig = config
    if (!config) {
      this.log('Config source? (any git repo, or Github shorthand)')
      finalConfig = await prompt.input(':')
    }

    const org = orgs[orgs.findIndex(x => x.path === answer)]
    const targetDir = Path.join(org.path, sourceName)
    const targetExists = await FS.exists(targetDir)

    if (!targetExists) {
      await copy(sourceDir, targetDir)
    } else {
      const val = await prompt.input('overwrite? y/n')
      if (val === 'y') {
        await FS.rename(sourceDir, targetDir)
      }
      else {
        this.log(Color.brightBlack(`Skipping ${tildify(targetDir)}`))
      }
    }

    // add config
    if (finalConfig) {
      const configFile = new ConfigFile(Path.join(targetDir, Helpers.CONFIG_FILE_NAME))
      configFile.set('configurations', [finalConfig])
    }

    this.log(`${Color.white(tildify(sourceDir))} ${Figure.rightArrow} ${Color.yellow.bold(tildify(targetDir))}`)
  }
}
