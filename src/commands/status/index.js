// @flow

import FS from 'sb-fs'
import Path from 'path'
import * as Helpers from './helpers'
import { RepoManError } from '../../helpers'

export const name = 'status'
export const description = 'Get status of your projects'
export async function callback(_: Object, path: string) {
  const projects = await this.getProjects()
  console.log('projects', projects)
}
