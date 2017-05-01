// Return an integer indicating how close one BPM is to another. Takes into account
// that a "slow" BPM may be close if it is near the half-BPM rate.
export function calcBpmCloseness(targetBpm, bpm) {
  const howCloseBpm = Math.round(Math.abs(targetBpm - bpm));
  const howCloseDoubledBpm = Math.round(Math.abs(targetBpm - (bpm * 2)));
  return (howCloseDoubledBpm < howCloseBpm) ? howCloseDoubledBpm : howCloseBpm;
}
