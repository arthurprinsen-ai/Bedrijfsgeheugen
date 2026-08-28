const TARGET = Object.freeze({
  width: 1920,
  height: 1080,
  fps: 30,
  codec: 'h264',
  pixel_format: 'yuv420p',
  has_audio: false,
  faststart: true
});

const normalized = value => String(value || '').toLowerCase();

export function validateHeroMediaProbe(probe = {}) {
  const failures = [];

  if (Number(probe.width) !== TARGET.width) failures.push('width');
  if (Number(probe.height) !== TARGET.height) failures.push('height');
  if (Number(probe.fps) !== TARGET.fps) failures.push('fps');
  if (normalized(probe.codec) !== TARGET.codec) failures.push('codec');
  if (normalized(probe.pixel_format) !== TARGET.pixel_format) failures.push('pixel_format');
  if (probe.has_audio !== TARGET.has_audio) failures.push('has_audio');
  if (probe.faststart !== TARGET.faststart) failures.push('faststart');

  return { valid: failures.length === 0, failures };
}

export function buildHeroMediaPlan({ input, output, source } = {}) {
  if (!input) throw new Error('input is required');
  if (!source) throw new Error('source probe is required');

  const sourceValidation = validateHeroMediaProbe(source);
  if (sourceValidation.valid) {
    return {
      action: 'USE_SOURCE',
      input,
      output: input,
      target: { ...TARGET },
      args: []
    };
  }

  if (!output) throw new Error('output is required for transcoding');

  return {
    action: 'TRANSCODE',
    input,
    output,
    target: { ...TARGET },
    args: [
      '-y',
      '-i', input,
      '-vf', 'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-an',
      '-movflags', '+faststart',
      '-vsync', 'cfr',
      output
    ]
  };
}
