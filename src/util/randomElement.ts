export const randomElement = <T>(a: T[]): T =>
  a[Math.floor(Math.min(a.length - 1, Math.random() * a.length))]
