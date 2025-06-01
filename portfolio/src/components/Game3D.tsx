'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function Game3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const characterRef = useRef<THREE.Mesh | null>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const velocityRef = useRef({ x: 0, y: 0, z: 0 });
  const isJumpingRef = useRef(false);
  
  //interaction with objects
  const interactiveObjectsRef = useRef<Array<{ mesh: THREE.Mesh, info: any }>>([]);
  const [currentInfo, setCurrentInfo] = useState<any>(null);
  const [showInfo, setShowInfo] = useState(false);


  // Sample interactive object data
const sampleData = {
  title: "Welcome! 👋",
  content: "This is a test interactive object. You're close enough to read this message!",
  color: 0xFFD700
};


  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xFFA500); // Orange background
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
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x88e788 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Create character (jumping cube)
    const characterGeometry = new THREE.BoxGeometry(1, 1, 1);
    const characterMaterial = new THREE.MeshLambertMaterial({ color: 'white' });
    const character = new THREE.Mesh(characterGeometry, characterMaterial);
    character.position.y = 0.5; // Half of cube height above ground
    scene.add(character);
    characterRef.current = character;


    const testGeometry = new THREE.BoxGeometry(1, 1, 1);
const testMaterial = new THREE.MeshLambertMaterial({ color: sampleData.color });
const testObject = new THREE.Mesh(testGeometry, testMaterial);
testObject.position.set(5, 0.5, 5); // Position it near the character
scene.add(testObject);

// Add to interactive objects array
interactiveObjectsRef.current = [{ mesh: testObject, info: sampleData }];

    
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
    const moveSpeed = 0.12;
    const jumpPower = 0.25;
    const gravity = -0.015;
    const groundLevel = 0.5; // Half of cube height
    
    const animate = () => {
      requestAnimationFrame(animate);

      if (!characterRef.current || !cameraRef.current) return;

      const character = characterRef.current;
      const camera = cameraRef.current;
      const keys = keysRef.current;
      const velocity = velocityRef.current;

      // Horizontal movement
      if (keys['KeyW'] || keys['ArrowUp']) {
        character.position.z -= moveSpeed;
      }
      if (keys['KeyS'] || keys['ArrowDown']) {
        character.position.z += moveSpeed;
      }
      if (keys['KeyA'] || keys['ArrowLeft']) {
        character.position.x -= moveSpeed;
      }
      if (keys['KeyD'] || keys['ArrowRight']) {
        character.position.x += moveSpeed;
      }

      // Jump mechanics
      if ((keys['Space'] && !isJumpingRef.current && character.position.y <= groundLevel + 0.01)) {
        velocity.y = jumpPower;
        isJumpingRef.current = true;
      }

      // Apply gravity
      if (character.position.y > groundLevel || velocity.y > 0) {
        velocity.y += gravity;
        character.position.y += velocity.y;
        
        // Land on ground
        if (character.position.y <= groundLevel) {
          character.position.y = groundLevel;
          velocity.y = 0;
          isJumpingRef.current = false;
        }
      }

      // Simple movement animation - slight rotation when moving
      const isMovingHorizontally = keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'] ||
                                   keys['ArrowUp'] || keys['ArrowDown'] || keys['ArrowLeft'] || keys['ArrowRight'];
      
      if (isMovingHorizontally) {
        character.rotation.x += 0.1;
        character.rotation.z += 0.05;
      }

      // Check interactions with objects
        let nearObject = null;
        interactiveObjectsRef.current.forEach(({ mesh, info }) => {
        const distance = character.position.distanceTo(mesh.position);
        if (distance < 2.5) {
            nearObject = info;
            // Add glowing effect
            if (mesh.material instanceof THREE.MeshLambertMaterial) {
            mesh.material.emissive.setHex(0x333333);
            }
        } else {
            // Remove glowing effect
            if (mesh.material instanceof THREE.MeshLambertMaterial) {
            mesh.material.emissive.setHex(0x000000);
            }
        }
        });

// Update info display
if (nearObject !== currentInfo) {
  setCurrentInfo(nearObject);
  setShowInfo(!!nearObject);
}

      // Camera positioned behind and above the cube
      const cameraOffset = new THREE.Vector3(0, 6, 10);
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
    
    <div style={{
      position: 'absolute',
      top: '16px',
      left: '16px',
      backgroundColor: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '16px',
      borderRadius: '8px',
      zIndex: 100
    }}>
      <div>Use WASD or Arrow Keys to move</div>
      <div>SPACE to jump</div>
      <div>Simple cube physics!</div>
    </div>

    {showInfo && currentInfo && (
      <div style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        width: '320px',
        backgroundColor: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '24px',
        borderRadius: '8px',
        border: '1px solid white',
        zIndex: 100
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', color: '#ffd700' }}>
          {currentInfo.title}
        </h3>
        <p style={{ marginBottom: '16px' }}>{currentInfo.content}</p>
        <div style={{ fontSize: '12px', color: '#ccc' }}>
          Move away to close this info panel
        </div>
      </div>
    )}
  </div>
);



}