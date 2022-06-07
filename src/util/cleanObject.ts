export function cleanObject(object: Object): void {
  for (const key in object) {
    if (object[key] == null) {
      delete object[key]
    }
  }
}
