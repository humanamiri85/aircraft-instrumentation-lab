import {aviationRotation} from '../../aircraft/orientation.js';

// An ideal vertical gyro reference differs from the Phase 3D north axis.
// Inverse YXZ body rotation of world up. Yaw about up cancels, so heading
// cannot produce a false pitch/bank indication. No erection dynamics modeled.
export function verticalReference(state) {
  const {x,z}=aviationRotation({...state,heading:0});
  const worldUp=[0,1,0];
  const bodyUp=[Math.sin(z)*Math.cos(x),Math.cos(z)*Math.cos(x),-Math.sin(x)];
  return {worldUp,bodyUp,pitchBearing:x,bankBearing:z};
}
