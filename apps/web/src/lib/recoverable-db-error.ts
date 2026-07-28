export function isRecoverableDiscoveryDbError(error: unknown) {
  return error instanceof Error && (
    error.name === 'PrismaClientInitializationError' ||
    error.message.includes('exceeded the data transfer quota')
  )
}
