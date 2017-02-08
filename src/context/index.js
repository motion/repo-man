// @flow

import Path from 'path'
import ConfigFile from 'sb-config-file'
import ChildProcess from 'child_process'

export default class Context {
  state: ConfigFile;
  config: ConfigFile;
  stateDirectory: string;
  constructor(stateDirectory: string) {
    this.stateDirectory = stateDirectory
    this.state = new ConfigFile(Path.join(stateDirectory, 'state.json'))
    this.config = new ConfigFile(Path.join(stateDirectory, 'config.json'))
  }
  getProjectRoot(): string {
    return this.config.get('projectRoot')
  }
  async spawn(name: string, parameters: Array<string>, options: Object, onStdout: ?((chunk: string) => any), onStderr: ?((chunk: string) => any)) {
    return new Promise((resolve, reject) => {
      const spawned = ChildProcess.spawn(name, parameters, options)
      if (onStdout) {
        spawned.stdout.on('data', onStdout)
      }
      if (onStderr) {
        spawned.stderr.on('data', onStderr)
      }
      spawned.on('close', resolve)
      spawned.on('error', reject)
    })
  }

  log(text: string) {
    console.log(text)
  }
}
