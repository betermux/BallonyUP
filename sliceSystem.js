import * as THREE from 'three';

export class SliceSystem {
  constructor(camera, watermelonManager, scene) {
    this.camera = camera;
    this.watermelonManager = watermelonManager;
    this.scene = scene;
    this.trailPoints = [];
    this.trail = new THREE.Group();
    this.scene.add(this.trail);
    this.maxTrailLength = 10;
  }

  addPoint(screenX, screenY, renderer) {
    const vector = new THREE.Vector3(
      (screenX / window.innerWidth) * 2 - 1,
      -(screenY / window.innerHeight) * 2 + 1,
      0.5
    );
    vector.unproject(this.camera);

    const dir = vector.sub(this.camera.position).normalize();
    const distance = -this.camera.position.z / dir.z;
    const worldPos = this.camera.position.clone().add(dir.multiplyScalar(distance));

    this.trailPoints.push(worldPos);
    if (this.trailPoints.length > this.maxTrailLength) {
      this.trailPoints.shift();
    }

    this.drawTrail();

    if (this.trailPoints.length >= 2) {
      const start = this.trailPoints[this.trailPoints.length - 2];
      const end = this.trailPoints[this.trailPoints.length - 1];
      const sliced = this.watermelonManager.checkSlice(start, end);
      return sliced.length;
    }

    return 0;
  }

  drawTrail() {
    while (this.trail.children.length > 0) {
      this.trail.remove(this.trail.children[0]);
    }

    const material = new THREE.LineBasicMaterial({ color: 0xffffff });
    const geometry = new THREE.BufferGeometry().setFromPoints(this.trailPoints);
    const line = new THREE.Line(geometry, material);
    this.trail.add(line);
  }

  clearTrail() {
    this.trailPoints = [];
    while (this.trail.children.length > 0) {
      this.trail.remove(this.trail.children[0]);
    }
  }
}