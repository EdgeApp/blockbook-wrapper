export const snooze: Function = async (ms: number) =>
  new Promise((resolve: Function) => setTimeout(resolve, ms))
