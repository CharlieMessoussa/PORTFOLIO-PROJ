'use client';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

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
  const cameraAngleRef = useRef({ azimuth: 0, elevation: Math.PI / 4 });
  const pointerLockedRef = useRef(false);

  //interaction with objects
  const interactiveObjectsRef = useRef<Array<{ mesh: THREE.Mesh, info: any }>>([]);
  const [currentInfo, setCurrentInfo] = useState<any>(null);
  const [showInfo, setShowInfo] = useState(false);
  const lastInfoRef = useRef<any>(null); // <-- Add this


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
    character.position.set(-25, 0.51, -45); // Spawn inside the alleyway
    scene.add(character);
    characterRef.current = character;


    // Create multiple interactive objects
const interactiveObjects: Array<{ mesh: THREE.Mesh, info: any }> = [];


/// Load Melbourne alleyway model
const loader = new GLTFLoader();
loader.load('/melbourne.glb', (gltf) => {
  const melbourne = gltf.scene;
  melbourne.position.set(-25, 0, -45); // Edge of the world (adjust as needed)
  melbourne.scale.set(10, 10, 10);
  melbourne.rotation.y = -Math.PI / 2;
  scene.add(melbourne);
});



const orbGeometry = new THREE.SphereGeometry(0.3, 16, 16);
const orbMaterial = new THREE.MeshBasicMaterial({ 
  color: 0x00FFFF, // Cyan glow
  transparent: true,
  opacity: 0.8
});
const lightOrb = new THREE.Mesh(orbGeometry, orbMaterial);
lightOrb.position.set(-25, 2.0, -40); // At the alley entrance, higher up
scene.add(lightOrb);
    
// Add a point light to make it actually glow
const orbLight = new THREE.PointLight(0x00FFFF, 1, 10);
orbLight.position.set(-25, 2.0, -40); // Match the orb position
scene.add(orbLight);

interactiveObjects.push({ 
  mesh: lightOrb, 
  info: { 
    title: "Melbourne, Australia 🇦🇺", 
    content: "Melbourne is where I am currently based. Here I am able to work in person as well as remotely and WFH",
    color: 0x00FFFF 
  }
});

interactiveObjectsRef.current = interactiveObjects;

    
    // Add some environment objects
    for (let i = 0; i < 10; i++) {
      const treeGeometry = new THREE.CylinderGeometry(0.5, 0.5, 4);
      const treeMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
      const tree = new THREE.Mesh(treeGeometry, treeMaterial);
      
      /*
      tree.position.x = (Math.random() - 0.5) * 80;
      tree.position.z = (Math.random() - 0.5) * 80;
      tree.position.y = 2;
      scene.add(tree);
      */
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

    renderer.domElement.addEventListener('click', () => {
      renderer.domElement.requestPointerLock();
    });

    const handlePointerLockChange = () => {
      pointerLockedRef.current = document.pointerLockElement === renderer.domElement;
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);

    const handleMouseMove = (event: MouseEvent) => {
      if (!pointerLockedRef.current) return;
      const sensitivity = 0.002;
      cameraAngleRef.current.azimuth -= event.movementX * sensitivity;
      cameraAngleRef.current.elevation -= event.movementY * sensitivity;
      cameraAngleRef.current.elevation = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, cameraAngleRef.current.elevation));
    };

    document.addEventListener('mousemove', handleMouseMove);

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);

    // Animation loop
    const moveSpeed = 0.8;    
const jumpPower = 0.8;    // Increase from 0.45 to 0.8 for higher jumps
const gravity = -0.04;    // Increase from -0.02 to -0.04 for faster falling
const groundLevel = 0.5;
    
    const animate = () => {
      requestAnimationFrame(animate);

      if (!characterRef.current || !cameraRef.current) return;

      const character = characterRef.current;
      const camera = cameraRef.current;
      const keys = keysRef.current;
      const velocity = velocityRef.current;

      // Calculate movement direction relative to camera azimuth
const moveVector = new THREE.Vector3();
const moveForward = keys['KeyW'];
const moveBackward = keys['KeyS'];
const moveLeft = keys['KeyA'];
const moveRight = keys['KeyD'];

if (moveForward || moveBackward || moveLeft || moveRight) {
  // Forward: from character to camera, projected onto XZ plane and reversed
  const cameraToChar = new THREE.Vector3();
  cameraToChar.subVectors(character.position, camera.position);
  cameraToChar.y = 0;
  cameraToChar.normalize();

  // Right: perpendicular to forward on XZ plane
  const right = new THREE.Vector3(-cameraToChar.z, 0, cameraToChar.x);

  if (moveForward) moveVector.add(cameraToChar);
  if (moveBackward) moveVector.sub(cameraToChar);
  if (moveLeft) moveVector.sub(right);
  if (moveRight) moveVector.add(right);

  moveVector.normalize().multiplyScalar(moveSpeed);
  character.position.add(moveVector);
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

      // Simple movement animation 
      const isMovingHorizontally = keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'];
      
      if (isMovingHorizontally) {
        character.rotation.x += 0.2; // Increase from 0.1 to 0.3
        character.rotation.z += 0.10; // Increase from 0.05 to 0.15
      }

      // Check interactions with objects
      let nearObject: any = null;
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

      // Only update state if the info actually changed
      if (lastInfoRef.current !== nearObject) {
        lastInfoRef.current = nearObject;
        setCurrentInfo(nearObject);
        setShowInfo(!!nearObject);
      }

      // Camera orbit logic
const radius = 10;
const { azimuth, elevation } = cameraAngleRef.current;
const target = character.position.clone();
const camX = target.x + radius * Math.sin(elevation) * Math.sin(azimuth);
const camY = target.y + radius * Math.cos(elevation);
const camZ = target.z + radius * Math.sin(elevation) * Math.cos(azimuth);
camera.position.set(camX, camY, camZ);
camera.lookAt(target);

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('mousemove', handleMouseMove);
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