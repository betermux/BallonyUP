import * as THREE from 'three';
import { WatermelonManager } from './watermelon.js';
import { SliceSystem } from './sliceSystem.js';
import { ParticleSystem } from './particles.js';
import { GameUI } from './ui.js';

class WatermelonSlicerGame {
  constructor() {
    this.init();
    this.setupLighting();
    this.setupSystems();
    this.startGameLoop();
  }
  
  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x4a90a4);
    
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 2, 8);
    this.camera.lookAt(0, 0, 0);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);
    
    window.addEventListener('resize', () => this.onWindowResize(), false);
  }
  
  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
    
    const accentLight = new THREE.PointLight(0xff6b47, 0.4, 20);
    accentLight.position.set(-5, 5, 3);
    this.scene.add(accentLight);
  }
  
  setupSystems() {
    this.watermelonManager = new WatermelonManager(this.scene);
    this.sliceSystem = new SliceSystem(this.renderer.domElement);
    this.particleSystem = new ParticleSystem(this.scene);
    this.gameUI = new GameUI();
    
    this.sliceSystem.onSlice = (startWorld, endWorld) => {
      const slicedMelons = this.watermelonManager.checkSlice(startWorld, endWorld);
      if (slicedMelons.length > 0) {
        this.gameUI.addScore(slicedMelons.length * 10);
        slicedMelons.forEach(melon => {
          this.particleSystem.createJuiceSplash(melon.position);
        });
      }
    };
  }
  
  startGameLoop() {
    const animate = () => {
      requestAnimationFrame(animate);
      const deltaTime = 0.016;
      
      this.watermelonManager.update(deltaTime);
      this.sliceSystem.update(deltaTime, this.camera);
      this.particleSystem.update(deltaTime);
      this.gameUI.update(deltaTime);
      
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }
  
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

new WatermelonSlicerGame();