import * as THREE from "three";
THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);
export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
export const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
export const cnv = renderer.domElement;
camera.position.y = 8;
const globeGeo = new THREE.SphereGeometry(1, 64, 16);
const globeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
const globe = new THREE.Mesh(globeGeo, globeMat);
scene.add(globe);
export function render() {
    renderer.render(scene, camera);
}
export { globe as object };
