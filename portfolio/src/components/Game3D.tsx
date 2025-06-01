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
  const lastInfoRef = useRef<any>(null);

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

    /// Load Desk  model
    loader.load('/low_poly_computer_desk.glb', (gltf) => {
      const desk = gltf.scene;
      desk.position.set(-20, 0, -45); 
      desk.scale.set(0.05, 0.05, 0.05);
      desk.rotation.y = 0;
      scene.add(desk);
    });

    // Create Project Area
    const projectAreaX = 35;
    const projectAreaZ = 35;

    // Create clean, minimal floor area
    const projectFloorGeometry = new THREE.PlaneGeometry(40, 30);
    const projectFloorMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x1a1a1a,
      transparent: true,
      opacity: 0.3
    });
    const projectFloor = new THREE.Mesh(projectFloorGeometry, projectFloorMaterial);
    projectFloor.rotation.x = -Math.PI / 2;
    projectFloor.position.set(projectAreaX, 0.01, projectAreaZ);
    scene.add(projectFloor);

    // Clean, minimal project data
    const cleanProjectData = [
      {
        title: "E-Commerce Platform",
        year: "2024",
        tech: ["React", "Node.js", "MongoDB"],
        description: "Full-stack e-commerce solution with real-time inventory and payment processing",
        color: 0x4A90E2,
        position: { x: projectAreaX - 12, z: projectAreaZ + 8 } // Changed from -8 to +8
      },
      {
        title: "Mobile Game",
        year: "2023", 
        tech: ["Unity", "C#", "Firebase"],
        description: "Cross-platform puzzle game with 10k+ downloads",
        color: 0xF5A623,
        position: { x: projectAreaX, z: projectAreaZ + 10 } // Changed from -10 to +10
      },
      {
        title: "AI Assistant",
        year: "2024",
        tech: ["React", "OpenAI", "Python"],
        description: "Conversational AI with voice recognition and context awareness",
        color: 0x7ED321,
        position: { x: projectAreaX + 12, z: projectAreaZ + 8 } // Changed from -8 to +8
      }
    ];

    // Create minimal, floating project cards
    cleanProjectData.forEach((project, index) => {
      // Create main card (simple, clean geometry)
      const cardGeometry = new THREE.PlaneGeometry(8, 5);
      
      // Create text canvas (minimal, clean typography)
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 320;
      const context = canvas.getContext('2d')!;

      // Clean background
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, 512, 320);
      
      // Subtle border
      context.strokeStyle = '#e0e0e0';
      context.lineWidth = 2;
      context.strokeRect(1, 1, 510, 318);

      // Project title (clean, modern font)
      context.fillStyle = '#1a1a1a';
      context.font = 'bold 32px system-ui, -apple-system, sans-serif';
      context.textAlign = 'left';
      context.fillText(project.title, 30, 60);

      // Year
      context.fillStyle = '#666666';
      context.font = '20px system-ui, -apple-system, sans-serif';
      context.fillText(project.year, 30, 90);

      // Tech stack (minimal pills)
      context.fillStyle = '#f5f5f5';
      let techX = 30;
      project.tech.forEach((tech, i) => {
        const metrics = context.measureText(tech);
        const pillWidth = metrics.width + 20;
        
        // Pill background
        context.fillStyle = '#f5f5f5';
        context.beginPath();
        context.roundRect(techX, 110, pillWidth, 25, 12);
        context.fill();
        
        // Pill text
        context.fillStyle = '#333333';
        context.font = '14px system-ui, -apple-system, sans-serif';
        context.fillText(tech, techX + 10, 128);
        
        techX += pillWidth + 10;
      });

      // Description
      context.fillStyle = '#333333';
      context.font = '16px system-ui, -apple-system, sans-serif';
      context.textAlign = 'left';
      
      // Simple word wrap
      const words = project.description.split(' ');
      let line = '';
      let y = 180;
      
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        
        if (metrics.width > 450 && n > 0) {
          context.fillText(line, 30, y);
          line = words[n] + ' ';
          y += 24;
        } else {
          line = testLine;
        }
      }
      context.fillText(line, 30, y);

      const texture = new THREE.CanvasTexture(canvas);
      const cardMaterial = new THREE.MeshBasicMaterial({ 
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      });
      
      const card = new THREE.Mesh(cardGeometry, cardMaterial);
      card.position.set(project.position.x, 3 + index * 0.1, project.position.z);
      card.rotation.y = Math.PI; // Add this line to rotate 180 degrees
      card.castShadow = true;
      scene.add(card);

      // Minimal interaction indicator (small, subtle dot)
      const indicatorGeometry = new THREE.CircleGeometry(0.15, 16);
      const indicatorMaterial = new THREE.MeshBasicMaterial({ 
        color: project.color,
        transparent: true,
        opacity: 0.8
      });
      const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
      indicator.position.set(project.position.x, 0.1, project.position.z - 3); // Changed from +3 to -3
      indicator.rotation.x = -Math.PI / 2;
      scene.add(indicator);

      // Very subtle ambient light
      const projectLight = new THREE.PointLight(project.color, 0.3, 12);
      projectLight.position.set(project.position.x, 5, project.position.z);
      scene.add(projectLight);

      // Add to interactive objects
      interactiveObjects.push({
        mesh: indicator,
        info: {
          title: project.title + " (" + project.year + ")",
          content: project.description + ". Built with: " + project.tech.join(", "),
          color: project.color
        }
      });
    });

    // Minimal area label (very subtle)
    const createMinimalSign = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 100;
      const context = canvas.getContext('2d')!;

      // Flip the canvas horizontally to counteract the rotation
      context.scale(-1, 1);
      context.translate(-400, 0);

      context.fillStyle = 'rgba(255,255,255,0.95)';
      context.fillRect(0, 0, 400, 100);
      
      context.fillStyle = '#1a1a1a';
      context.font = '24px system-ui, -apple-system, sans-serif';
      context.textAlign = 'center';
      context.fillText('Projects', 200, 60);

      const texture = new THREE.CanvasTexture(canvas);
      
      const signGeometry = new THREE.PlaneGeometry(6, 1.5);
      const signMaterial = new THREE.MeshBasicMaterial({ 
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      });
      
      const sign = new THREE.Mesh(signGeometry, signMaterial);
      sign.position.set(projectAreaX - 15, 2, projectAreaZ - 10);
      sign.rotation.y = Math.PI; // Keep the rotation
      scene.add(sign);

      return sign;
    };

    const projectsSign = createMinimalSign();

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

    // Create floating "ABOUT ME" text sign above alleyway
    const createFloatingTextSign = () => {
      // Create canvas for text
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const context = canvas.getContext('2d')!;

      // Clear and set background
      context.fillStyle = '#2c3e50'; // Dark blue background
      context.fillRect(0, 0, 512, 128);
      
      // Add border
      context.strokeStyle = '#ffffff';
      context.lineWidth = 4;
      context.strokeRect(4, 4, 504, 120);

      // Draw text
      context.fillStyle = '#ffffff'; // White text
      context.font = 'bold 40px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('ABOUT ME', 256, 64);

      // Create texture
      const texture = new THREE.CanvasTexture(canvas);
      
      // Create floating sign
      const signGeometry = new THREE.PlaneGeometry(10, 2.5);
      const signMaterial = new THREE.MeshBasicMaterial({ 
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      });
      
      const floatingSign = new THREE.Mesh(signGeometry, signMaterial);
      floatingSign.position.set(-25, 10, -45); // High above the alleyway
      scene.add(floatingSign);

      // Add glow effect
      const glowGeometry = new THREE.PlaneGeometry(11, 3);
      const glowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ff88,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.set(-25, 10, -45.1);
      scene.add(glow);

      // Add light
      const signLight = new THREE.PointLight(0x00ff88, 2, 20);
      signLight.position.set(-25, 10, -43);
      scene.add(signLight);

      return { sign: floatingSign, glow: glow };
    };

    const { sign: aboutMeSign, glow: signGlow } = createFloatingTextSign();

    interactiveObjects.push({ 
      mesh: lightOrb, 
      info: { 
        title: "Melbourne, Australia 🇦🇺", 
        content: "Currently based in Melbourne, I offer both remote and in-person collaboration opportunities. With access to Australia's vibrant tech ecosystem, I bring a global perspective to local and international projects.",
        color: 0x00FFFF 
      }
    });

    interactiveObjectsRef.current = interactiveObjects;

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
    const moveSpeed = 0.15;    
    const jumpPower = 0.8;    
    const gravity = -0.04;    
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
        character.rotation.x += 0.2;
        character.rotation.z += 0.10;
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

      // Animate the floating About Me sign (gentle rotation)
      aboutMeSign.rotation.y = Math.sin(Date.now() * 0.001) * 0.1;
      signGlow.rotation.y = Math.sin(Date.now() * 0.001) * 0.1;

      // Minimal, subtle animations
      projectsSign.rotation.y = Math.sin(Date.now() * 0.0003) * 0.02;
      

      // Very subtle card floating
      interactiveObjectsRef.current.forEach((obj, index) => {
        if (obj.info.title?.includes('E-Commerce') || obj.info.title?.includes('Mobile') || obj.info.title?.includes('AI')) {
          obj.mesh.position.y = 0.1 + Math.sin(Date.now() * 0.001 + index) * 0.05;
        }
      });

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
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Info Panel */}
      {showInfo && currentInfo && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          maxWidth: '90vw',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          color: '#333',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: '2px solid #e0e0e0',
          zIndex: 1000,
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            marginBottom: '20px', 
            color: '#2c3e50',
            textAlign: 'center',
            lineHeight: '1.2'
          }}>
            {currentInfo.title}
          </h2>
          
          <p style={{ 
            fontSize: '18px',
            lineHeight: '1.6',
            marginBottom: '24px',
            color: '#555',
            textAlign: 'center'
          }}>
            {currentInfo.content}
          </p>
          
          <div style={{ 
            fontSize: '14px', 
            color: '#888',
            textAlign: 'center',
            fontStyle: 'italic'
          }}>
            Move away to close this panel
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        color: 'white',
        background: 'rgba(0,0,0,0.7)',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'monospace'
      }}>
        <div>Click to look around</div>
        <div>WASD to move, SPACE to jump</div>
      </div>
    </div>
  );
}