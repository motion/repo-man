// @flow

import { RepoManError } from '../../helpers'

const REGEX_URI_SCHEME = /^([0-9a-z-_]+)\/([0-9a-z-_]+)(#[a-f0-9]+)?$/i
export function parseSourceURI(given: string): { username: string, repository: string, tag: ?string } {
  if (!REGEX_URI_SCHEME.test(given)) {
    throw new RepoManError(`Invalid source provided '${given}', supported syntax is username/repository#tag`)
  }
  let tag = null
  const matched = REGEX_URI_SCHEME.exec(given)
  const username = matched[1]
  const repository = matched[2]
  if (matched[3]) {
    // Remove the hash in front
    tag = matched[3].slice(1)
  }
  return { username, repository, tag }
}

export function getSuggestedDirectoryName(uri: string): string {
  let chunks
  chunks = uri.split(':')
  chunks = chunks[chunks.length - 1].split('/')
  return chunks.slice(-2).join('-')
}
