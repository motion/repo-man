// @flow

export type Options = {
  stateDirectory: string,
}

export type GitState = {
  clean: boolean,
  branchLocal: string,
  branchRemote: string,
  filesDirty: number,
  filesUntracked: number,
}

export type Repository = {
  path: string,
} & GitState

export type Project = {
  name: string,
  path: string,
  version: ?string,
  repository: Repository,
  dependencies: Array<string>,
  configurations: Array<string>,
}

export type Organization = {
  name: string,
  path: string,
}
