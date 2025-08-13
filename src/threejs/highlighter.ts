import * as THREE from "three";

export class Highlighter {
  static readonly CUBOID_HEIGHT = 200; // height of the cuboid in Y direction
  static readonly INVIS_PLANE_SIZE = 200; // size of the invisible plane. should match up with GridHelper size

  // Configurable parameters
  PLANE_Y = -1.0;
  HIGHLIGHT_RADIUS = 1.0; // Base radius - will be scaled based on camera distance
  SCREEN_SPACE_SIZE = 50; // Target size in pixels for consistent appearance
  
  // Three.js objects
  scene: THREE.Scene;
  invisiblePlane: THREE.Mesh;
  highlightPlane: THREE.Mesh;
  cuboid: THREE.Mesh;
  cuboidWireframe: THREE.LineSegments;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.invisiblePlane = this.createInvisiblePlane();
    this.scene.add(this.invisiblePlane);

    this.highlightPlane = this.createHighlightPlane();
    this.scene.add(this.highlightPlane);

    this.cuboid = this.createCuboid();
    this.scene.add(this.cuboid);

    this.cuboidWireframe = this.createCuboidWireframe(this.cuboid);
    this.scene.add(this.cuboidWireframe);
  }

  /**
   * Calculate the world-space radius needed to maintain consistent screen size
   */
  calculateWorldRadius(camera: THREE.Camera, worldPosition: THREE.Vector3): number {
    if (camera instanceof THREE.PerspectiveCamera) {
      // For perspective camera, scale based on distance
      const distance = camera.position.distanceTo(worldPosition);
      const fov = camera.fov * Math.PI / 180; // Convert to radians
      const screenHeight = 2 * Math.tan(fov / 2) * distance;
      return (this.SCREEN_SPACE_SIZE / window.innerHeight) * screenHeight;
    } else if (camera instanceof THREE.OrthographicCamera) {
      // For orthographic camera, use zoom
      const zoom = camera.zoom || 1;
      const screenHeight = (camera.top - camera.bottom) / zoom;
      return (this.SCREEN_SPACE_SIZE / window.innerHeight) * screenHeight;
    }
    
    // Fallback to base radius
    return this.HIGHLIGHT_RADIUS;
  }

  /**
   * Update the highlight geometry based on camera position
   */
  updateGeometry(camera: THREE.Camera) {
    const worldPosition = new THREE.Vector3(
      this.highlightPlane.position.x,
      this.PLANE_Y,
      this.highlightPlane.position.z
    );
    
    const dynamicRadius = this.calculateWorldRadius(camera, worldPosition);
    
    // Update highlight plane geometry
    this.highlightPlane.geometry.dispose();
    this.highlightPlane.geometry = new THREE.PlaneGeometry(2 * dynamicRadius, 2 * dynamicRadius);
    
    // Update cuboid geometry
    const diameter = 2 * dynamicRadius;
    this.cuboid.geometry.dispose();
    this.cuboid.geometry = new THREE.BoxGeometry(diameter, Highlighter.CUBOID_HEIGHT, diameter);
    
    // Update wireframe
    this.scene.remove(this.cuboidWireframe);
    this.cuboidWireframe = this.createCuboidWireframe(this.cuboid);
    this.scene.add(this.cuboidWireframe);
    
    // Store the current dynamic radius for use in event handlers
    this.HIGHLIGHT_RADIUS = dynamicRadius;
  }

  setPosition(x: number, z: number) {
    const y = this.PLANE_Y;
    const cuboidY = y + Highlighter.CUBOID_HEIGHT / 2;
    this.highlightPlane.position.set(x, y, z);
    this.cuboid.position.set(x, cuboidY, z);
    this.cuboidWireframe.position.set(x, cuboidY, z);
  }

  createInvisiblePlane() {
    const planeGeometry = new THREE.PlaneGeometry(Highlighter.INVIS_PLANE_SIZE, Highlighter.INVIS_PLANE_SIZE);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0,
      transparent: true,
      visible: false, // keep plane invisible
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2; // rotate to horizontal (XZ)
    plane.position.y = this.PLANE_Y;
    return plane;
  }

  createHighlightPlane() {
      const planeGeometry = new THREE.PlaneGeometry(2 * this.HIGHLIGHT_RADIUS, 2 * this.HIGHLIGHT_RADIUS);
      const planeMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
        visible: true,  // keep highlight plane invisible until needed
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.rotation.x = -Math.PI / 2;  // rotate to horizontal (XZ)
      plane.position.y = this.PLANE_Y;
      return plane;
  }

  createCuboid() {
      // Create tall transparent cuboid with green edges
      const diameter = 2 * this.HIGHLIGHT_RADIUS;
      const cuboidGeometry = new THREE.BoxGeometry(diameter, Highlighter.CUBOID_HEIGHT, diameter); // width, height, depth
      const cuboidMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        visible: true,
      });
      const cuboid = new THREE.Mesh(cuboidGeometry, cuboidMaterial);
      cuboid.position.set(0, this.PLANE_Y + 100, 0); // position so base starts at PLANE_Y
      return cuboid;
  }

  createCuboidWireframe(cuboid: THREE.Mesh) {
  const edges = new THREE.EdgesGeometry(cuboid.geometry);
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 }); // bright green
  const wireframe = new THREE.LineSegments(edges, edgeMaterial);
  wireframe.position.copy(cuboid.position);
  return wireframe;
}
}
