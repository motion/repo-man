// @flow

export type Options = {
  stateDirectory: string,
}

export type Command = {
  name: string,
  callback: (() => any),
  description: string,
}
