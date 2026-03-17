export async function scanFolder(dirHandle) {
  const names = []
  for await (const [name] of dirHandle.entries()) {
    names.push(name)
  }
  return names
}

export async function saveRecording(dirHandle, filename, blob) {
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(blob)
  await writable.close()
}
