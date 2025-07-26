import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as CANNON from 'cannon-es'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Canvas
const canvas = document.getElementById('gameCanvas')

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0xa0e8af) // Ногоон background

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 5, 10)
camera.lookAt(0, 0, 0)

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
document.body.appendChild(renderer.domElement)

// Controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
directionalLight.position.set(5, 10, 7.5)
scene.add(directionalLight)

// Physics
const world = new CANNON.World()
world.gravity.set(0, -9.82, 0)

// Floor physics
const groundBody = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Plane(),
})
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
world.addBody(groundBody)

// Floor mesh
const groundGeo = new THREE.PlaneGeometry(20, 20)
const groundMat = new THREE.MeshStandardMaterial({ color: 0x888888 })
const ground = new THREE.Mesh(groundGeo, groundMat)
ground.rotation.x = -Math.PI / 2
scene.add(ground)

// GLTF loader
const loader = new GLTFLoader()
const objects = []

function spawnWatermelon() {
  loader.load('/models/watermelon.glb', (gltf) => {
    const model = gltf.scene
    model.scale.set(0.5, 0.5, 0.5)
    model.position.set((Math.random() - 0.5) * 5, 10, 0)
    scene.add(model)

    const shape = new CANNON.Sphere(0.5)
    const body = new CANNON.Body({
      mass: 1,
      shape: shape,
      position: new CANNON.Vec3(model.position.x, model.position.y, model.position.z),
    })
    world.addBody(body)

    objects.push({ mesh: model, body })
  })
}

// Click to spawn watermelon
window.addEventListener('click', () => {
  console.log('Spawned watermelon!')
  spawnWatermelon()
})

// Animate
function animate() {
  requestAnimationFrame(animate)
  world.step(1 / 60)

  controls.update()

  objects.forEach(({ mesh, body }) => {
    mesh.position.copy(body.position)
    mesh.quaternion.copy(body.quaternion)
  })

  renderer.render(scene, camera)
}

animate()