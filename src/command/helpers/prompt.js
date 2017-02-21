import readline from 'readline'
import inquirer from 'inquirer'

async function prompt(message, choices, options = {}) {
  const { list } = await inquirer.prompt({
    type: 'list',
    name: 'list',
    ...options,
    choices,
    message,
  })
  return list
}

prompt.input = function(message) {
  return new Promise(function(resolve) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    rl.question(`  ${message}`, function(answer) {
      rl.close()
      resolve(answer)
    })
  })
}

export default prompt
