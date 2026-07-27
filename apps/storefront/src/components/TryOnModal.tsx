import { Camera, Sparkles, UserCheck, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Point3DSmoother } from '../lib/ar/smoothing';
import { computeAnatomicalNeckPose, computeShoulderAnchoredNeckPose } from '../lib/ar/anatomy';
import { createAdaptiveTransparentImage } from '../lib/ar/background';

interface Labels {
  open: string;
  title: string;
  description: string;
  camera: string;
  upload: string;
  close: string;
  scale: string;
  horizontal: string;
  vertical: string;
  reset: string;
  noImage: string;
  cameraError: string;
  localPrivacy: string;
}

interface Props {
  productName: string;
  productImage?: string;
  category?: string;
  labels: Labels;
}

// MediaPipe Vision WASM loader
let faceLandmarkerPromise: Promise<any> | null = null;

async function getFaceLandmarker() {
  if (faceLandmarkerPromise) return faceLandmarkerPromise;
  faceLandmarkerPromise = (async () => {
    try {
      const vision = await import('@mediapipe/tasks-vision');
      const filesetResolver = await vision.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
      return await vision.FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: 'GPU',
        },
        outputFaceBlendshapes: false,
        runningMode: 'VIDEO',
        numFaces: 1,
      });
    } catch (err) {
      console.warn('MediaPipe Vision WASM load warning:', err);
      return null;
    }
  })();
  return faceLandmarkerPromise;
}

// Body Pose Landmarker — gives real shoulder positions so the necklace anchors to actual
// anatomy instead of being estimated from face width alone.
let poseLandmarkerPromise: Promise<any> | null = null;

async function getPoseLandmarker() {
  if (poseLandmarkerPromise) return poseLandmarkerPromise;
  poseLandmarkerPromise = (async () => {
    try {
      const vision = await import('@mediapipe/tasks-vision');
      const filesetResolver = await vision.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
      return await vision.PoseLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });
    } catch (err) {
      console.warn('MediaPipe Pose WASM load warning:', err);
      return null;
    }
  })();
  return poseLandmarkerPromise;
}

// Video is rendered with object-cover, which crops the captured frame to fill the
// container. Landmark coordinates are normalized to the full, uncropped frame, so they
// must be remapped into the visible (cropped) region before being used as CSS percentages —
// otherwise the overlay drifts off the neck/ears whenever the camera and panel aspect ratios differ.
function mapCoverPercent(
  xPercent: number,
  yPercent: number,
  video: HTMLVideoElement | null,
  container: HTMLElement | null
): { x: number; y: number } {
  if (!video || !container || !video.videoWidth || !video.videoHeight) {
    return { x: xPercent, y: yPercent };
  }
  const videoAspect = video.videoWidth / video.videoHeight;
  const containerAspect = container.clientWidth / container.clientHeight;

  let cropXFrac = 0;
  let cropYFrac = 0;
  if (videoAspect > containerAspect) {
    const visibleWidthFrac = containerAspect / videoAspect;
    cropXFrac = (1 - visibleWidthFrac) / 2;
  } else {
    const visibleHeightFrac = videoAspect / containerAspect;
    cropYFrac = (1 - visibleHeightFrac) / 2;
  }

  const mappedX = ((xPercent / 100 - cropXFrac) / (1 - 2 * cropXFrac)) * 100;
  const mappedY = ((yPercent / 100 - cropYFrac) / (1 - 2 * cropYFrac)) * 100;
  return { x: mappedX, y: mappedY };
}

// Uploaded photos render with object-contain (letterboxed, not cropped) — the image is
// scaled down to fit and centered, leaving padding on one axis whenever its aspect ratio
// differs from the container's. Landmark percentages (relative to the full photo) must be
// remapped into that smaller, centered rect, or the overlay drifts into the letterbox bars.
function mapContainPercent(
  xPercent: number,
  yPercent: number,
  naturalWidth: number,
  naturalHeight: number,
  container: HTMLElement | null
): { x: number; y: number } {
  if (!container || !naturalWidth || !naturalHeight) {
    return { x: xPercent, y: yPercent };
  }
  const containerW = container.clientWidth;
  const containerH = container.clientHeight;
  const imageAspect = naturalWidth / naturalHeight;
  const containerAspect = containerW / containerH;

  let renderWFrac: number;
  let renderHFrac: number;
  if (imageAspect > containerAspect) {
    renderWFrac = 1;
    renderHFrac = containerAspect / imageAspect;
  } else {
    renderHFrac = 1;
    renderWFrac = imageAspect / containerAspect;
  }
  const padXFrac = (1 - renderWFrac) / 2;
  const padYFrac = (1 - renderHFrac) / 2;

  const mappedX = ((xPercent / 100) * renderWFrac + padXFrac) * 100;
  const mappedY = ((yPercent / 100) * renderHFrac + padYFrac) * 100;
  return { x: mappedX, y: mappedY };
}

// Landmark inference can occasionally return degenerate (NaN/Infinity) coordinates —
// e.g. on an out-of-distribution or partially occluded face. Applying those to slider
// state crashes the range inputs, so any non-finite frame is rejected before use.
function isFinitePose(...values: number[]): boolean {
  return values.every((v) => Number.isFinite(v));
}

export default function TryOnModal({ productName, productImage, category = '', labels }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const photoImgRef = useRef<HTMLImageElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const smootherRef = useRef<Point3DSmoother>(new Point3DSmoother());

  const isEarring = category.toLowerCase().includes('arete') || productName.toLowerCase().includes('arete') || productName.toLowerCase().includes('earring');

  const [photo, setPhoto] = useState<string>();
  const [cutoutUrl, setCutoutUrl] = useState<string>();
  const [scale, setScale] = useState(isEarring ? 28 : 85);
  const [x, setX] = useState(50);
  const [y, setY] = useState(isEarring ? 58 : 72);
  const [rotation, setRotation] = useState(0);
  const [pitch3d, setPitch3d] = useState(isEarring ? 0 : 22);
  const [opacity, setOpacity] = useState(98);
  const [transparentMode, setTransparentMode] = useState(true);

  const [trackingActive, setTrackingActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState(labels.localPrivacy);
  const [cameraActive, setCameraActive] = useState(false);

  // Left & Right Ear positions for Earrings
  const [leftEarPos, setLeftEarPos] = useState({ x: 25, y: 58 });
  const [rightEarPos, setRightEarPos] = useState({ x: 75, y: 58 });

  const actualImage = productImage || '/images/collar-saraguro.webp';

  useEffect(() => {
    let active = true;
    createAdaptiveTransparentImage(actualImage).then((url) => {
      if (active) setCutoutUrl(url);
    });
    return () => {
      active = false;
    };
  }, [actualImage]);

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
    setTrackingActive(false);
    smootherRef.current.reset();
  };

  useEffect(() => () => {
    stopCamera();
    if (photo) URL.revokeObjectURL(photo);
  }, [photo]);

  const openDialog = async () => {
    dialogRef.current?.showModal();
    setStatusMessage(labels.localPrivacy);
    void getFaceLandmarker();
    if (!isEarring) void getPoseLandmarker();
  };

  const closeDialog = () => {
    stopCamera();
    dialogRef.current?.close();
    openerRef.current?.focus();
  };

  const startDetectionLoop = async () => {
    const landmarker = await getFaceLandmarker();
    const poseLandmarker = isEarring ? null : await getPoseLandmarker();
    const nativeDetector = !landmarker && 'FaceDetector' in window ? new (window as any).FaceDetector() : null;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const detectLoop = async (now: number) => {
      if (!streamRef.current) return;

      const video = videoRef.current;
      if (video && video.readyState >= 2 && video.currentTime > 0) {
        try {
          let detected = false;

          // 1. MediaPipe AI FaceLandmarker with 468 3D Landmarks
          if (landmarker) {
            const results = landmarker.detectForVideo(video, now);
            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
              const landmarks = results.faceLandmarks[0];
              const pose = computeAnatomicalNeckPose(landmarks);

              if (isEarring) {
                const leftMapped = mapCoverPercent(pose.leftEar.x, pose.leftEar.y, video, viewportRef.current);
                const rightMapped = mapCoverPercent(pose.rightEar.x, pose.rightEar.y, video, viewportRef.current);
                const smoothed = smootherRef.current.smooth(
                  { x: 50, y: 58, scale: Math.min(55, Math.max(15, Math.round(pose.scalePercent * 0.35))), rotation: 0, pitch: 0 },
                  now
                );
                if (isFinitePose(leftMapped.x, leftMapped.y, rightMapped.x, rightMapped.y, smoothed.scale)) {
                  detected = true;
                  setStatusMessage(pose.guidanceMessage);
                  setLeftEarPos(leftMapped);
                  setRightEarPos(rightMapped);
                  setScale(Math.round(smoothed.scale));
                }
              } else {
                // Prefer real shoulder anchoring over the face-width estimate whenever
                // shoulders are actually visible in frame.
                const shoulderPose = poseLandmarker
                  ? computeShoulderAnchoredNeckPose(
                      poseLandmarker.detectForVideo(video, now)?.landmarks?.[0] ?? [],
                      landmarks,
                      true
                    )
                  : null;
                const framePose = shoulderPose ?? pose;
                // Shoulders give a much more precise anchor than the face-width estimate —
                // when they're not visible in frame at all, say so plainly rather than a
                // generic "tracking active" message, since that's the single biggest lever
                // for a well-fitted necklace.
                const guidanceMessage = shoulderPose
                  ? framePose.guidanceMessage
                  : 'Aleja un poco la cámara para que se vean tus hombros y el collar ajuste mejor';

                const neckMapped = mapCoverPercent(framePose.neckAnchor.x, framePose.neckAnchor.y, video, viewportRef.current);
                const smoothed = smootherRef.current.smooth(
                  {
                    x: neckMapped.x,
                    y: neckMapped.y,
                    scale: framePose.scalePercent,
                    rotation: framePose.rotationDeg,
                    pitch: framePose.pitch3DDeg,
                  },
                  now
                );

                if (isFinitePose(smoothed.x, smoothed.y, smoothed.scale, smoothed.rotation, smoothed.pitch)) {
                  detected = true;
                  setStatusMessage(guidanceMessage);
                  setX(Math.round(smoothed.x));
                  setY(Math.round(smoothed.y));
                  setScale(Math.round(smoothed.scale));
                  setRotation(Math.round(smoothed.rotation));
                  setPitch3d(Math.round(smoothed.pitch));
                }
              }
            }
          }

          // 2. Native Browser FaceDetector Fallback
          if (!detected && nativeDetector) {
            const faces = await nativeDetector.detect(video);
            if (faces && faces.length > 0) {
              const box = faces[0].boundingBox;
              const vH = video.videoHeight || 1;
              const vW = video.videoWidth || 1;
              detected = true;
              setStatusMessage('Probador activo (Detector Nativo)');

              const chinX = (box.left + box.width / 2) / vW;
              const chinY = (box.top + box.height) / vH;

              if (isEarring) {
                const lX = (1 - (box.left + box.width) / vW) * 100 - 3;
                const rX = (1 - box.left / vW) * 100 + 3;
                const eY = ((box.top + box.height * 0.65) / vH) * 100;
                const leftMapped = mapCoverPercent(lX, eY, video, viewportRef.current);
                const rightMapped = mapCoverPercent(rX, eY, video, viewportRef.current);
                setLeftEarPos(leftMapped);
                setRightEarPos(rightMapped);
              } else {
                const rawTargetX = (1 - chinX) * 100;
                const rawTargetY = Math.min(84, Math.max(25, (chinY + 0.04) * 100));
                const mapped = mapCoverPercent(rawTargetX, rawTargetY, video, viewportRef.current);
                const targetScale = Math.min(160, Math.max(40, Math.round((box.width / vW) * 175)));

                const smoothed = smootherRef.current.smooth(
                  { x: mapped.x, y: mapped.y, scale: targetScale, rotation: 0, pitch: 22 },
                  now
                );

                setX(Math.round(smoothed.x));
                setY(Math.round(smoothed.y));
                setScale(Math.round(smoothed.scale));
              }
            }
          }

          // 3. Fallback: Fast Color & Motion Neck Centering
          if (!detected && ctx) {
            canvas.width = 160;
            canvas.height = 120;
            ctx.drawImage(video, 0, 0, 160, 120);
            const imgData = ctx.getImageData(0, 0, 160, 120);
            const data = imgData.data;

            // Count skin pixels per row to find the neck silhouette indentation
            const rowWidths = new Array(120).fill(0);
            let skinCount = 0;
            let skinXSum = 0;

            for (let py = 25; py < 105; py++) {
              for (let px = 30; px < 130; px += 2) {
                const idx = (py * 160 + px) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];

                if (r > 60 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 12) {
                  rowWidths[py]++;
                  skinXSum += px;
                  skinCount++;
                }
              }
            }

            if (skinCount > 50) {
              detected = true;
              setStatusMessage('Alineado por contraste óptico');
              
              // Find where the face skin starts (top of head/face in frame)
              let faceStart = 25;
              while (faceStart < 80 && rowWidths[faceStart] < 6) {
                faceStart++;
              }

              // 1. ADVANCED OPTICAL CONTRAST: Skin-to-Clothing (Neckline/Collarbone) transition detection
              const transitions: number[] = [];
              for (let px = 45; px < 115; px += 2) {
                let skinFound = false;
                let borderY = -1;
                // Scan downwards to locate the boundary where skin ends and shirt/clothing begins
                for (let py = faceStart + 5; py < 105; py++) {
                  const idx = (py * 160 + px) * 4;
                  const r = data[idx];
                  const g = data[idx + 1];
                  const b = data[idx + 2];
                  const isSkin = r > 60 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 12;

                  if (isSkin) {
                    skinFound = true;
                  } else if (skinFound) {
                    borderY = py;
                    break;
                  }
                }
                if (borderY !== -1) {
                  transitions.push(borderY);
                }
              }

              // Determine the final neck Y coordinate
              let targetY = -1;
              if (transitions.length > 8) {
                transitions.sort((a, b) => a - b);
                // Median transition point represents the neckline curve
                targetY = transitions[Math.floor(transitions.length * 0.5)];
              }

              // 2. FALLBACK SILHOUETTE: Use the narrowest point of the neck column if no clothing border found
              if (targetY === -1) {
                let neckY = Math.min(85, faceStart + 20);
                let minWidth = 999;
                for (let py = faceStart + 10; py < Math.min(100, faceStart + 35); py++) {
                  if (rowWidths[py] > 2 && rowWidths[py] < minWidth) {
                    minWidth = rowWidths[py];
                    neckY = py;
                  }
                }
                targetY = neckY;
              }

              const avgX = skinXSum / skinCount;
              const rawTargetX = (1 - avgX / 160) * 100;
              // Allow Y to follow the clothing/neckline border completely freely
              const rawTargetY = (targetY / 120) * 100;
              const mapped = mapCoverPercent(rawTargetX, rawTargetY, video, viewportRef.current);

              const smoothed = smootherRef.current.smooth(
                { x: mapped.x, y: mapped.y, scale: 85, rotation: 0, pitch: 22 },
                now
              );

              setX(Math.round(smoothed.x));
              setY(Math.round(smoothed.y));
            }
          }

          if (!detected) {
            setStatusMessage('Buscando rostro y cuello...');
          }

          setTrackingActive(detected);
        } catch (_) {
          // Ignore
        }
      }

      animFrameRef.current = requestAnimationFrame((t) => detectLoop(t));
    };

    animFrameRef.current = requestAnimationFrame((t) => detectLoop(t));
  };

  const startCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setPhoto(undefined);
      setY(isEarring ? 58 : 72);

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(() => {
            startDetectionLoop();
          });
        }
      });
      setStatusMessage(labels.localPrivacy);
    } catch {
      setStatusMessage(labels.cameraError);
    }
  };

  const runPhotoDetection = async () => {
    const img = photoImgRef.current;
    if (!img || !img.complete || !img.naturalWidth) return;

    try {
      // Face and shoulder detection run independently — a photo where the face is turned,
      // tilted, or partly out of frame can still have clearly visible shoulders (and vice
      // versa), so one failing must not block the other from anchoring the piece.
      const landmarker = await getFaceLandmarker();
      const faceResults = landmarker ? landmarker.detectForVideo(img, performance.now()) : null;
      const faceLandmarks = faceResults?.faceLandmarks?.[0] ?? null;

      if (isEarring) {
        if (!faceLandmarks) {
          setStatusMessage('No se detectó rostro en la foto; usa una foto de frente');
          setTrackingActive(false);
          return;
        }
        const pose = computeAnatomicalNeckPose(faceLandmarks, false);
        const leftMapped = mapContainPercent(pose.leftEar.x, pose.leftEar.y, img.naturalWidth, img.naturalHeight, viewportRef.current);
        const rightMapped = mapContainPercent(pose.rightEar.x, pose.rightEar.y, img.naturalWidth, img.naturalHeight, viewportRef.current);
        const nextScale = Math.min(55, Math.max(15, Math.round(pose.scalePercent * 0.35)));
        if (!isFinitePose(leftMapped.x, leftMapped.y, rightMapped.x, rightMapped.y, nextScale)) {
          setStatusMessage('No se detectó el rostro con precisión; usa una foto de frente');
          setTrackingActive(false);
          return;
        }
        setLeftEarPos(leftMapped);
        setRightEarPos(rightMapped);
        setScale(nextScale);
        setStatusMessage(pose.guidanceMessage);
        setTrackingActive(true);
        return;
      }

      // Necklace: prefer real shoulder anchoring; fall back to the face-width estimate only
      // if shoulders truly aren't detectable.
      const poseLandmarker = await getPoseLandmarker();
      const poseResults = poseLandmarker ? poseLandmarker.detectForVideo(img, performance.now()) : null;
      const shoulderPose = computeShoulderAnchoredNeckPose(poseResults?.landmarks?.[0] ?? [], faceLandmarks, false);
      const framePose = shoulderPose ?? (faceLandmarks ? computeAnatomicalNeckPose(faceLandmarks, false) : null);

      if (!framePose) {
        setStatusMessage('No se detectaron hombros ni rostro; usa una foto de frente con el cuello visible');
        setTrackingActive(false);
        return;
      }

      const neckMapped = mapContainPercent(framePose.neckAnchor.x, framePose.neckAnchor.y, img.naturalWidth, img.naturalHeight, viewportRef.current);
      if (!isFinitePose(neckMapped.x, neckMapped.y, framePose.scalePercent, framePose.rotationDeg, framePose.pitch3DDeg)) {
        setStatusMessage('No se detectó la posición con precisión; usa una foto de frente');
        setTrackingActive(false);
        return;
      }
      setX(Math.round(neckMapped.x));
      setY(Math.round(neckMapped.y));
      setScale(framePose.scalePercent);
      setRotation(framePose.rotationDeg);
      setPitch3d(framePose.pitch3DDeg);
      // Shoulders give a much more precise anchor than the face-width fallback — when a photo
      // is framed too tight to include them, say so plainly instead of a generic message.
      setStatusMessage(
        shoulderPose ? framePose.guidanceMessage : 'Usa una foto encuadrada desde el pecho para que se vean tus hombros'
      );
      setTrackingActive(true);
    } catch (_) {
      setStatusMessage('No se pudo detectar automáticamente; usa una foto de frente');
      setTrackingActive(false);
    }
  };



  const displayImage = transparentMode && cutoutUrl ? cutoutUrl : actualImage;

  return (
    <>
      <button ref={openerRef} type="button" className="button-primary" onClick={openDialog}>
        <Camera size={18} aria-hidden="true" />
        {labels.open}
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto max-h-[92dvh] w-[min(94vw,68rem)] overflow-hidden rounded-2xl border border-charcoal-950/15 bg-ivory-50 p-0 text-charcoal-950 shadow-2xl backdrop:bg-charcoal-950/80 backdrop:backdrop-blur-sm"
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
      >
        <div className="grid max-h-[92dvh] lg:grid-cols-[1fr_22rem]">
          {/* Visual Canvas Viewport */}
          <div ref={viewportRef} className="relative grid min-h-[50dvh] place-items-center overflow-hidden bg-charcoal-950 lg:min-h-[42rem] [perspective:700px]">
            {photo ? (
              <img ref={photoImgRef} className="absolute inset-0 size-full object-contain" src={photo} alt="Usuario" onLoad={runPhotoDetection} />
            ) : cameraActive ? (
              <video ref={videoRef} className="absolute inset-0 size-full -scale-x-100 object-cover object-center" playsInline muted aria-label={labels.camera} />
            ) : (
              <div className="max-w-xs px-8 text-center text-ivory-100/70">
                <Camera className="mx-auto mb-4 size-10 text-gold-400" aria-hidden="true" />
                <p className="text-sm">{labels.noImage}</p>
              </div>
            )}

            {/* EARRINGS MODE: Two Earring overlays anchored precisely to left & right earlobes.
                For an uploaded photo, only render once detection has actually succeeded —
                showing the piece at a hardcoded default position when nothing was detected
                looks broken (floating disconnected from the body) rather than just imprecise. */}
            {((photo && trackingActive) || cameraActive) && isEarring && (
              <>
                <div
                  className="pointer-events-none absolute transition-all duration-75 ease-out flex justify-center items-center"
                  style={{
                    left: `${leftEarPos.x}%`,
                    top: `${leftEarPos.y}%`,
                    transform: `translate(-50%, 0%) scale(${scale / 100}) rotate(${rotation}deg)`,
                    transformOrigin: '50% 0%',
                    opacity: opacity / 100,
                    width: '14%',
                    maxWidth: '5.5rem',
                  }}
                >
                  <img src={displayImage} alt={productName} className="w-full h-auto object-contain select-none drop-shadow-md" />
                </div>
                <div
                  className="pointer-events-none absolute transition-all duration-75 ease-out flex justify-center items-center"
                  style={{
                    left: `${rightEarPos.x}%`,
                    top: `${rightEarPos.y}%`,
                    transform: `translate(-50%, 0%) scale(${scale / 100}) rotate(${-rotation}deg)`,
                    transformOrigin: '50% 0%',
                    opacity: opacity / 100,
                    width: '14%',
                    maxWidth: '5.5rem',
                  }}
                >
                  <img src={displayImage} alt={productName} className="w-full h-auto object-contain select-none drop-shadow-md" />
                </div>
              </>
            )}

            {/* NECKLACE MODE: Seamless 3D Curved Pure PNG Overlay (Transparent Alpha). Same
                rule as earrings above: only shown for a photo once real detection succeeded. */}
            {((photo && trackingActive) || cameraActive) && !isEarring && (
              <div
                className="pointer-events-none absolute transition-all duration-75 ease-out flex justify-center items-center"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `translate(-50%, -10%) rotateX(${pitch3d}deg) scale(${scale / 100}) rotate(${rotation}deg)`,
                  transformOrigin: '50% 5%',
                  opacity: opacity / 100,
                  width: '65%',
                  maxWidth: '32rem',
                  // Product photos show the necklace laid out flat (the back strand/clasp fully
                  // visible), so overlaying it as-is renders that strand as a line floating in
                  // front of the collarbone instead of disappearing behind the neck like a worn
                  // necklace would. Punching a soft oval hole where the neck sits — revealing the
                  // real photo/video underneath — fakes that occlusion without needing a 3D model.
                  WebkitMaskImage: 'radial-gradient(ellipse 42% 13% at 50% 5%, transparent 55%, black 100%)',
                  maskImage: 'radial-gradient(ellipse 42% 13% at 50% 5%, transparent 55%, black 100%)',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                }}
              >
                <img
                  src={displayImage}
                  alt={productName}
                  className="w-full h-auto object-contain select-none drop-shadow-[0_12px_20px_rgba(0,0,0,0.55)]"
                />
              </div>
            )}

            {/* Live Guidance & Tracking Status Badge */}
            {(cameraActive || photo) && (
              <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 px-3.5 py-2 rounded-full bg-charcoal-950/90 backdrop-blur-md border border-white/15 text-white text-xs font-semibold shadow-xl">
                <span className={`size-2.5 rounded-full ${trackingActive ? 'bg-emerald-400 animate-pulse' : 'bg-gold-400'}`}></span>
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Product Badge */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-3 p-2.5 rounded-xl bg-charcoal-950/85 backdrop-blur-md border border-white/15 text-white shadow-lg">
              <img src={actualImage} alt={productName} className="size-10 rounded-lg object-cover border border-gold-400/40 bg-white" />
              <div>
                <span className="block text-[0.65rem] font-bold uppercase tracking-wider text-gold-400">
                  {isEarring ? 'Probador de Aretes AR' : 'Probador de Collar 3D AR'}
                </span>
                <span className="block text-xs font-semibold text-white truncate max-w-[12rem]">{productName}</span>
              </div>
            </div>
          </div>

          {/* Right Controls Panel */}
          <div className="overflow-y-auto p-5 sm:p-7 bg-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-terracotta-500">{productName}</p>
                <h2 className="mt-1 font-display text-2xl sm:text-3xl text-charcoal-950">{labels.title}</h2>
              </div>
              <button className="grid min-h-10 min-w-10 place-items-center rounded-xl border border-charcoal-950/15 hover:bg-ivory-100 transition-colors" type="button" onClick={closeDialog} title={labels.close} aria-label={labels.close}>
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-charcoal-800/75">{labels.description}</p>

            <div className="mt-6">
              <button className="inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-wine-700 hover:bg-wine-800 px-3 text-sm font-bold text-white shadow-sm transition-all" type="button" onClick={startCamera}>
                <Camera size={17} aria-hidden="true" />{labels.camera}
              </button>
            </div>

            {/* Background Removal Control. Anatomical tracking itself is always on — there is
                no manual/off mode, since the piece's position isn't something a customer
                should have to configure. */}
            <div className="mt-6 space-y-2.5">
              <div className="p-3 rounded-xl bg-ivory-100/80 border border-gold-400/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-charcoal-950">
                  <UserCheck className="size-4 text-wine-700" />
                  <span>Ajuste automático activo</span>
                </div>
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-wine-700 text-white shadow-sm">Activo</span>
              </div>

              <div className="p-3 rounded-xl bg-ivory-100/80 border border-gold-400/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-charcoal-950">
                  <Sparkles className="size-4 text-wine-700" />
                  <span>Eliminar Fondo de Foto</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTransparentMode(!transparentMode)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    transparentMode
                      ? 'bg-wine-700 text-white shadow-sm'
                      : 'bg-white text-charcoal-800 border border-charcoal-950/15'
                  }`}
                >
                  {transparentMode ? 'Activado' : 'Desactivado'}
                </button>
              </div>
            </div>

            <p className="mt-6 border-t border-charcoal-950/10 pt-5 text-xs leading-5 text-charcoal-800/65" role="status" aria-live="polite">{statusMessage}</p>
          </div>
        </div>
      </dialog>
    </>
  );
}
