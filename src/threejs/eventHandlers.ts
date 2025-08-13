import * as THREE from 'three';
import { zoneLines, canvas, scene, renderer, camera, controls, raycaster, zoneVertices, xzVertices, updateExtrinsics, highlighter } from './index.ts';
import { createLine, resetZone, updatePointColors, worldToLocalCoordinates } from "./utils"

export const MAX_RANGE = 200; // 200m for OS-1-128
export const NUM_VERTICES = 4;

export function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const aspect = width / height;
  renderer.setSize(width, height, false);
  
  // Perspective camera
  camera.aspect = aspect;

  // Orthographic camera
  // const viewSize = 50;
  // camera.left = -aspect * viewSize / 2;
  // camera.right = aspect * viewSize / 2;
  // camera.top = viewSize / 2;
  // camera.bottom = -viewSize / 2;

  camera.updateProjectionMatrix();
  controls.update();
}

window.addEventListener('click', (event: MouseEvent) => {
  const mode = localStorage.getItem('mode');
  if (mode === null || mode !== 'edit') return;

  if (zoneVertices.length >= NUM_VERTICES) return; // Stop after 4 points

  const rect = renderer.domElement.getBoundingClientRect();
  const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

  const intersects = raycaster.intersectObject(highlighter.invisiblePlane);
  if (intersects.length === 0) return;

  const point = intersects[0].point.clone();
  
  // Transform the world coordinate point to local coordinates for xzVertices
  const [localX, localZ] = worldToLocalCoordinates(point.x, point.z);
  xzVertices.push([localX, localZ]);

  // Add the box
  const boxSize = 0.2;
  const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
  const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.position.copy(point);
  scene.add(box);
  zoneVertices.push(box);

  // Draw a line to the previous point
  if (zoneVertices.length > 1) {
    const prev = zoneVertices[zoneVertices.length - 2].position;
    const line = createLine(prev, point);
    scene.add(line);
    zoneLines.push(line);
  }

  // Close the loop if this is the 4th point
  if (zoneVertices.length === NUM_VERTICES) {
    const line = createLine(zoneVertices[3].position, zoneVertices[0].position);
    scene.add(line);
    zoneLines.push(line);

    localStorage.removeItem('mode');
    updatePointColors(); // Update point colors when zone is complete
  }
});

window.addEventListener('mousemove', (event: MouseEvent) => {
  const mode = localStorage.getItem('mode');
  if (mode === null || mode !== 'highlight') return;

  // Raycasting to find intersection with the plane
  const rect = renderer.domElement.getBoundingClientRect();
  const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

  const intersects = raycaster.intersectObject(highlighter.invisiblePlane);
  if (intersects.length === 0) return;

  const point = intersects[0].point.clone();

  // Move the highlight plane and cuboid to the new position
  highlighter.setPosition(point.x, point.z);
  
  // Update geometry to maintain consistent screen size
  highlighter.updateGeometry(camera);
  
  // Get vertices from highlighter.highlightPlane after it's been positioned and resized
  const planePosition = highlighter.highlightPlane.position;
  const radius = highlighter.HIGHLIGHT_RADIUS; // This is now the dynamic radius
  
  // Transform zone vertices from world coordinates to point cloud local coordinates
  const worldVertices = [
    [planePosition.x - radius, planePosition.z + radius],
    [planePosition.x + radius, planePosition.z + radius],
    [planePosition.x + radius, planePosition.z - radius],
    [planePosition.x - radius, planePosition.z - radius]
  ];
  
  for (let i = 0; i < 4; i++) {
    const [localX, localZ] = worldToLocalCoordinates(worldVertices[i][0], worldVertices[i][1]);
    xzVertices[i] = [localX, localZ];
  }
  
  updatePointColors(); // Update point colors when highlight moves
  
})

document.getElementById("rezoneButton")?.addEventListener('click', (e) => {
  e.stopPropagation();
  localStorage.setItem('mode', 'edit');
  resetZone();
})

document.getElementById("highlightButton")?.addEventListener('click', (e: MouseEvent) => {
  e.stopPropagation();

  const button = e.target as HTMLElement;

  if (localStorage.getItem('mode') === 'highlight') {
    localStorage.removeItem('mode');
    button.innerHTML = 'Highlight';
  }

  else {
    localStorage.setItem('mode', 'highlight');
    button.innerHTML = 'Cancel';
  }

  resetZone();
})

document.addEventListener('DOMContentLoaded', () => {
  const txSlider = document.getElementById('tx-slider') as HTMLInputElement;
  const tySlider = document.getElementById('ty-slider') as HTMLInputElement;
  const tzSlider = document.getElementById('tz-slider') as HTMLInputElement;
  const rxSlider = document.getElementById('rx-slider') as HTMLInputElement;
  const rySlider = document.getElementById('ry-slider') as HTMLInputElement;
  const rzSlider = document.getElementById('rz-slider') as HTMLInputElement;
  
  const txInput = document.getElementById('tx-input') as HTMLInputElement;
  const tyInput = document.getElementById('ty-input') as HTMLInputElement;
  const tzInput = document.getElementById('tz-input') as HTMLInputElement;
  const rxInput = document.getElementById('rx-input') as HTMLInputElement;
  const ryInput = document.getElementById('ry-input') as HTMLInputElement;
  const rzInput = document.getElementById('rz-input') as HTMLInputElement;
  
  const resetButton = document.getElementById('reset-extrinsics') as HTMLButtonElement;

  // Load saved values from localStorage
  function loadSavedValues() {
    const savedExtrinsics = localStorage.getItem('extrinsics');
    if (savedExtrinsics) {
      try {
        const data = JSON.parse(savedExtrinsics);
        txSlider.value = data.translation.x.toString();
        tySlider.value = data.translation.y.toString();
        tzSlider.value = data.translation.z.toString();
        rxSlider.value = data.rotation.x.toString();
        rySlider.value = data.rotation.y.toString();
        rzSlider.value = data.rotation.z.toString();
        
        txInput.value = data.translation.x.toString();
        tyInput.value = data.translation.y.toString();
        tzInput.value = data.translation.z.toString();
        rxInput.value = data.rotation.x.toString();
        ryInput.value = data.rotation.y.toString();
        rzInput.value = data.rotation.z.toString();
      } catch (e) {
        console.warn('Failed to parse saved extrinsics data:', e);
      }
    }
  }

  function updateExtrinsicsFromValues() {
    const translation = {
      x: parseFloat(txSlider.value),
      y: parseFloat(tySlider.value),
      z: parseFloat(tzSlider.value)
    };
    
    const rotation = {
      x: parseFloat(rxSlider.value),
      y: parseFloat(rySlider.value),
      z: parseFloat(rzSlider.value)
    };
    
    updateExtrinsics(translation, rotation);
  }

  function syncSliderToInput(slider: HTMLInputElement, input: HTMLInputElement) {
    const value = parseFloat(slider.value);
    input.value = value.toString();
    updateExtrinsicsFromValues();
  }

  function syncInputToSlider(input: HTMLInputElement, slider: HTMLInputElement) {
    let value = parseFloat(input.value);
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    
    // Clamp value to range
    if (isNaN(value)) value = 0;
    value = Math.max(min, Math.min(max, value));
    
    slider.value = value.toString();
    input.value = value.toString();
    updateExtrinsicsFromValues();
  }

  // Add event listeners for sliders
  txSlider.addEventListener('input', () => syncSliderToInput(txSlider, txInput));
  tySlider.addEventListener('input', () => syncSliderToInput(tySlider, tyInput));
  tzSlider.addEventListener('input', () => syncSliderToInput(tzSlider, tzInput));
  rxSlider.addEventListener('input', () => syncSliderToInput(rxSlider, rxInput));
  rySlider.addEventListener('input', () => syncSliderToInput(rySlider, ryInput));
  rzSlider.addEventListener('input', () => syncSliderToInput(rzSlider, rzInput));

  // Add event listeners for text inputs
  txInput.addEventListener('input', () => syncInputToSlider(txInput, txSlider));
  tyInput.addEventListener('input', () => syncInputToSlider(tyInput, tySlider));
  tzInput.addEventListener('input', () => syncInputToSlider(tzInput, tzSlider));
  rxInput.addEventListener('input', () => syncInputToSlider(rxInput, rxSlider));
  ryInput.addEventListener('input', () => syncInputToSlider(ryInput, rySlider));
  rzInput.addEventListener('input', () => syncInputToSlider(rzInput, rzSlider));

  // Reset button
  resetButton.addEventListener('click', () => {
    txSlider.value = '0';
    tySlider.value = '1';
    tzSlider.value = '0';
    rxSlider.value = '0';
    rySlider.value = '-2.5';
    rzSlider.value = '-4.5';
    
    txInput.value = '0';
    tyInput.value = '1';
    tzInput.value = '0';
    rxInput.value = '0';
    ryInput.value = '-2.5';
    rzInput.value = '-4.5';
    
    updateExtrinsicsFromValues();
  });

  // Load saved values and update display
  loadSavedValues();
  updateExtrinsicsFromValues();
});
