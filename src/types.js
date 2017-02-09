// @flow

export type Options = {
  stateDirectory: string,
}

export type Command = {
  name: string,
  callback: Function,
  description: string,
}

export type Repository = {
  path: string,
  ahead: number,
  branch: string,
  stashes: number,
  filesDirty: boolean,
  filesUntracked: boolean,
}

export type Project = {
  name: string,
  path: string,
  repository: Repository,
  dependencies: Array<string>,
  configurations: Array<string>,
}
