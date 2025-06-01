'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Game3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const characterRef = useRef<THREE.Mesh | null>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x87CEEB); // Sky blue background
    mountRef.current.appendChild(renderer.domElement);

    // Store refs
    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Create character (simple colored cube)
    const characterGeometry = new THREE.BoxGeometry(1, 2, 1);
    const characterMaterial = new THREE.MeshLambertMaterial({ color: 0xff6b6b });
    const character = new THREE.Mesh(characterGeometry, characterMaterial);
    character.position.y = 1; // Place on ground
    scene.add(character);
    characterRef.current = character;

    // Add some environment objects
    for (let i = 0; i < 10; i++) {
      const treeGeometry = new THREE.CylinderGeometry(0.5, 0.5, 4);
      const treeMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
      const tree = new THREE.Mesh(treeGeometry, treeMaterial);
      
      tree.position.x = (Math.random() - 0.5) * 80;
      tree.position.z = (Math.random() - 0.5) * 80;
      tree.position.y = 2;
      scene.add(tree);
    }

    // Event listeners
    const handleKeyDown = (event: KeyboardEvent) => {
      keysRef.current[event.code] = true;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keysRef.current[event.code] = false;
    };

    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);

    // Animation loop
    const moveSpeed = 0.15;
    
    const animate = () => {
      requestAnimationFrame(animate);

      if (!characterRef.current || !cameraRef.current) return;

      const character = characterRef.current;
      const camera = cameraRef.current;
      const keys = keysRef.current;

      // Simple movement - always relative to world directions
      if (keys['KeyW'] || keys['ArrowUp']) {
        character.position.z -= moveSpeed; // Move forward (negative Z)
      }
      if (keys['KeyS'] || keys['ArrowDown']) {
        character.position.z += moveSpeed; // Move backward (positive Z)
      }
      if (keys['KeyA'] || keys['ArrowLeft']) {
        character.position.x -= moveSpeed; // Move left (negative X)
      }
      if (keys['KeyD'] || keys['ArrowRight']) {
        character.position.x += moveSpeed; // Move right (positive X)
      }

      // Static camera that follows player from behind and above
      const cameraOffset = new THREE.Vector3(0, 6, 10);// Behind and above
      camera.position.copy(character.position).add(cameraOffset);
      
      
      // Always look at the character
      camera.lookAt(character.position);

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      <div 
        ref={mountRef} 
        className="w-full h-full"
      />
      <div className="absolute top-4 left-4 text-white z-10 bg-black bg-opacity-50 p-3 rounded">
        <div>Use WASD or Arrow Keys to move</div>
        <div>W = Forward, S = Backward, A = Left, D = Right</div>
        <div>Static bird's eye view camera</div>
      </div>
    </div>
  );
}