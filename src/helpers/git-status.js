// @flow

import { exec } from 'sb-exec'
import type { GitState } from '../types'

const REGEX_BRANCH_INFO = /^## (.*?)\.\.\.(.*)$/
const REGEX_FILE_MODIFIED = /^ *M .*/
const REGEX_FILE_UNTRACKED = /^ *\?\? .*/

export function parseGitStatus(output: string): GitState {
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
    branchLocal,
    branchRemote,
    filesDirty,
    filesUntracked,
  }
}

export default function gitStatus(cwd: string) {
  return exec('git', ['status', '--porcelain', '-b'], { cwd }).then(parseGitStatus)
}
