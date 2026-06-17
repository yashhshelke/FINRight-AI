"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, Environment } from "@react-three/drei";
import * as THREE from "three";

interface RobotProps {
  mouseX: number;
  mouseY: number;
  scale?: number;
}

function Robot({ mouseX, mouseY, scale = 1 }: RobotProps) {
  const headRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const targetHead = useMemo(() => new THREE.Vector3(), []);
  const currentHead = useMemo(() => new THREE.Euler(), []);

  useFrame((_, delta) => {
    if (!headRef.current) return;

    targetHead.set(mouseY * 0.25, mouseX * 0.35, 0);
    currentHead.x = THREE.MathUtils.lerp(currentHead.x, targetHead.x, delta * 4);
    currentHead.y = THREE.MathUtils.lerp(currentHead.y, targetHead.y, delta * 4);
    headRef.current.rotation.x = currentHead.x;
    headRef.current.rotation.y = currentHead.y;

    const eyeOffsetX = mouseX * 0.015;
    const eyeOffsetY = mouseY * 0.01;

    if (leftEyeRef.current) {
      leftEyeRef.current.position.x = -0.12 + eyeOffsetX;
      leftEyeRef.current.position.y = 0.02 + eyeOffsetY;
    }
    if (rightEyeRef.current) {
      rightEyeRef.current.position.x = 0.12 + eyeOffsetX;
      rightEyeRef.current.position.y = 0.02 + eyeOffsetY;
    }

    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.03;
    }
  });

  return (
    <group ref={groupRef} scale={scale}>
      {/* Body */}
      <RoundedBox args={[1.4, 1.6, 0.9]} radius={0.15} smoothness={4} position={[0, -0.3, 0]}>
        <meshStandardMaterial color="#F0F0F0" roughness={0.7} metalness={0.1} />
      </RoundedBox>

      {/* Brand accent strip */}
      <mesh position={[0, 0.2, 0.46]}>
        <boxGeometry args={[0.8, 0.04, 0.02]} />
        <meshStandardMaterial color="#076653" emissive="#076653" emissiveIntensity={0.3} />
      </mesh>

      {/* Head group */}
      <group ref={headRef} position={[0, 0.85, 0]}>
        <RoundedBox args={[1.1, 0.85, 0.75]} radius={0.2} smoothness={4}>
          <meshStandardMaterial color="#E8E8E8" roughness={0.65} metalness={0.1} />
        </RoundedBox>

        {/* Face panel - black glass */}
        <mesh position={[0, 0, 0.38]}>
          <planeGeometry args={[0.75, 0.45]} />
          <meshPhysicalMaterial
            color="#0a0a0a"
            roughness={0.1}
            metalness={0.8}
            transparent
            opacity={0.92}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </mesh>

        {/* Eyes */}
        <mesh ref={leftEyeRef} position={[-0.12, 0.02, 0.4]}>
          <circleGeometry args={[0.055, 32]} />
          <meshStandardMaterial color="#0F8A6B" emissive="#0F8A6B" emissiveIntensity={0.8} />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.12, 0.02, 0.4]}>
          <circleGeometry args={[0.055, 32]} />
          <meshStandardMaterial color="#0F8A6B" emissive="#0F8A6B" emissiveIntensity={0.8} />
        </mesh>

        {/* Subtle mouth line */}
        <mesh position={[0, -0.1, 0.4]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.15, 0.015, 0.01]} />
          <meshStandardMaterial color="#076653" emissive="#076653" emissiveIntensity={0.2} />
        </mesh>
      </group>

      {/* Shoulder accents */}
      {[-0.75, 0.75].map((x) => (
        <RoundedBox key={x} args={[0.25, 0.5, 0.3]} radius={0.08} smoothness={4} position={[x, -0.1, 0]}>
          <meshStandardMaterial color="#E0E0E0" roughness={0.7} metalness={0.1} />
        </RoundedBox>
      ))}
    </group>
  );
}

interface AICompanionProps {
  mouseX: number;
  mouseY: number;
  scale?: number;
  className?: string;
}

export function AICompanion({ mouseX, mouseY, scale = 1, className }: AICompanionProps) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0.2, 4.5], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
        <directionalLight position={[-3, 2, -2]} intensity={0.4} color="#0F8A6B" />
        <pointLight position={[0, -2, 3]} intensity={0.3} color="#FF812B" />
        <Robot mouseX={mouseX} mouseY={mouseY} scale={scale} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
