declare module "three/examples/jsm/controls/OrbitControls" {
  import type { Camera } from "three";

  export class OrbitControls {
    constructor(object: Camera, domElement?: HTMLElement);

    enableDamping: boolean;
    enablePan: boolean;
    autoRotate: boolean;
    autoRotateSpeed: number;
    minDistance: number;
    maxDistance: number;

    update(): void;
    dispose(): void;
  }
}

declare module "three/examples/jsm/loaders/GLTFLoader" {
  import type {
    Loader,
    LoadingManager,
    Object3D,
    AnimationClip,
    Camera,
    Scene,
  } from "three";

  export interface GLTF {
    scene: Scene;
    scenes: Scene[];
    cameras: Camera[];
    animations: AnimationClip[];
    asset: Record<string, unknown>;
    parser: unknown;
    userData: Record<string, unknown>;
  }

  export class GLTFLoader extends Loader<GLTF> {
    constructor(manager?: LoadingManager);

    load(
      url: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: (event: ProgressEvent<EventTarget>) => void,
      onError?: (event: unknown) => void
    ): void;
  }
}


