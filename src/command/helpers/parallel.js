// @flow

import Listr from 'listr'

export default function parallel(title: string, tasks: Array<{ title: string, callback: Function }>): Promise<void> {
  const listr = new Listr([{
    title,
    task() {
      return new Listr(tasks.map(function(task) {
        return {
          title: task.title,
          task: task.callback,
        }
      }), { concurrent: true })
    },
  }])
  return listr.run()
}
