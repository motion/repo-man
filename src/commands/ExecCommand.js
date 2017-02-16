// @flow

import Command from '../command'

export default class InitCommand extends Command {
  name = 'exec'
  description = 'Run command in a set of repos'

  async run(_: Object, a, b, c) {
    console.log(a, b, c)
  }
}
