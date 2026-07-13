import React, { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";

const CoffeeModel = ({ scale }) => {
    const { scene } = useGLTF("/assets/14.gltf");
    const modelRef = useRef();

    useFrame((state) => {
        if (modelRef.current) {
            // Yavaş fırlanma
            modelRef.current.rotation.y += 0.005;
            // Yuxarı-aşağı hərəkət
            modelRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        }
    });

    return (
        <primitive
            ref={modelRef}
            object={scene}
            scale={scale}
            position={[0, 0, 0]}
        />
    );
};

const CoffeeScene3D = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const modelScale = isMobile ? 0.4 : 0.5;
    const containerSize = isMobile ? "280px" : "500px";

    return (
        <div style={{ width: containerSize, height: containerSize }}>
            <Canvas
                camera={{ position: [0, 0, 5], fov: 45 }}
                style={{ background: "transparent" }}
            >
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <pointLight position={[-5, 5, -5]} intensity={0.5} color="#4d8b55" />
                <Suspense fallback={null}>
                    <CoffeeModel scale={modelScale} />
                    <Environment preset="city" />
                </Suspense>
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate={false}
                    maxPolarAngle={Math.PI / 2}
                    minPolarAngle={Math.PI / 3}
                />
            </Canvas>
        </div>
    );
};

export default CoffeeScene3D;

