import * as THREE from 'three';

import { fetchJsonFile } from '@src/lib/utils';
import { POINTS_SIZE } from '@src/lib/constants';
import { resetZone } from './updators';
import { camera, controls, extrinsicsHelper, highlighter, pointCloud, raycaster, renderer, scene } from './World3D';
import {handleResize} from './eventHandlers';

export async function setup3js() {
  renderer.setPixelRatio(window.devicePixelRatio); // for retina displays
  camera.position.set(0, 30, 0);

  // Raycaster config
  raycaster.params.Points.threshold = 0.25;

  // Orbit controls
  controls.enableDamping = true; // smooth orbiting
  controls.dampingFactor = 0.05;
  // controls.screenSpacePanning = false;
  controls.maxPolarAngle = Math.PI / 2;

  // Helper to apply sensor extrinsics to point cloud and sensor wireframe
  extrinsicsHelper.name = 'extrinsics';
  const extrinsics = new THREE.Matrix4();
  extrinsics.set(
    1, 0, 0, 0,      // X row: rotation, translation X
    0, 1, 0, 0,  // Y row: rotation, translation Y
    0, 0, 1, 0,        // Z row: rotation, translation Z
    0, 0, 0, 1         // last row: homogeneous coordinate
  );
  extrinsicsHelper.applyMatrix4(extrinsics);
  scene.add(extrinsicsHelper);

  // Add point cloud
  const geometry = new THREE.BufferGeometry();
  const pointsData: number[] = await fetchJsonFile('data/points.json');
  const positions = new Float32Array(pointsData);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const reflectivityData: number[][] = await fetchJsonFile('data/reflectivity_rgb.json');
  const colors = new Float32Array(reflectivityData.flat());
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    // color: new THREE.Color(0, 1, 0),
    vertexColors: true,
    size: POINTS_SIZE,
    sizeAttenuation: true,  // Enable size attenuation for perspective camera
  });
  pointCloud.copy(new THREE.Points(geometry, material));
  extrinsicsHelper.add(pointCloud);

  // Voxelization
  const voxelSize = 2; // 2 meters
  const voxelGeometry = new THREE.BufferGeometry();
  const voxelPositions: number[] = [];
  for (let i = 0; i < positions.length; i += 3) {
    const x = Math.floor(positions[i] / voxelSize) * voxelSize + voxelSize / 2;
    const y = Math.floor(positions[i + 1] / voxelSize) * voxelSize + voxelSize / 2;
    const z = Math.floor(positions[i + 2] / voxelSize) * voxelSize + voxelSize / 2;
    voxelPositions.push(x, y, z);
  }
  const voxelPositionArray = new Float32Array(voxelPositions);
  voxelGeometry.setAttribute('position', new THREE.BufferAttribute(voxelPositionArray, 3));
  const voxelMaterial = new THREE.PointsMaterial({
    color: new THREE.Color(0, 1, 0),
    size: voxelSize,
  });
  const voxelPoints = new THREE.Points(voxelGeometry, voxelMaterial);
  voxelPoints.visible = true; // start with voxelization off
  // extrinsicsHelper.add(voxelPoints);
  // (document.getElementById('toggle-voxelization') as HTMLInputElement).onchange = (event) => {
  //   const target = event.target as HTMLInputElement;
  //   voxelPoints.visible = target.checked;
  // };

  // Sensor wireframe
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.position.set(0, 0, 0);
  extrinsicsHelper.add(box);
  box.visible = false;

  // Create a grid helper
  const size = 200;      // 400 meters wide
  const divisions = 100; // 2 meter per grid square
  const gridHelper = new THREE.GridHelper(size, divisions, 0xff0000, 0x3b3b3b);
  gridHelper.position.y = highlighter.PLANE_Y;  // position at the same Y level as before
  scene.add(gridHelper);

  resetZone();
  handleResize();
}


export function render3js() {
  controls.update(); // required if enableDamping is true
  controls.enabled = localStorage.getItem('mode') !== 'edit';
  renderer.render(scene, camera);
}
