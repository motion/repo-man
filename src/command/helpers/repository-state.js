// @flow

import FS from 'sb-fs'
import Path from 'path'
import { exec } from 'sb-exec'
import type { RepositoryState, Project } from '../../types'

const REGEX_BRANCH_INFO = /^## (.*?)\.\.\.(.*)$/
const REGEX_FILE_MODIFIED = /^ *M .*/
const REGEX_FILE_UNTRACKED = /^ *\?\? .*/

export function parseGitStatus(project: Project, output: string): RepositoryState {
  let branchLocal = ''
  let branchRemote = ''

  let filesDirty = 0
  let filesUntracked = 0

  const lines = output.split('\n')
  for (const line of lines) {
    if (REGEX_BRANCH_INFO.test(line)) {
      const matches = REGEX_BRANCH_INFO.exec(line)
      branchLocal = matches[1]
      branchRemote = matches[2]
    } else if (REGEX_FILE_MODIFIED.test(line)) {
      filesDirty++
    } else if (REGEX_FILE_UNTRACKED.test(line)) {
      filesUntracked++
    }
  }

  return {
    clean: !(filesDirty || filesUntracked),
    project,
    branchLocal,
    branchRemote,
    filesDirty,
    filesUntracked,
  }
}

export default async function getRepositoryState(project: Project): Promise<RepositoryState> {
  const repoPath = Path.join(project.path, '.git')
  if (await FS.exists(repoPath)) {
    return parseGitStatus(project, await exec('git', ['status', '--porcelain', '-b'], { cwd: project.path }))
  }
  return {
    clean: true,
    project,
    branchLocal: '',
    branchRemote: '',
    filesDirty: 0,
    filesUntracked: 0,
  }
}
