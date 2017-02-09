import { exec } from 'sb-exec'

const MATCH_INITIAL_COMMIT =/^\#\# Initial commit on ([^\n]+)\s?$/

type GitStatus = {
  localBranch: string,
  remoteBranch: string,
  remoteDiff: string,
  isClean: boolean,
  files: Array<string>,
}

export function getGitState(str: string): GitStatus {
  const status = {
    localBranch: null,
    remoteBranch: null,
    remoteDiff: null,
    isClean: true,
    files: [],
  }
  const lines = str.trim().split('\n')
  let branchLine = lines.shift()

  let result = branchLine.match(MATCH_INITIAL_COMMIT)
  if (result) {
    status.localBranch = result[1]
    return status
  }
  branchLine = branchLine.replace(/\#\#\s+/, '')
  const branches = branchLine.split('...')
  status.localBranch = branches[0]
  status.remoteDiff = null
  if (branches[1]){
    result = branches[1].match(/^([^\s]+)/)
    status.remoteBranch = result[1]
    result = branches[1].match(/\[([^\]]+)\]/)
    status.remoteDiff = result ? result[1] : null
  }
  lines.forEach(function(file: string) {
    if (file.match(/\S/)) {
      status.files.push(file)
    }
  })
  status.isClean = status.files.length === 0
  return status
}

export default async function gitState(cwd) {
  const stdout = await exec('git', ['status', '--porcelain', '-b'], { cwd })
  return getGitState(stdout)
}
