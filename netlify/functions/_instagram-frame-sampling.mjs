// A START sample must reflect the actual first decoded frame (t=0), not a later
// 250ms frame. This only changes evidence sampling; approval remains downstream.
export function instagramFrameSamplePoints(duration) {
  const seconds=Number(duration);
  if(!Number.isFinite(seconds)||seconds<=0||seconds>60)
    throw new RangeError('INVALID_VIDEO_DURATION');
  return [
    ['start',0],
    ['middle',Math.max(0.05,seconds*0.5)],
    ['end',Math.max(0.05,seconds-0.25)]
  ];
}
