"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getGuardian } from "@/lib/guardian";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";


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

  const threeContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!threeContainerRef.current) return;

    const container = threeContainerRef.current;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true, // transparent so Tailwind bg can show through if you want
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.cursor = "grab";
    container.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    scene.background = null;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 1, 4);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    // Model
    const loader = new GLTFLoader();
    let modelRef: THREE.Object3D | null = null;
    loader.load(
      "/models/ear.glb",
      (gltf) => {
        const model = gltf.scene;
        modelRef = model;

        model.scale.set(0.5, 0.5, 0.5);
        model.position.set(0, -0.5, 0);

        // Assign custom materials
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const name = (mesh.name || "").toLowerCase();
            if (name === "body10" || name === "body2") {
              // Black plastic: dark, slightly shiny
              mesh.material = new THREE.MeshStandardMaterial({
                color: 0x000000,
                metalness: 0.0,
                roughness: 0.1,
                clearcoat: 0.5,
                clearcoatRoughness: 0.1,
              });
            } else if (name === "body11") {
              // Black rubber: dark, matte, soft
              mesh.material = new THREE.MeshStandardMaterial({
                color: 0x000000,
                metalness: 0.0,
                roughness: 0.85,
              });
            }
          }
        });

        scene.add(model);
      },
      undefined,
      (error) => {
        console.error("Error loading GLB:", error);
      }
    );

    // Controls (for spinning / drag)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.autoRotate = false; // disable camera auto-rotate if model will spin itself
    controls.autoRotateSpeed = 5.0;
    controls.minDistance = 2;
    controls.maxDistance = 10;

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    let frameId: number;
    let prevTime = performance.now();
    const animate = () => {
      frameId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = (now - prevTime) / 1000; // seconds
      prevTime = now;

      // rotate model on multiple axes
      if (modelRef) {
        modelRef.rotation.x += delta * 0.0;
        modelRef.rotation.y += delta * 0.5;
        modelRef.rotation.z += delta * 1.0;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 3D background */}
      <div
        ref={threeContainerRef}
        className="fixed inset-0 -z-10"
      />

      <div className="flex flex-col items-center justify-center min-h-screen p-8 relative z-10">
        <div className="rounded-3xl bg-yellow-400/90 shadow-lg px-10 py-12 flex flex-col items-center w-full max-w-xl">
          <main className="flex flex-col items-center gap-8 w-full">
            <h1 className="text-3xl font-bold mb-4 text-center">
              Nothing Ear Brainwave Monitor
            </h1>

            <button
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 disabled:opacity-50"
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