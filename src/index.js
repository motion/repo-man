import command from 'sb-command'
import Path from 'path'
import RepoMan from './repoman'

const RepoManager = new RepoMan()

command
  .version('0.0.1')
  .description('Manage your repos')
  .command('init', 'Sets up your root ~/.repoman config file', RepoManager.init)
  .command('import <repo>', 'Import repo to repoman', RepoManager.import)
  .command('track [repos...]', 'Add repo to repoman', RepoManager.track)
  .command('untrack [repos...]', 'Remove repo from repoman', RepoManager.untrack)
  .command('status', 'Get status of repos', RepoManager.status)
  .command('release', 'Release new versions', RepoManager.release)
  .command('run <command>', 'Runs command for every repo, if exists in package.json', RepoManager.run)
  .default(RepoManager.status)
  .parse(process.argv)
