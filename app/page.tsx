"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  Suspense,
} from "react";
import { useRouter } from "next/navigation";
import { getGuardian } from "@/lib/guardian";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stage as DreiStage, useGLTF } from "@react-three/drei";
import * as THREE from "three";

export default function Home() {
  const [guardianClient, setGuardianClient] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Initialize Guardian client on component mount
    const client = getGuardian();
    setGuardianClient(client);
  }, []);

  const handleLogin = async () => {
    if (!guardianClient) return;

    setIsLoading(true);
    try {
      const auth = await guardianClient.checkAuth();

      if (auth?.authenticated) {
        router.push("/dashboard");
      } else {
        // If not authenticated, the SDK will redirect to login page
        // The redirect URL should handle the authorization code in the query parameter
        console.log("Please complete login in the opened window...");
      }
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 3D background */}
      <EarScene />

      <div className="flex flex-col items-center justify-center min-h-screen p-8 relative z-10">
        <div className="rounded-3xl bg-[#f2f2f2]/90 px-10 py-12 flex flex-col items-center w-full max-w-xl">
          <main className="flex flex-col items-center gap-8 w-full">
            <h1 className="text-3xl font-bold mb-4 text-center">
              Nothing Ear Brainwave Monitor
            </h1>

            <button
              className="rounded-full bg-yellow-400/90 hover:bg-yellow-500/90 text-white font-bold py-3 px-6 disabled:opacity-50"
              onClick={handleLogin}
              disabled={isLoading || !guardianClient}
            >
              {isLoading ? "Logging in..." : "Login through IDUN Guardian"}
            </button>
          </main>
        </div>
      </div>
    </div>
  );
}

function EarModel(props: any) {
  const { scene } = useGLTF("/models/ear.glb");

  const cloned = useMemo(() => {
    const root = scene.clone(true);

    // Assign custom materials
    root.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const name = (mesh.name || "").toLowerCase();

        if (name === "body10" || name === "body2") {
          // Black plastic: dark, slightly shiny
          mesh.material = new THREE.MeshStandardMaterial({
            color: 0x202020,
            metalness: 0.0,
            roughness: 0.1,
          });
        } else if (name === "body11") {
          // Black rubber: dark, matte, soft
          mesh.material = new THREE.MeshStandardMaterial({
            color: 0x000000,
            metalness: 0.0,
            roughness: 0.85,
          });
        }
        else if (name === "body1") {
          // White Acrylic
          mesh.material = new THREE.MeshPhysicalMaterial({
            color: 0xd3d3d3,
            metalness: 0.0,
            roughness: 0.0,
            transmission: 0.95,
            thickness: 0.5,
            ior: 1.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.0,
          });
        }
      }
    });

    return root;
  }, [scene]);

  return <primitive object={cloned} {...props} />;
}

function RotatingEar(props: any) {
  const group = useRef<THREE.Group | null>(null);

  useFrame((_: any, delta: number) => {
    if (!group.current) return;
    const speedY = props.speedY ?? 0.5;
    const speedZ = props.speedZ ?? 1.0;
    group.current.rotation.y += delta * speedY;
    group.current.rotation.z += delta * speedZ;
  });

  const { position, ...modelProps } = props;

  return (
    <group ref={group} position={position}>
      <EarModel {...modelProps} />
    </group>
  );
}

function RotatingEarPair() {
  return (
    <>
      {/* Left earbud */}
      <RotatingEar
        position={[-0.2, 0.8, 0]}
        scale={0.2}
        speedY={0.5}
        speedZ={-0.01}
      />
      {/* Right earbud, mirrored and with a slightly different rotation */}
      <RotatingEar
        position={[0.2, -0.6, 0]}
        scale={[-0.2, 0.2, 0.2]}
        speedY={-0.5}
        speedZ={-0.01}
      />
    </>
  );
}

function EarScene() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0.8, 3.5], fov: 45 }}>
        <Suspense fallback={null}>
          <DreiStage
            preset="rembrandt"
            intensity={1.9}
            environment="studio"
            adjustCamera={false}
            shadows={false}
          >
            <RotatingEarPair />
          </DreiStage>
        </Suspense>
        <OrbitControls
          enableDamping
          enablePan={false}
          autoRotate={false}
          minDistance={2}
          maxDistance={10}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/ear.glb");
