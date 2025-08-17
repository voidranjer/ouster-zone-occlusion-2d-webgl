import * as THREE from "three";
import { raycaster } from "./World3D";

export class Highlighter {
  static readonly CUBOID_HEIGHT = 200;
  static readonly INVIS_PLANE_SIZE = 200;

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

    this.invisiblePlane = Highlighter.createInvisiblePlane(this.PLANE_Y);
    this.scene.add(this.invisiblePlane);

    this.highlightPlane = Highlighter.createHighlightPlane(
      this.HIGHLIGHT_RADIUS,
      this.PLANE_Y
    );
    this.scene.add(this.highlightPlane);

    this.cuboid = Highlighter.createCuboid(
      this.HIGHLIGHT_RADIUS,
      this.PLANE_Y
    );
    this.scene.add(this.cuboid);

    this.cuboidWireframe = Highlighter.createCuboidWireframe(this.cuboid);
    this.scene.add(this.cuboidWireframe);

    this.setPosition(10000, 10000); // Initialize position offscreen
  }

  setPosition(x: number, z: number) {
    const y = this.PLANE_Y;
    const cuboidY = y + Highlighter.CUBOID_HEIGHT / 2;
    this.highlightPlane.position.set(x, y, z);
    this.cuboid.position.set(x, cuboidY, z);
    this.cuboidWireframe.position.set(x, cuboidY, z);
  }

  // ----------------
  // Static factories
  // ----------------
  static createInvisiblePlane(planeY: number) {
    const planeGeometry = new THREE.PlaneGeometry(
      Highlighter.INVIS_PLANE_SIZE,
      Highlighter.INVIS_PLANE_SIZE
    );
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0,
      transparent: true,
      visible: false,
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = planeY;
    return plane;
  }

  static createHighlightPlane(radius: number, planeY: number) {
    const planeGeometry = new THREE.PlaneGeometry(2 * radius, 2 * radius);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
      visible: true,
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = planeY;
    return plane;
  }

  static createCuboid(radius: number, planeY: number) {
    const diameter = 2 * radius;
    const cuboidGeometry = new THREE.BoxGeometry(
      diameter,
      Highlighter.CUBOID_HEIGHT,
      diameter
    );
    const cuboidMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      visible: true,
    });
    const cuboid = new THREE.Mesh(cuboidGeometry, cuboidMaterial);
    cuboid.position.set(0, planeY + Highlighter.CUBOID_HEIGHT / 2, 0);
    return cuboid;
  }

  static createCuboidWireframe(cuboid: THREE.Mesh) {
    const edges = new THREE.EdgesGeometry(cuboid.geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const wireframe = new THREE.LineSegments(edges, edgeMaterial);
    wireframe.position.copy(cuboid.position);
    return wireframe;
  }

  // ----------------
  // Visibility & Updates
  // ----------------
  setVisible(visible: boolean) {
    this.highlightPlane.visible = visible;
    this.cuboid.visible = visible;
    this.cuboidWireframe.visible = visible;
  }

  setRadius(radius: number) {
    this.HIGHLIGHT_RADIUS = radius;

    // dispose old geometries only
    this.disposeGeometriesForUpdate();

    // update highlight plane geometry
    this.highlightPlane.geometry = new THREE.PlaneGeometry(2 * radius, 2 * radius);

    // update cuboid geometry
    this.cuboid.geometry = new THREE.BoxGeometry(
      2 * radius,
      Highlighter.CUBOID_HEIGHT,
      2 * radius
    );

    // update wireframe (needs new EdgesGeometry)
    this.scene.remove(this.cuboidWireframe);
    this.cuboidWireframe = Highlighter.createCuboidWireframe(this.cuboid);
    this.scene.add(this.cuboidWireframe);

    // maintain position
    this.setPosition(
      this.highlightPlane.position.x,
      this.highlightPlane.position.z
    );

    // World3D -> Setup -> Raycaster
    raycaster.params.Points.threshold = (this.HIGHLIGHT_RADIUS * 0.25);
  }

  // ----------------
  // Cleanup
  // ----------------
  dispose() {
    this.scene.remove(this.invisiblePlane);
    this.scene.remove(this.highlightPlane);
    this.scene.remove(this.cuboid);
    this.scene.remove(this.cuboidWireframe);

    this.disposeObject(this.invisiblePlane);
    this.disposeObject(this.highlightPlane);
    this.disposeObject(this.cuboid);
    this.disposeObject(this.cuboidWireframe);
  }

  /** Disposes only geometries that are replaced in setRadius */
  private disposeGeometriesForUpdate() {
    this.highlightPlane.geometry.dispose();
    this.cuboid.geometry.dispose();
    this.cuboidWireframe.geometry.dispose();
  }

  private disposeObject(obj: THREE.Object3D) {
    if ((obj as THREE.Mesh).geometry) {
      (obj as THREE.Mesh).geometry.dispose();
    }
    if ((obj as THREE.Mesh).material) {
      const mat = (obj as THREE.Mesh).material;
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose());
      } else {
        mat.dispose();
      }
    }
  }
}
