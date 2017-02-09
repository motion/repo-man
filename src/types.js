// @flow

export type Options = {
  stateDirectory: string,
}

export type Repository = {
  path: string,
  ahead: number,
  branch: string,
  stashes: number,
  files: Array<string>,
  filesDirty: boolean,
  filesUntracked: boolean,
  localBranch: string,
  remoteBranch: string,
  remoteDiff: string,
  isClean: boolean;
}

export type Package = {
  version: string,
}

export type Project = {
  name: string,
  path: string,
  repository: Repository,
  dependencies: Array<string>,
  configurations: Array<string>,
}
