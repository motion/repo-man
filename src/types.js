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
