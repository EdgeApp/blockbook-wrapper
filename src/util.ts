export function makeDate(): string {
  const end = new Date()
  let m = (end.getUTCMonth() + 1).toString()
  if (m.length < 2) m = `0${m}`
  let d = end.getUTCDate().toString()
  if (d.length < 2) d = `0${d}`
  let h = end.getHours().toString()
  if (h.length < 2) h = `0${h}`
  let min = end.getMinutes().toString()
  if (min.length < 2) min = `0${d}`
  let s = end.getSeconds().toString()
  if (s.length < 2) s = `0${d}`
  let ms = end.getMilliseconds().toString()
  if (ms.length === 2) ms = `0${d}`
  if (ms.length < 2) ms = `00${d}`
  return `${m}-${d}-${h}:${min}:${s}.${ms}`
}

export function logger(...args: any): void {
  const d = makeDate()
  console.log(`${d} `, ...args)
}

export function cleanObject(object: Object): void {
  for (const key in object) {
    if (object[key] == null) {
      delete object[key]
    }
  }
}
