import { BackSide, Color, ShaderMaterial, type Texture } from "three";
import { palette } from "@/lib/palette";
import { qualitySettings, type QualityTier } from "@/lib/quality";
import { liquidModel, type LiquidState } from "@/scene/liquid/model";
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
        uBlobCount: { value: 0 },
        uSquash: { value: 1 },
        uBlend: { value: 0.5 },
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
    this.uniforms.uBlobs.value = state.blobs;
    this.uniforms.uBlobCount.value = state.count;
    this.uniforms.uSquash.value = state.squash;
    this.uniforms.uBlend.value = state.blend;
  }

  setPixelAngle(angle: number) {
    this.uniforms.uPixelAngle.value = angle;
  }

  setWordmark(texture: Texture | null) {
    this.uniforms.uWordmark.value = texture;
    this.uniforms.uWordmarkOn.value = texture ? 1 : 0;
  }
}
