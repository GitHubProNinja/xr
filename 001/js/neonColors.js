// neonColors.js
// Utility for getting random neon colors for materials
export function getRandomNeonColor() {
    // Array of bright neon colors (hex values)
    const neonColors = [
        0x39ff14, // Neon Green
        0xff073a, // Neon Red
        0x00f0ff, // Neon Cyan
        0xfffb00, // Neon Yellow
        0xff00de, // Neon Pink
        0x00ff85, // Neon Mint
        0xffa600, // Neon Orange
        0x7cfc00, // Lawn Green (bright, almost neon)
        0x00ffef, // Neon Aqua
        0xff00ff  // Neon Magenta
    ];
    return neonColors[Math.floor(Math.random() * neonColors.length)];
}
