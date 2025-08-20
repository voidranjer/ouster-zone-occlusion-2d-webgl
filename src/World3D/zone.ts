import * as THREE from "three";
import { highlighter } from "./World3D";
import { worldToLocalCoordinates } from "./utils";

export class Zone {
  static SKYSCRAPER_HEIGHT = 15;

  // Configurable parameters
  MAX_ZONE_VERTICES = 4;

  // State
  private zoneVertices: THREE.Mesh[] = []; // Cube indicators for the zone vertices
  private zoneLine: THREE.Line | null = null; // Single line connecting the zone vertices
  private zoneSkyscraperWire: THREE.LineSegments | null = null; // Wireframe for the skyscraper
  private xzVertices: number[][] = []; // World coordinates (post-extrinsics) of the zone vertices, X and Z in Three.js
  private localXzVertices: number[][] = []; // Mirror of xzVertices but pre-extrinsics. Stored separately for efficient lookup

  // Three.js objects
  scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  isEmpty() {
    return this.xzVertices.length === 0;
  }

  /**
  * Sets the full xzVertices array (in World Coords, post-extrinsics).
  * Use this method instead of setting `xzVertices` directly to ensure the `localXzVertices` mirror is updated correctly.
  * This method does NOT update the zone geometry, so you must call `updateZoneGeometryFromXZVertices()` manually if needed.
  * Call this method without `updateZoneGeometryFromXZVertices()` if you only want to update the 2D Point-in-Polygon test without drawing the zone in Three.js.
  */
  setXzVertices(xzVertices: number[][]) {
    this.xzVertices = xzVertices;
    this.localXzVertices = xzVertices.map(coords => worldToLocalCoordinates(coords[0], coords[1]));
    // this.updateZoneGeometryFromXZVertices();
  }

  /**
  * Sets the position of the last vertex (position is in World Coords, post-extrinsics).
  */
  setLastVertexPosition(position: THREE.Vector3) {
    if (this.isEmpty()) return;
    const lastIdx = this.xzVertices.length - 1;
    this.xzVertices[lastIdx] = [position.x, position.z];
    this.localXzVertices[lastIdx] = worldToLocalCoordinates(position.x, position.z);
    this.updateZoneGeometryFromXZVertices();
  }

  /**
  * Updates zoneVertices and zoneLines positions so that they match the current xzVertices.
  */
  updateZoneGeometryFromXZVertices() {
    // Update zoneVertices positions
    for (let i = 0; i < this.zoneVertices.length && i < this.xzVertices.length; i++) {
      const vert = this.zoneVertices[i];
      vert.position.x = this.xzVertices[i][0];
      vert.position.z = this.xzVertices[i][1];
    }
    // Update zone line geometry
    this.updateZoneLineGeometry();
    // Update skyscraper wireframe
    this.updateZoneSkyscraperWireframe();
  }

  /**
  * Updates the green wireframe polygon (zoneSkyscrapers) whose base is xzVertices and height is SKYSCRAPER_HEIGHT.
  */
  updateZoneSkyscraperWireframe() {
    // Remove old wireframe
    if (this.zoneSkyscraperWire) {
      this.zoneSkyscraperWire.removeFromParent();
      this.zoneSkyscraperWire = null;
    }
    if (this.xzVertices.length < 2) return;

    const baseY = highlighter.PLANE_Y;
    const topY = Zone.SKYSCRAPER_HEIGHT;
    const color = 0x00ff00;
    const material = new THREE.LineBasicMaterial({ color });

    // Collect all wireframe edges
    const points: THREE.Vector3[] = [];
    const n = this.xzVertices.length;
    // Vertical edges
    for (let i = 0; i < n; i++) {
      const base = new THREE.Vector3(this.xzVertices[i][0], baseY, this.xzVertices[i][1]);
      const top = new THREE.Vector3(this.xzVertices[i][0], topY, this.xzVertices[i][1]);
      points.push(base, top);
    }
    // Top polygon edges
    for (let i = 0; i < n; i++) {
      const a = new THREE.Vector3(this.xzVertices[i][0], topY, this.xzVertices[i][1]);
      const b = new THREE.Vector3(this.xzVertices[(i + 1) % n][0], topY, this.xzVertices[(i + 1) % n][1]);
      points.push(a, b);
    }
    // Base polygon edges
    for (let i = 0; i < n; i++) {
      const a = new THREE.Vector3(this.xzVertices[i][0], baseY, this.xzVertices[i][1]);
      const b = new THREE.Vector3(this.xzVertices[(i + 1) % n][0], baseY, this.xzVertices[(i + 1) % n][1]);
      points.push(a, b);
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    this.zoneSkyscraperWire = new THREE.LineSegments(geometry, material);
    this.scene.add(this.zoneSkyscraperWire);
  }

  /**
  * Updates the zoneLine geometry to match the current xzVertices.
  * Creates the line if it doesn't exist.
  */
  updateZoneLineGeometry() {
    if (this.xzVertices.length < 2) {
      if (this.zoneLine) {
        this.zoneLine.removeFromParent();
        this.zoneLine = null;
      }
      return;
    }

    // Build vertices for the closed polygon
    const vertices: THREE.Vector3[] = [];
    for (let i = 0; i < this.xzVertices.length; i++) {
      vertices.push(new THREE.Vector3(this.xzVertices[i][0], highlighter.PLANE_Y, this.xzVertices[i][1]));
    }
    // Close the loop
    vertices.push(new THREE.Vector3(this.xzVertices[0][0], highlighter.PLANE_Y, this.xzVertices[0][1]));

    const geometry = new THREE.BufferGeometry().setFromPoints(vertices);

    if (!this.zoneLine) {
      // Note: linewidth only works in WebGLRenderer on Windows/Linux, not most Macs. For thick lines on all platforms, use THREE.MeshLine or similar.
      const material = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 5 });
      this.zoneLine = new THREE.Line(geometry, material);
      this.scene.add(this.zoneLine);
    } else {
      this.zoneLine.geometry.dispose();
      this.zoneLine.geometry = geometry;
    }
  }

  /**
  * Duplicates the last vertex. If no vertices exist yet, then add a [0, 0] vertex.
  * @returns {boolean} Returns true if a vertex was added, false if the Zone is now sealed (exceeds `MAX_ZONE_VERTICES`)
  */
  addVertex(): boolean {
    if (this.xzVertices.length === this.MAX_ZONE_VERTICES) return false;

    const point = new THREE.Vector3(0, highlighter.PLANE_Y, 0);

    if (!this.isEmpty()) {
      const lastVertex = this.xzVertices[this.xzVertices.length - 1];
      point.x = lastVertex[0];
      point.z = lastVertex[1];
    }

    this.xzVertices.push([point.x, point.z]);
    this.localXzVertices.push(worldToLocalCoordinates(point.x, point.z));

    // Add the box
    const boxSize = 0.3;
    const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.copy(point);
    this.scene.add(box);
    this.zoneVertices.push(box);

  // Update zone line geometry
  this.updateZoneLineGeometry();

    return true;
  }

  reset() {
    this.xzVertices = [];
    this.localXzVertices = [];

    let vertex = this.zoneVertices.pop();
    while (vertex !== undefined) {
      vertex.removeFromParent();
      vertex = this.zoneVertices.pop();
    }

    if (this.zoneLine) {
      this.zoneLine.removeFromParent();
      this.zoneLine = null;
    }
    if (this.zoneSkyscraperWire) {
      this.zoneSkyscraperWire.removeFromParent();
      this.zoneSkyscraperWire = null;
    }
  }

  /**
  * Gets the `xzVertices` array in local coordinates (pre-extrinsics)
  */
  getLocalXz() {
    return this.localXzVertices;
  }
}
