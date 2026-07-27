import { ContactShadows, OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface Props {
  modelUrl: string;
  scale?: number;
  autoRotate?: boolean;
  resetLabel: string;
}

function Model({ url, scale }: { url: string; scale: number }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={scale} />;
}

export default function ProductViewer3D({ modelUrl, scale = 1, autoRotate = true, resetLabel }: Props) {
  const [version, setVersion] = useState(0);

  return (
    <div className="relative min-h-[28rem] overflow-hidden bg-ivory-100" aria-label="3D product viewer">
      <Canvas key={version} camera={{ position: [0, 0.3, 4], fov: 42 }} dpr={[1, 1.5]}>
        <ambientLight intensity={1.3} />
        <hemisphereLight args={['#fff2d3', '#294f42', 1]} />
        <directionalLight position={[4, 5, 4]} intensity={2.4} castShadow />
        <Suspense fallback={null}>
          <Model url={modelUrl} scale={scale} />
          <ContactShadows position={[0, -1.2, 0]} opacity={0.32} scale={5} blur={2.5} />
        </Suspense>
        <OrbitControls autoRotate={autoRotate} autoRotateSpeed={0.75} enablePan={false} minDistance={2} maxDistance={7} />
      </Canvas>
      <button className="absolute bottom-4 right-4 grid min-h-11 min-w-11 place-items-center rounded border border-charcoal-950/15 bg-white shadow" type="button" onClick={() => setVersion((value) => value + 1)} title={resetLabel} aria-label={resetLabel}>
        <RotateCcw size={19} aria-hidden="true" />
      </button>
    </div>
  );
}
