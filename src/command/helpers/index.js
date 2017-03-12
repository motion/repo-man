// @flow

import Path from 'path'
import Color from 'cli-color'
import isGlob from 'is-glob'
import tildify from 'tildify'
import Table from './table'
import Figure from './figures'
import Symbol from './symbols'
import prompt from './prompt'
import parallel from './parallel'
import getRepositoryState from './repository-state'
import { CONFIG_FILE_NAME, CONFIG_DEFAULT_VALUE, RepoManError } from '../../helpers'

function split(contents: string, delimiter: string): Array<string> {
  if (isGlob(contents)) {
    return [contents]
  }
  return contents.split(delimiter).map(i => i.trim()).filter(i => i)
}

const KEYS_TO_NORMALIZE = { PATH: Path.delimiter }
export function cloneEnv(givenEnv: Object): string {
  const env = Object.assign({}, givenEnv)
  for (const key in process.env) {
    const upperKey = key.toUpperCase()
    if (!KEYS_TO_NORMALIZE[upperKey]) continue
    if (!{}.hasOwnProperty.call(env, key)) continue

    if (!env[upperKey]) {
      env[upperKey] = ''
    }
    env[upperKey] = [env[upperKey], env[key]].join(KEYS_TO_NORMALIZE[upperKey])
    delete env[key]
  }
  return env
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
  cloneEnv,
  RepoManError,
  CONFIG_FILE_NAME,
  getRepositoryState,
  CONFIG_DEFAULT_VALUE,
}
