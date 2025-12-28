
/**
 * Local Commentary Service
 * Generates poetic atmosphere-setting descriptions locally without external API dependencies.
 */

const poeticFragments = [
  "Light dances across the surface, revealing hidden depths and fleeting moments.",
  "A study of silence and motion, where every frame tells a story of the natural world.",
  "Vibrant textures meet soft focus in this exploration of visual harmony.",
  "Capturing the raw power and delicate grace found in every corner of the landscape.",
  "An intimate look at the intersections of light, shadow, and organic form.",
  "Where the pulse of the earth meets the stillness of the lens.",
  "The ephemeral beauty of a single moment, preserved in eternal clarity.",
  "Tracing the geometry of nature through the shifting lens of time."
];

export const getGalleryCommentary = async (title, subtitle) => {
  const charSum = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  // Fixed: fragmentIndex now correctly uses the array length
  const fragmentIndex = charSum % poeticFragments.length;
  const fragment = poeticFragments[fragmentIndex];
  
  return `${fragment} Discover the essence of ${title}: ${subtitle}.`;
};
