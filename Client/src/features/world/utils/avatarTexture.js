import {
  avatarRects,
  getAvatarPreset,
} from "../../profile/avatarPresets";

export function getAvatarTexture(scene, avatarId) {
  const preset = getAvatarPreset(avatarId);
  const key = `campus-avatar-${preset.id}`;

  if (scene.textures.exists(key)) return key;

  const graphics = scene.make.graphics({
    x: 0,
    y: 0,
    add: false,
  });

  for (const [x, y, width, height, color] of avatarRects(preset.id)) {
    graphics.fillStyle(parseInt(color.slice(1), 16), 1);
    graphics.fillRect(x, y, width, height);
  }

  graphics.generateTexture(key, 30, 34);
  graphics.destroy();

  return key;
}