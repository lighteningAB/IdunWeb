declare module "@react-three/fiber" {
  export const Canvas: any;
  export const useFrame: any;
}

declare module "@react-three/drei" {
  export const OrbitControls: any;
  export const useGLTF: any & { preload: (path: string) => void };
  export const Stage: any;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      primitive: any;
      group: any;
      ambientLight: any;
      directionalLight: any;
    }
  }
}


