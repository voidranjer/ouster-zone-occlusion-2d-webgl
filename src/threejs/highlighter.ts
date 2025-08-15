import * as THREE from "three";

export class Highlighter {
  static readonly CUBOID_HEIGHT = 200; // height of the cuboid in Y direction
  static readonly INVIS_PLANE_SIZE = 200; // size of the invisible plane. should match up with GridHelper size

  // Configurable parameters
  PLANE_Y = -1.0;
  HIGHLIGHT_RADIUS = 1.0;
  
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

    this.setPosition(0, 1000); // Initialize position
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
