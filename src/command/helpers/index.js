// @flow

import tildify from 'tildify'
import Color from 'cli-color'
import Figure from './figures'
import Table from './table'
import Symbol from './symbols'
import prompt from './prompt'
import parallel from './parallel'
import getRepositoryState from './repository-state'
import { CONFIG_FILE_NAME, CONFIG_DEFAULT_VALUE, RepoManError } from '../../helpers'

function split(contents: string, delimiter: string): Array<string> {
  return contents.split(delimiter).map(i => i.trim()).filter(i => i)
}

module.exports = {
  split,
  Color,
  Figure,
  Table,
  Symbol,
  prompt,
  tildify,
  parallel,
  RepoManError,
  CONFIG_FILE_NAME,
  getRepositoryState,
  CONFIG_DEFAULT_VALUE,
}
