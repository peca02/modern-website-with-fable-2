import {
  BufferAttribute,
  BufferGeometry,
  Color,
  FloatType,
  HalfFloatType,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  PlaneGeometry,
  Points,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  WebGLRenderTarget,
  type WebGLRenderer,
} from "three";
import { palette } from "@/lib/palette";
import {
  grainFragmentShader,
  grainVertexShader,
  simulationFragmentShader,
  simulationVertexShader,
} from "@/scene/grains/shaders";

export type GrainFrame = {
  time: number;
  delta: number;
  shapeFrom: number;
  shapeTo: number;
  mix: number;
  field: number;
  split: number;
  weight: number;
  /** pixels a world unit covers at distance 1 */
  scale: number;
  still: boolean;
};

// GPGPU grains: two render targets hold the positions and swap every frame.
export class GrainSimulation {
  readonly points: Points<BufferGeometry, ShaderMaterial>;
  private readonly targets: [WebGLRenderTarget, WebGLRenderTarget];
  private readonly simulation: ShaderMaterial;
  private readonly quad: Mesh<PlaneGeometry, ShaderMaterial>;
  private readonly scene = new Scene();
  private readonly camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private current = 0;
  private started = false;

  constructor(size: number, floatTargets: boolean) {
    const createTarget = () =>
      new WebGLRenderTarget(size, size, {
        type: floatTargets ? FloatType : HalfFloatType,
        format: RGBAFormat,
        minFilter: NearestFilter,
        magFilter: NearestFilter,
        depthBuffer: false,
      });
    this.targets = [createTarget(), createTarget()];

    this.simulation = new ShaderMaterial({
      vertexShader: simulationVertexShader,
      fragmentShader: simulationFragmentShader,
      uniforms: {
        uPositions: { value: null },
        uSize: { value: size },
        uTime: { value: 0 },
        uDelta: { value: 0 },
        uReset: { value: 1 },
        uTurbulence: { value: 0 },
        uShapeFrom: { value: 0 },
        uShapeTo: { value: 0 },
        uMix: { value: 0 },
        uField: { value: 0 },
        uSplit: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
    });
    this.quad = new Mesh(new PlaneGeometry(2, 2), this.simulation);
    this.scene.add(this.quad);

    const references = new Float32Array(size * size * 3);
    for (let index = 0; index < size * size; index += 1) {
      references[index * 3] = ((index % size) + 0.5) / size;
      references[index * 3 + 1] = (Math.floor(index / size) + 0.5) / size;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(references, 3));
    this.points = new Points(
      geometry,
      new ShaderMaterial({
        vertexShader: grainVertexShader,
        fragmentShader: grainFragmentShader,
        uniforms: {
          uPositions: { value: null },
          uScale: { value: 1 },
          uWeight: { value: 0 },
          uInk: { value: new Color(palette.ink) },
        },
      }),
    );
    this.points.frustumCulled = false;
  }

  update(renderer: WebGLRenderer, frame: GrainFrame) {
    const read = this.targets[this.current];
    const write = this.targets[1 - this.current];
    const uniforms = this.simulation.uniforms;
    uniforms.uPositions.value = read.texture;
    uniforms.uTime.value = frame.still ? 0 : frame.time;
    uniforms.uDelta.value = frame.delta;
    uniforms.uReset.value = this.started ? 0 : 1;
    uniforms.uTurbulence.value = frame.still ? 0 : 0.035;
    uniforms.uShapeFrom.value = frame.shapeFrom;
    uniforms.uShapeTo.value = frame.shapeTo;
    uniforms.uMix.value = frame.mix;
    uniforms.uField.value = frame.field;
    uniforms.uSplit.value = frame.split;

    const previous = renderer.getRenderTarget();
    renderer.setRenderTarget(write);
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(previous);

    this.current = 1 - this.current;
    this.started = true;
    this.points.material.uniforms.uPositions.value = write.texture;
    this.points.material.uniforms.uScale.value = frame.scale;
    this.points.material.uniforms.uWeight.value = frame.weight;
    this.points.visible = frame.weight > 0.001;
  }

  dispose() {
    this.targets.forEach((target) => target.dispose());
    this.simulation.dispose();
    this.quad.geometry.dispose();
    this.points.geometry.dispose();
    this.points.material.dispose();
  }
}
