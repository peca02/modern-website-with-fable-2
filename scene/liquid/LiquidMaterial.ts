import { BackSide, Color, ShaderMaterial, Vector2, Vector4, type Texture } from "three";
import { palette } from "@/lib/palette";
import { qualitySettings, type QualityTier } from "@/lib/quality";
import { activeBlobs, liquidModel, poseLayout, type LiquidState } from "@/scene/liquid/model";
import { buildLiquidFragmentShader, liquidVertexShader } from "@/scene/liquid/shaders";

export class LiquidMaterial extends ShaderMaterial {
  constructor(tier: QualityTier) {
    const settings = qualitySettings[tier];
    super({
      vertexShader: liquidVertexShader,
      fragmentShader: buildLiquidFragmentShader({
        steps: settings.raymarchSteps,
        selfReflection: settings.selfReflection,
        floorReflection: tier >= 1,
        shadowSteps: tier === 0 ? 8 : 14,
      }),
      uniforms: {
        uBlobs: { value: new Float32Array(liquidModel.maxBlobs * 4) },
        uBlobCount: { value: 1 },
        uExtent: { value: new Vector2(liquidModel.extent, liquidModel.extent) },
        uSquash: { value: 1 },
        uBlend: { value: 0.5 },
        uCeiling: { value: liquidModel.ceilingOff },
        uSpike: { value: 0 },
        uShadow: { value: 3.6 },
        uOrbSpike: { value: 0 },
        uSlab: { value: new Vector4() },
        uSlabSize: { value: new Vector4() },
        uSwell: { value: 0 },
        uSwellTime: { value: 0 },
        uPixelAngle: { value: 0.001 },
        uWordmark: { value: null },
        uWordmarkOn: { value: 0 },
        uField: { value: new Color(palette.field) },
        uPage: { value: new Color(palette.page) },
      },
      // The ray starts at the camera, so the back faces of the proxy volume
      // are enough and keep working when the camera is inside it.
      side: BackSide,
      transparent: true,
      premultipliedAlpha: true,
    });
  }

  syncState(state: LiquidState) {
    const { pose } = state;
    this.uniforms.uBlobs.value = state.blobs;
    this.uniforms.uBlobCount.value = activeBlobs(pose);
    if (this.uniforms.uExtent.value instanceof Vector2) {
      this.uniforms.uExtent.value.set(pose[poseLayout.extentX], pose[poseLayout.extentZ]);
    }
    this.uniforms.uSquash.value = pose[poseLayout.squash];
    this.uniforms.uBlend.value = pose[poseLayout.blend];
    this.uniforms.uCeiling.value = pose[poseLayout.ceiling];
    this.uniforms.uSpike.value = pose[poseLayout.spike];
    this.uniforms.uShadow.value = pose[poseLayout.shadow];
    this.uniforms.uOrbSpike.value = pose[poseLayout.orbSpike];
    if (this.uniforms.uSlab.value instanceof Vector4) this.uniforms.uSlab.value.fromArray(pose, poseLayout.slab);
    if (this.uniforms.uSlabSize.value instanceof Vector4) {
      this.uniforms.uSlabSize.value.fromArray(pose, poseLayout.slabSize);
    }
    this.uniforms.uSwell.value = state.swell;
    this.uniforms.uSwellTime.value = state.swellTime;
  }

  setPixelAngle(angle: number) {
    this.uniforms.uPixelAngle.value = angle;
  }

  setWordmark(texture: Texture | null) {
    this.uniforms.uWordmark.value = texture;
    this.uniforms.uWordmarkOn.value = texture ? 1 : 0;
  }
}
