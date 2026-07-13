import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
    OrbitControls,
    Environment,
    Float,
    MeshTransmissionMaterial,
    ContactShadows,
    Sparkles,
    useTexture,
    Text3D,
    Center,
    Sphere
} from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

// Premium Qəhvə Fincanı
function PremiumCoffeeCup() {
    const cupRef = useRef();
    const coffeeRef = useRef();
    const liquidRef = useRef();

    useFrame((state) => {
        if (!cupRef.current || !coffeeRef.current) return;
        const t = state.clock.getElapsedTime();

        // Smooth rotation
        cupRef.current.rotation.y = Math.sin(t * 0.2) * 0.3;
        cupRef.current.rotation.x = Math.sin(t * 0.15) * 0.05;

        // Qəhvə dalğalanması
        if (liquidRef.current) {
            liquidRef.current.position.y = Math.sin(t * 1.5) * 0.015;
            liquidRef.current.rotation.z = Math.sin(t * 1.2) * 0.02;
        }
    });

    return (
        <Float speed={1} rotationIntensity={0.3} floatIntensity={0.4}>
            <group ref={cupRef} position={[0, -0.3, 0]}>
                {/* Fincan - Glass material */}
                <mesh castShadow receiveShadow>
                    <cylinderGeometry args={[0.9, 0.7, 1.8, 64]} />
                    <MeshTransmissionMaterial
                        backside
                        samples={16}
                        resolution={512}
                        transmission={0.95}
                        roughness={0.1}
                        thickness={0.5}
                        ior={1.5}
                        chromaticAberration={0.06}
                        anisotropy={0.3}
                        distortion={0.1}
                        distortionScale={0.2}
                        temporalDistortion={0.1}
                        color="#ffffff"
                    />
                </mesh>

                {/* Fincan dibi */}
                <mesh position={[0, -0.9, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.7, 0.7, 0.15, 64]} />
                    <meshStandardMaterial
                        color="#f8f8f8"
                        roughness={0.2}
                        metalness={0.3}
                    />
                </mesh>

                {/* Qəhvə mayesi - realistik */}
                <group ref={liquidRef} position={[0, 0.2, 0]}>
                    <mesh>
                        <cylinderGeometry args={[0.85, 0.85, 0.15, 64]} />
                        <meshStandardMaterial
                            color="#2d1810"
                            roughness={0.05}
                            metalness={0.4}
                            emissive="#3d2817"
                            emissiveIntensity={0.3}
                        />
                    </mesh>
                    {/* Köpük */}
                    <mesh position={[0, 0.08, 0]}>
                        <cylinderGeometry args={[0.8, 0.8, 0.02, 64]} />
                        <meshStandardMaterial
                            color="#d4c4a8"
                            roughness={0.9}
                            metalness={0.1}
                        />
                    </mesh>
                </group>

                {/* Premium sapı - Gold */}
                <mesh position={[1, 0.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                    <torusGeometry args={[0.4, 0.1, 32, 64]} />
                    <meshStandardMaterial
                        color="#d4af37"
                        roughness={0.2}
                        metalness={0.9}
                        emissive="#d4af37"
                        emissiveIntensity={0.2}
                    />
                </mesh>

                {/* Premium Buxar */}
                <PremiumSteam />
            </group>
        </Float>
    );
}

// Premium Buxar Effekti
function PremiumSteam() {
    const steamRef = useRef();

    useFrame((state) => {
        if (!steamRef.current) return;
        const t = state.clock.getElapsedTime();

        steamRef.current.children.forEach((particle, i) => {
            if (particle && particle.position && particle.material) {
                const offset = i * 0.4;
                const height = (t * 0.4 + offset) % 2.5;
                particle.position.y = height;
                particle.position.x = Math.sin(t + i) * 0.15;
                particle.position.z = Math.cos(t + i) * 0.15;
                particle.material.opacity = Math.max(0, 1 - height / 2.5) * 0.6;
                particle.scale.setScalar(1 + height * 0.3);
            }
        });
    });

    return (
        <group ref={steamRef} position={[0, 1, 0]}>
            {[...Array(12)].map((_, i) => (
                <mesh key={i}>
                    <sphereGeometry args={[0.12, 16, 16]} />
                    <meshStandardMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.4}
                        roughness={1}
                        emissive="#ffffff"
                        emissiveIntensity={0.2}
                    />
                </mesh>
            ))}
        </group>
    );
}

// Qəhvə Dənələri Spiral
function CoffeeBeansSpiral() {
    const groupRef = useRef();

    useFrame((state) => {
        if (!groupRef.current) return;
        groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;
    });

    const beans = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 4;
            const radius = 1.8 + Math.sin(i * 0.5) * 0.3;
            const height = (i / 20) * 2 - 1;
            temp.push({
                position: [
                    Math.cos(angle) * radius,
                    height,
                    Math.sin(angle) * radius
                ],
                rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
                scale: 0.8 + Math.random() * 0.4
            });
        }
        return temp;
    }, []);

    return (
        <group ref={groupRef}>
            {beans.map((bean, i) => (
                <Float key={i} speed={1.5 + i * 0.1} rotationIntensity={0.8} floatIntensity={0.3}>
                    <mesh
                        position={bean.position}
                        rotation={bean.rotation}
                        scale={bean.scale}
                        castShadow
                    >
                        {/* Qəhvə dənəsi forması */}
                        <sphereGeometry args={[0.18, 32, 32]} />
                        <meshStandardMaterial
                            color="#3d2817"
                            roughness={0.7}
                            metalness={0.1}
                            normalScale={[0.5, 0.5]}
                        />
                    </mesh>
                </Float>
            ))}
        </group>
    );
}

// Dekorativ Elementlər
function DecorativeElements() {
    return (
        <>
            {/* Sparkles */}
            <Sparkles
                count={50}
                scale={5}
                size={2}
                speed={0.3}
                opacity={0.6}
                color="#d4af37"
            />

            {/* Ambient particles */}
            {[...Array(8)].map((_, i) => (
                <Float key={i} speed={2 + i * 0.3} rotationIntensity={0.5}>
                    <Sphere
                        args={[0.05, 16, 16]}
                        position={[
                            (Math.random() - 0.5) * 4,
                            (Math.random() - 0.5) * 3,
                            (Math.random() - 0.5) * 4
                        ]}
                    >
                        <meshStandardMaterial
                            color="#4d8b55"
                            emissive="#4d8b55"
                            emissiveIntensity={0.5}
                            transparent
                            opacity={0.3}
                        />
                    </Sphere>
                </Float>
            ))}
        </>
    );
}

// Əsas Premium 3D Səhnə
export default function CoffeeScene3D() {
    return (
        <div style={{ width: '100%', height: '600px', borderRadius: '20px', overflow: 'hidden' }}>
            <Canvas
                shadows
                camera={{ position: [0, 0, 6], fov: 45 }}
                gl={{
                    antialias: true,
                    alpha: true,
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.2
                }}
            >
                {/* Premium İşıqlandırma */}
                <ambientLight intensity={0.3} />

                {/* Ana işıq */}
                <spotLight
                    position={[5, 5, 5]}
                    angle={0.4}
                    penumbra={1}
                    intensity={3}
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                    shadow-bias={-0.0001}
                    color="#ffffff"
                />

                {/* Arxa işıq */}
                <spotLight
                    position={[-5, 3, -3]}
                    angle={0.5}
                    penumbra={1}
                    intensity={2}
                    color="#4d8b55"
                />

                {/* Yan işıq */}
                <pointLight position={[3, -2, 3]} intensity={1.5} color="#d4af37" />
                <pointLight position={[-3, 2, -2]} intensity={1} color="#ffffff" />

                {/* 3D Obyektlər */}
                <PremiumCoffeeCup />
                <CoffeeBeansSpiral />
                <DecorativeElements />

                {/* Mühit */}
                <Environment preset="city" />

                {/* Kontakt kölgələri */}
                <ContactShadows
                    position={[0, -1.8, 0]}
                    opacity={0.5}
                    scale={10}
                    blur={2}
                    far={4}
                />

                {/* Post-processing effektləri */}
                <EffectComposer>
                    <Bloom
                        intensity={0.5}
                        luminanceThreshold={0.8}
                        luminanceSmoothing={0.9}
                        height={300}
                    />
                    <ChromaticAberration
                        blendFunction={BlendFunction.NORMAL}
                        offset={[0.0005, 0.0005]}
                    />
                </EffectComposer>

                {/* Kontrol */}
                <OrbitControls
                    enableZoom={true}
                    enablePan={false}
                    minDistance={3}
                    maxDistance={10}
                    minPolarAngle={Math.PI / 4}
                    maxPolarAngle={Math.PI / 1.8}
                    autoRotate
                    autoRotateSpeed={0.3}
                    dampingFactor={0.05}
                    enableDamping
                />
            </Canvas>
        </div>
    );
}
