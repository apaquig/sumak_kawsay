/**
 * Anatomical Neck & Head Tracking Engine
 * Fuses FaceLandmarks (Chin 152, Jawline 172/397, Earlobes 132/361)
 * to compute 3D neck anchors, shoulder width, scale, and head orientation.
 */

export interface AnatomicalFrame {
  neckAnchor: { x: number; y: number };
  leftEar: { x: number; y: number };
  rightEar: { x: number; y: number };
  scalePercent: number;
  rotationDeg: number;
  pitch3DDeg: number;
  yawDeg: number;
  confidence: number;
  guidanceMessage: string;
}

export function computeAnatomicalNeckPose(
  landmarks: Array<{ x: number; y: number; z?: number }>,
  mirrored: boolean = true
): AnatomicalFrame {
  if (!landmarks || landmarks.length < 400) {
    return {
      neckAnchor: { x: 50, y: 74 },
      leftEar: { x: 30, y: 55 },
      rightEar: { x: 70, y: 55 },
      scalePercent: 85,
      rotationDeg: 0,
      pitch3DDeg: 22,
      yawDeg: 0,
      confidence: 0,
      guidanceMessage: 'Centra tu rostro frente a la cámara',
    };
  }

  // Key Anatomical Landmarks:
  // 152: Bottom of Chin
  // 1: Tip of Nose
  // 132: Left Earlobe
  // 361: Right Earlobe
  // 10: Forehead Top Center

  const chin = landmarks[152];
  const nose = landmarks[1];
  const forehead = landmarks[10];
  const leftEar = landmarks[132] || landmarks[234];
  const rightEar = landmarks[361] || landmarks[454];

  // A live camera feed is displayed mirrored (CSS scale-x: -1), so raw landmark X must be
  // flipped to match what's on screen. A static uploaded photo is displayed unmirrored, so
  // raw X maps directly.
  const flipX = (v: number) => (mirrored ? 1 - v : v);

  // 1. Calculate Face Dimensions & Distance Metrics
  const faceWidthNorm = Math.hypot(rightEar.x - leftEar.x, rightEar.y - leftEar.y);
  const faceHeightNorm = Math.hypot(chin.x - forehead.x, chin.y - forehead.y);

  // Guidance checks
  let guidanceMessage = 'Colocación anatómica activa';
  if (faceWidthNorm < 0.15) {
    guidanceMessage = 'Acércate un poco a la cámara';
  } else if (faceWidthNorm > 0.75) {
    guidanceMessage = 'Aléjate un poco para encuadrar tu cuello';
  }

  // 2. Compute Neck Anchor Center (Below Chin, aligned with Jawline & Neck axis)
  const rawNeckX = Math.min(90, Math.max(10, flipX(chin.x) * 100));

  // Neck vertical offset: Chin bottom + proportion of face height
  const neckYOffset = faceHeightNorm * 0.1;
  const rawNeckY = Math.min(86, Math.max(30, (chin.y + neckYOffset) * 100));

  // 3. Compute Ear Anchor Positions for Earrings. Positions are nudged outward from
  // center (not by landmark identity) so left/right assignment stays correct under
  // both mirrored (video) and unmirrored (photo) display.
  const nudgeOutward = (xPercent: number) => xPercent + (xPercent < 50 ? -3.5 : 3.5);

  const earA = { x: nudgeOutward(flipX(leftEar.x) * 100), y: (leftEar.y + faceHeightNorm * 0.08) * 100 };
  const earB = { x: nudgeOutward(flipX(rightEar.x) * 100), y: (rightEar.y + faceHeightNorm * 0.08) * 100 };
  const [screenLeftEar, screenRightEar] = earA.x <= earB.x ? [earA, earB] : [earB, earA];

  const leftEarX = Math.max(8, Math.min(48, screenLeftEar.x));
  const leftEarY = screenLeftEar.y;

  const rightEarX = Math.max(52, Math.min(92, screenRightEar.x));
  const rightEarY = screenRightEar.y;

  // 4. Compute 3D Head Orientation (Roll, Pitch, Yaw). Roll is clamped for the same reason
  // as the shoulder-line rotation below: atan2 has no notion of "a reasonable tilt", so a
  // momentary earlobe mislabel or an extreme head angle can otherwise spin the necklace
  // toward upside-down instead of just tilting it.
  const dx = (mirrored ? -1 : 1) * (rightEar.x - leftEar.x);
  const dy = rightEar.y - leftEar.y;
  const rawRollDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const rollDeg = Math.round(Math.min(20, Math.max(-20, rawRollDeg)));

  const noseToChin = chin.y - nose.y;
  const foreheadToNose = nose.y - forehead.y;
  const pitchRatio = noseToChin / (foreheadToNose || 1);
  const pitch3DDeg = Math.min(50, Math.max(5, Math.round(22 + (1.2 - pitchRatio) * 25)));

  const leftDist = Math.abs(nose.x - leftEar.x);
  const rightDist = Math.abs(rightEar.x - nose.x);
  const yawRatio = (rightDist - leftDist) / (faceWidthNorm || 1);
  const yawDeg = Math.round(yawRatio * 45);

  // 5. Dynamic Anatomical Neck Scale
  const baseScale = faceWidthNorm * 185;
  const scalePercent = Math.min(185, Math.max(35, Math.round(baseScale)));

  return {
    neckAnchor: { x: Math.round(rawNeckX), y: Math.round(rawNeckY) },
    leftEar: { x: Math.round(leftEarX), y: Math.round(leftEarY) },
    rightEar: { x: Math.round(rightEarX), y: Math.round(rightEarY) },
    scalePercent,
    rotationDeg: rollDeg,
    pitch3DDeg,
    yawDeg,
    confidence: Math.round(faceWidthNorm * 100),
    guidanceMessage,
  };
}

export interface ShoulderNeckFrame {
  neckAnchor: { x: number; y: number };
  scalePercent: number;
  rotationDeg: number;
  pitch3DDeg: number;
  confidence: number;
  guidanceMessage: string;
}

/**
 * Anchors a necklace to real shoulder landmarks (MediaPipe PoseLandmarker, indices 11/12)
 * instead of estimating neck width/position from face width — face-only estimation has no
 * way to know actual shoulder span or where the collarbone sits, so it's a rough guess at
 * best. This is the difference between "plausible" and "actually anatomically anchored".
 * Falls back to null (caller should use computeAnatomicalNeckPose) when shoulders aren't
 * clearly visible (e.g. very tight face-only framing, or a low-confidence pose read).
 */
export function computeShoulderAnchoredNeckPose(
  poseLandmarks: Array<{ x: number; y: number; z?: number; visibility?: number }>,
  faceLandmarks: Array<{ x: number; y: number; z?: number }> | null,
  mirrored: boolean = true
): ShoulderNeckFrame | null {
  if (!poseLandmarks || poseLandmarks.length < 13) return null;

  const leftShoulder = poseLandmarks[11];
  const rightShoulder = poseLandmarks[12];
  if (!leftShoulder || !rightShoulder) return null;

  const visLeft = leftShoulder.visibility ?? 1;
  const visRight = rightShoulder.visibility ?? 1;
  if (visLeft < 0.5 || visRight < 0.5) return null;

  const shoulderWidthNorm = Math.hypot(rightShoulder.x - leftShoulder.x, rightShoulder.y - leftShoulder.y);
  if (shoulderWidthNorm < 0.05) return null;

  const flipX = (v: number) => (mirrored ? 1 - v : v);

  // Neck base anchor: horizontal midpoint of the shoulders (real anatomy, not a face-width
  // guess). Vertical position deliberately does NOT derive from shoulder geometry — mixing a
  // largely-horizontal shoulder-span measurement into a vertical offset is unit-inconsistent
  // whenever the photo isn't square (a tall portrait vs. a wide selfie normalize x/y by very
  // different pixel scales), and on a tall full-body photo this pulled the anchor all the way
  // up to eyebrow height. The chin is a single-axis, already-validated reference for "where
  // the neck starts" (same formula as computeAnatomicalNeckPose), so it's reused here whenever
  // a face was also detected; only fall back to a small fixed offset from the shoulder line
  // itself when there's no face to anchor to.
  // Horizontal centering also prefers the chin over the shoulder midpoint when a face is
  // available: shoulder landmarks get unreliable the moment a person is seated, turned, or
  // has an arm raised/reaching (very common in a casual photo), which silently drags the
  // whole necklace off to one side even though the reported confidence stays "high".
  const midXRaw = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderNeckX = Math.min(90, Math.max(10, flipX(midXRaw) * 100));

  let neckX = shoulderNeckX;
  let neckY: number;
  if (faceLandmarks && faceLandmarks.length >= 400) {
    const chin = faceLandmarks[152];
    const forehead = faceLandmarks[10];
    neckX = Math.min(90, Math.max(10, flipX(chin.x) * 100));
    const faceHeightNorm = Math.hypot(chin.x - forehead.x, chin.y - forehead.y);
    neckY = Math.min(92, Math.max(20, (chin.y + faceHeightNorm * 0.1) * 100));
  } else {
    // No face at all to anchor to — this fallback only fires on a genuinely hard photo
    // (face turned away, hair covering it, etc). With no reliable read on head size, a
    // large upward pull is dangerous: a full-body photo's head occupies a much smaller
    // fraction of total frame height than a close-up selfie's does, so the same fixed
    // percentage that looks fine up close can overshoot past the chin into the eyebrows
    // on a wider shot. Keep this deliberately small — erring toward sitting a bit low on
    // the chest is far less broken-looking than ending up on the face.
    const midYRaw = (leftShoulder.y + rightShoulder.y) / 2;
    neckY = Math.min(92, Math.max(20, (midYRaw - 0.03) * 100));
  }

  // Scale the necklace to the actual shoulder span rather than an estimate from face width.
  // The overlay renders at `width: 65%` of its container at scale=100 (see TryOnModal), and
  // a necklace should visually span roughly 90% of the shoulder-to-shoulder distance (it sits
  // just inside the shoulder line, not edge to edge). Solving 0.65*(scale/100) = 0.9*shoulderWidthNorm
  // gives the multiplier below. (A naive higher multiplier here previously bloated the necklace
  // to ~1.6x too large on typical close-framed webcam selfies, ballooning it up over the face.)
  let scalePercent = Math.min(150, Math.max(35, Math.round(shoulderWidthNorm * 138)));

  // Shoulder landmarks get unreliable the moment someone is seated, leaning, or has an arm
  // raised across their body — exactly the kind of casual photo people actually upload — and
  // an inflated shoulder-width reading here directly blows the necklace up far too large. The
  // face is detected far more consistently in those same photos, so whenever it's available,
  // cap the shoulder-derived scale at what the face width alone would suggest.
  if (faceLandmarks && faceLandmarks.length >= 400) {
    const leftEar = faceLandmarks[132] || faceLandmarks[234];
    const rightEar = faceLandmarks[361] || faceLandmarks[454];
    const faceWidthNorm = Math.hypot(rightEar.x - leftEar.x, rightEar.y - leftEar.y);
    const faceBasedScale = Math.min(150, Math.max(35, Math.round(faceWidthNorm * 185)));
    scalePercent = Math.min(scalePercent, faceBasedScale);
  }

  // Roll: tilt of the shoulder line itself (steadier than head roll for a garment resting
  // on the shoulders). Clamped hard: a real necklace never needs more than a slight tilt to
  // look natural, but atan2 has no such notion — on a dynamic/leaning pose (or a momentary
  // left/right shoulder mislabel) it can swing toward ±180°, spinning the necklace almost
  // upside down across the face instead of just tilting it. Anything past a modest lean is
  // certainly noise, not a real desired rotation, so it's clamped rather than trusted as-is.
  const dx = (mirrored ? -1 : 1) * (rightShoulder.x - leftShoulder.x);
  const dy = rightShoulder.y - leftShoulder.y;
  const rawRotationDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const rotationDeg = Math.round(Math.min(20, Math.max(-20, rawRotationDeg)));

  // Pitch (neck curvature) still comes from head tilt when available — shoulders don't
  // move with a nod, but the necklace's forward/back drape should still respond to it.
  let pitch3DDeg = 22;
  if (faceLandmarks && faceLandmarks.length >= 400) {
    const chin = faceLandmarks[152];
    const nose = faceLandmarks[1];
    const forehead = faceLandmarks[10];
    const noseToChin = chin.y - nose.y;
    const foreheadToNose = nose.y - forehead.y;
    const pitchRatio = noseToChin / (foreheadToNose || 1);
    pitch3DDeg = Math.min(50, Math.max(5, Math.round(22 + (1.2 - pitchRatio) * 25)));
  }

  const confidence = Math.round(Math.min(visLeft, visRight) * 100);
  const guidanceMessage =
    confidence > 60 ? 'Hombros detectados — colocación anatómica activa' : 'Sepárate un poco para mostrar tus hombros';

  return {
    neckAnchor: { x: Math.round(neckX), y: Math.round(neckY) },
    scalePercent,
    rotationDeg,
    pitch3DDeg,
    confidence,
    guidanceMessage,
  };
}
