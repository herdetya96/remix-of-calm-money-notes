import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls, RoundedBox } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * Motor 3D dengan bodi transparan — tangki bensin terlihat terisi
 * sesuai fillFrac. Garis merah menandai level pesanan pelanggan.
 *
 * Kursor di atas canvas berubah jadi nozzle SPBU: arahkan ke tangki
 * lalu tahan klik untuk mengisi (onFillStart/onFillStop), atau pakai
 * tombol merah di luar canvas.
 */
export function Motorbike3D({
  fillFrac,
  targetFrac,
  filling,
  onFillStart,
  onFillStop,
}: {
  fillFrac: number;
  targetFrac: number;
  filling: boolean;
  onFillStart: () => void;
  onFillStop: () => void;
}) {
  const [overTank, setOverTank] = useState(false);

  return (
    <div className="w-full h-[280px] md:h-[340px] rounded-xl bg-gradient-to-b from-[#eef3fb] to-[#dde7f5] overflow-hidden cursor-none">
      <Canvas camera={{ position: [3.4, 2.2, 4.4], fov: 40 }} dpr={[1, 2]}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[4, 7, 4]} intensity={1.4} />
        <directionalLight position={[-5, 3, -4]} intensity={0.4} />
        <Scooter
          fillFrac={fillFrac}
          targetFrac={targetFrac}
          filling={filling}
          overTank={overTank}
          setOverTank={setOverTank}
          onFillStart={onFillStart}
          onFillStop={onFillStop}
        />
        <NozzleCursor overTank={overTank} filling={filling} />
        <ContactShadows position={[0, 0, 0]} opacity={0.35} scale={8} blur={2.4} far={2} />
        {/* Kamera diam — hanya berputar saat pengguna menggeser area kosong */}
        <OrbitControls
          target={[0, 1, 0]}
          enablePan={false}
          enableZoom={false}
          enabled={!overTank && !filling}
          minPolarAngle={0.7}
          maxPolarAngle={1.45}
        />
      </Canvas>
    </div>
  );
}

// Dimensi tangki (dipakai bensin, garis target & nozzle)
const TANK = { x: 0.05, w: 0.95, h: 0.95, d: 0.6, centerY: 1.3 };
const TANK_BOTTOM = TANK.centerY - TANK.h / 2 + 0.05;
const TANK_INNER_H = TANK.h - 0.12;
// Posisi nozzle saat "dicolokkan" ke lubang tangki
const NOZZLE_DOCK = new THREE.Vector3(TANK.x - 0.02, 2.12, 0);

type FillHandlers = {
  overTank: boolean;
  setOverTank: (v: boolean) => void;
  onFillStart: () => void;
  onFillStop: () => void;
};

function Scooter({
  fillFrac,
  targetFrac,
  filling,
  ...handlers
}: {
  fillFrac: number;
  targetFrac: number;
  filling: boolean;
} & FillHandlers) {
  const bodyGlass = (
    <meshPhysicalMaterial
      color="#7ba3ef"
      transparent
      opacity={0.22}
      roughness={0.15}
      metalness={0.1}
      depthWrite={false}
    />
  );

  return (
    <group>
      <Wheel x={-1.35} />
      <Wheel x={1.35} />

      {/* Bodi transparan */}
      <mesh position={[0.1, 0.62, 0]}>
        <boxGeometry args={[1.15, 0.12, 0.5]} />
        {bodyGlass}
      </mesh>
      <mesh position={[-0.85, 1.0, 0]} rotation={[0, 0, 0.28]}>
        <boxGeometry args={[1.05, 0.45, 0.45]} />
        {bodyGlass}
      </mesh>
      <mesh position={[1.0, 1.05, 0]} rotation={[0, 0, -0.32]}>
        <boxGeometry args={[0.18, 1.05, 0.38]} />
        {bodyGlass}
      </mesh>

      {/* Jok */}
      <RoundedBox
        args={[0.95, 0.18, 0.48]}
        radius={0.06}
        position={[-0.85, 1.33, 0]}
        rotation={[0, 0, 0.08]}
      >
        <meshStandardMaterial color="#23262b" roughness={0.7} />
      </RoundedBox>

      {/* Setang + lampu */}
      <mesh position={[1.22, 1.68, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.85, 16]} />
        <meshStandardMaterial color="#2b2e33" roughness={0.4} metalness={0.5} />
      </mesh>
      {[-0.38, 0.38].map((z) => (
        <mesh key={z} position={[1.22, 1.68, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.18, 16]} />
          <meshStandardMaterial color="#16181b" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[1.38, 1.42, 0]}>
        <sphereGeometry args={[0.1, 24, 24]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.7} />
      </mesh>

      {/* Tangki transparan + bensin */}
      <FuelTank fillFrac={fillFrac} targetFrac={targetFrac} filling={filling} {...handlers} />

      {/* Lantai */}
      <mesh position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.6, 48]} />
        <meshStandardMaterial color="#e7eef9" roughness={1} />
      </mesh>
    </group>
  );
}

function Wheel({ x }: { x: number }) {
  return (
    <group position={[x, 0.5, 0]}>
      <mesh>
        <torusGeometry args={[0.42, 0.13, 16, 40]} />
        <meshStandardMaterial color="#1f2226" roughness={0.85} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.16, 20]} />
        <meshStandardMaterial color="#9aa3ad" roughness={0.35} metalness={0.6} />
      </mesh>
      {[0, Math.PI / 3, (2 * Math.PI) / 3].map((rot) => (
        <mesh key={rot} rotation={[0, 0, rot]}>
          <boxGeometry args={[0.74, 0.05, 0.05]} />
          <meshStandardMaterial color="#aab3bd" roughness={0.4} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function FuelTank({
  fillFrac,
  targetFrac,
  filling,
  overTank,
  setOverTank,
  onFillStart,
  onFillStop,
}: {
  fillFrac: number;
  targetFrac: number;
  filling: boolean;
} & FillHandlers) {
  const fuelRef = useRef<THREE.Mesh>(null);
  const surfaceRef = useRef<THREE.Mesh>(null);
  const shownFrac = useRef(0);

  // Level bensin dihaluskan + permukaan bergoyang halus saat mengisi
  useFrame(({ clock }) => {
    shownFrac.current = THREE.MathUtils.lerp(shownFrac.current, fillFrac, 0.25);
    const frac = Math.max(shownFrac.current, 0.001);
    const h = TANK_INNER_H * frac;
    if (fuelRef.current) {
      fuelRef.current.scale.y = h;
      fuelRef.current.position.y = TANK_BOTTOM + h / 2;
      fuelRef.current.visible = shownFrac.current > 0.005;
    }
    if (surfaceRef.current) {
      const wobble = filling ? Math.sin(clock.elapsedTime * 14) * 0.012 : 0;
      surfaceRef.current.position.y = TANK_BOTTOM + h + wobble;
      surfaceRef.current.visible = shownFrac.current > 0.005;
    }
  });

  const targetY = TANK_BOTTOM + TANK_INNER_H * targetFrac;

  return (
    <group position={[TANK.x, 0, 0]}>
      {/* Bensin (digeser/diskala via useFrame) */}
      <mesh ref={fuelRef}>
        <boxGeometry args={[TANK.w - 0.14, 1, TANK.d - 0.14]} />
        <meshStandardMaterial color="#2e6de9" transparent opacity={0.92} roughness={0.2} />
      </mesh>
      <mesh ref={surfaceRef}>
        <boxGeometry args={[TANK.w - 0.14, 0.02, TANK.d - 0.14]} />
        <meshStandardMaterial color="#9ec2ff" emissive="#6ea8ff" emissiveIntensity={0.4} />
      </mesh>

      {/* Dinding tangki kaca — menyala saat nozzle diarahkan ke sini */}
      <RoundedBox args={[TANK.w, TANK.h, TANK.d]} radius={0.1} position={[0, TANK.centerY, 0]}>
        <meshPhysicalMaterial
          color={overTank ? "#aecbff" : "#dbe7ff"}
          transparent
          opacity={overTank ? 0.32 : 0.18}
          roughness={0.05}
          metalness={0}
          depthWrite={false}
        />
      </RoundedBox>

      {/* Area sentuh nozzle (sedikit lebih besar dari tangki) */}
      <mesh
        position={[0, TANK.centerY + 0.08, 0]}
        onPointerOver={() => setOverTank(true)}
        onPointerOut={() => {
          setOverTank(false);
          onFillStop();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onFillStart();
        }}
        onPointerUp={() => onFillStop()}
      >
        <boxGeometry args={[TANK.w + 0.3, TANK.h + 0.45, TANK.d + 0.3]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Garis target pesanan (cincin merah) */}
      <mesh position={[0, targetY, 0]}>
        <boxGeometry args={[TANK.w + 0.06, 0.022, TANK.d + 0.06]} />
        <meshStandardMaterial color="#e5484d" transparent opacity={0.9} />
      </mesh>

      {/* Tutup tangki */}
      <mesh position={[0, TANK.centerY + TANK.h / 2 + 0.02, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.06, 20]} />
        <meshStandardMaterial color="#2b2e33" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Aliran bensin dari nozzle saat mengisi */}
      {filling && <FuelStream />}
    </group>
  );
}

/**
 * Nozzle SPBU yang mengikuti kursor. Saat diarahkan ke tangki (atau saat
 * mengisi lewat tombol) nozzle "dicolokkan" ke lubang tangki.
 */
function NozzleCursor({ overTank, filling }: { overTank: boolean; filling: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const seenRef = useRef(false);
  // Bidang di depan tangki tempat nozzle bergerak mengikuti kursor
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.45), []);
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    if (!ref.current) return;
    const docked = filling || overTank;
    if (docked) {
      target.copy(NOZZLE_DOCK);
    } else {
      state.raycaster.setFromCamera(state.pointer, state.camera);
      if (!state.raycaster.ray.intersectPlane(plane, target)) return;
      target.x = THREE.MathUtils.clamp(target.x, -2.4, 2.4);
      target.y = THREE.MathUtils.clamp(target.y, 0.35, 2.7);
      target.z = 0.45;
    }
    if (!seenRef.current && (state.pointer.x !== 0 || state.pointer.y !== 0)) {
      seenRef.current = true;
    }
    ref.current.visible = seenRef.current;
    ref.current.position.lerp(target, docked ? 0.22 : 0.55);
  });

  return (
    <group ref={ref} visible={false}>
      {/* selang ke atas */}
      <mesh position={[-0.06, 0.55, 0]} rotation={[0, 0, 0.12]}>
        <cylinderGeometry args={[0.045, 0.045, 0.75, 10]} />
        <meshStandardMaterial color="#2b2e33" roughness={0.8} />
      </mesh>
      {/* bodi nozzle */}
      <mesh position={[0, 0.12, 0]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[0.2, 0.34, 0.16]} />
        <meshStandardMaterial color="#e5484d" roughness={0.45} />
      </mesh>
      {/* tuas/gagang */}
      <mesh position={[-0.15, 0.14, 0]} rotation={[0, 0, 0.55]}>
        <boxGeometry args={[0.18, 0.06, 0.12]} />
        <meshStandardMaterial color="#23262b" roughness={0.7} />
      </mesh>
      {/* moncong */}
      <mesh position={[0.08, -0.12, 0]} rotation={[0, 0, 0.35]}>
        <cylinderGeometry args={[0.032, 0.045, 0.34, 12]} />
        <meshStandardMaterial color="#9aa3ad" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

function FuelStream() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const m = ref.current.material as THREE.MeshStandardMaterial;
      m.opacity = 0.65 + Math.sin(clock.elapsedTime * 24) * 0.2;
    }
  });
  // Dari moncong nozzle yang tercolok di tutup tangki ke dasar tangki
  const top = 1.84;
  const bottom = TANK.centerY - TANK.h / 2 + 0.1;
  return (
    <mesh ref={ref} position={[0.1, (top + bottom) / 2, 0]}>
      <cylinderGeometry args={[0.028, 0.04, top - bottom, 10]} />
      <meshStandardMaterial color="#5b94f5" transparent opacity={0.7} />
    </mesh>
  );
}
