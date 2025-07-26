import * as THREE from 'three';

export class WatermelonManager {
  constructor(scene) {
    this.scene = scene;
    this.watermelons = [];
    this.spawnTimer = 0;
    this.spawnInterval = 2.0;
  }
  
  createWatermelon(position) {
    const watermelon = new THREE.Group();
    const geometry = new THREE.SphereGeometry(0.8, 16, 12);
    const exteriorMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5436 });
    const exterior = new THREE.Mesh(geometry, exteriorMaterial);
    
    for (let i = 0; i < 8; i++) {
      const stripeGeometry = new THREE.SphereGeometry(0.81, 16, 12, 0, Math.PI * 2, i / 8 * Math.PI, 0.1);
      const stripeMaterial = new THREE.MeshLambertMaterial({ color: 0x4a7c59 });
      const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      watermelon.add(stripe);
    }
    
    watermelon.add(exterior);
    watermelon.velocity = new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 3 + 2, (Math.random() - 0.5) * 2);
    watermelon.angularVelocity = new THREE.Vector3((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
    watermelon.position.copy(position);
    watermelon.isSliced = false;
    watermelon.age = 0;
    
    this.scene.add(watermelon);
    this.watermelons.push(watermelon);
    return watermelon;
  }
  
  createWatermelonSlice(position, velocity) {
    const slice = new THREE.Group();
    const geometry = new THREE.SphereGeometry(0.8, 16, 12, 0, Math.PI);
    const fleshMaterial = new THREE.MeshLambertMaterial({ color: 0xff4757 });
    const flesh = new THREE.Mesh(geometry, fleshMaterial);
    slice.add(flesh);
    
    const rindGeometry = new THREE.SphereGeometry(0.82, 16, 12, 0, Math.PI, Math.PI * 0.8, Math.PI * 0.2);
    const rindMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5436 });
    const rind = new THREE.Mesh(rindGeometry, rindMaterial);
    slice.add(rind);
    
    for (let i = 0; i < 8; i++) {
      const seedGeometry = new THREE.SphereGeometry(0.05, 6, 6);
      const seedMaterial = new THREE.MeshLambertMaterial({ color: 0x2c2c54 });
      const seed = new THREE.Mesh(seedGeometry, seedMaterial);
      seed.position.set((Math.random() - 0.5) * 1.2, Math.random() * 0.4, (Math.random() - 0.5) * 1.2);
      slice.add(seed);
    }
    
    slice.position.copy(position);
    slice.velocity = velocity.clone();
    slice.angularVelocity = new THREE.Vector3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    slice.age = 0;
    slice.isSlice = true;
    
    this.scene.add(slice);
    this.watermelons.push(slice);
    return slice;
  }
  
  checkSlice(startWorld, endWorld) {
    const slicedMelons = [];
    
    for (let i = this.watermelons.length - 1; i >= 0; i--) {
      const melon = this.watermelons[i];
      if (melon.isSliced || melon.isSlice) continue;
      
      const melonPos = melon.position;
      const distance = this.distanceToLine(melonPos, startWorld, endWorld);
      if (distance < 1.0) {
        this.sliceWatermelon(melon, i);
        slicedMelons.push(melon);
      }
    }
    
    return slicedMelons;
  }
  
  distanceToLine(point, lineStart, lineEnd) {
    const line = lineEnd.clone().sub(lineStart);
    const pointToStart = point.clone().sub(lineStart);
    const t = Math.max(0, Math.min(1, pointToStart.dot(line) / line.lengthSq()));
    const projection = lineStart.clone().add(line.multiplyScalar(t));
    return point.distanceTo(projection);
  }
  
  sliceWatermelon(melon, index) {
    const position = melon.position.clone();
    const slice1Velocity = melon.velocity.clone().add(new THREE.Vector3(-2, 1, 0));
    const slice2Velocity = melon.velocity.clone().add(new THREE.Vector3(2, 1, 0));
    
    this.createWatermelonSlice(position.clone().add(new THREE.Vector3(-0.5, 0, 0)), slice1Velocity);
    this.createWatermelonSlice(position.clone().add(new THREE.Vector3(0.5, 0, 0)), slice2Velocity);
    
    this.scene.remove(melon);
    this.watermelons.splice(index, 1);
    melon.isSliced = true;
  }
  
  update(deltaTime) {
    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      const spawnPos = new THREE.Vector3((Math.random() - 0.5) * 8, -5, (Math.random() - 0.5) * 4);
      this.createWatermelon(spawnPos);
    }
    
    for (let i = this.watermelons.length - 1; i >= 0; i--) {
      const melon = this.watermelons[i];
      melon.velocity.y -= 9.8 * deltaTime;
      melon.position.add(melon.velocity.clone().multiplyScalar(deltaTime));
      melon.rotation.x += melon.angularVelocity.x * deltaTime;
      melon.rotation.y += melon.angularVelocity.y * deltaTime;
      melon.rotation.z += melon.angularVelocity.z * deltaTime;
      melon.age += deltaTime;
      
      if (melon.age > 10 || melon.position.y < -10) {
        this.scene.remove(melon);
        this.watermelons.splice(i, 1);
      }
    }
  }
}