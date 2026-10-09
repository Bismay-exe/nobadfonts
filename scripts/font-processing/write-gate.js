export function assertProductionWriteEnabled({ argv = process.argv, env = process.env } = {}) {
  if (!Array.isArray(argv) || !argv.includes('--apply')) {
    throw new Error('Production font processing is disabled by default. Pass --apply only after the isolated publishing gate has passed.');
  }
  if (env.FONT_PROCESSING_ALLOW_WRITES !== 'true') {
    throw new Error('Production font processing requires FONT_PROCESSING_ALLOW_WRITES=true as a second explicit write gate.');
  }
}
