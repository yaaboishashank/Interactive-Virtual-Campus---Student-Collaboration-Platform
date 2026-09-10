export const AVATAR_PRESETS = [
  { id: "violet", label: "Violet", shirt: "#7459cc" },
  { id: "blue", label: "Blue", shirt: "#385bff" },
  { id: "mint", label: "Mint", shirt: "#218568" },
  { id: "amber", label: "Amber", shirt: "#c97918" },
  { id: "rose", label: "Rose", shirt: "#cb497b" },
  { id: "cyan", label: "Cyan", shirt: "#16869e" },
];

export function getAvatarPreset(id) {
  return (
    AVATAR_PRESETS.find((preset) => preset.id === id) ||
    AVATAR_PRESETS[0]
  );
}

export function avatarRects(id) {
  const preset = getAvatarPreset(id);

  // x, y, width, height, color
  return [
    [5, 29, 20, 3, "#b0a59b"],
    [7, 23, 6, 8, "#354158"],
    [16, 23, 6, 8, "#354158"],
    [5, 13, 19, 13, preset.shirt],
    [8, 5, 14, 11, "#d9a17e"],
    [6, 2, 18, 7, "#2e2b36"],
    [5, 6, 5, 7, "#2e2b36"],
    [11, 10, 2, 2, "#25232b"],
    [18, 10, 2, 2, "#25232b"],
  ];
}