// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalGsap = (window as any).gsap;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalSplitText = (window as any).SplitText;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalMorphSVGPlugin = (window as any).MorphSVGPlugin;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalDrawSVGPlugin = (window as any).DrawSVGPlugin;

if (globalGsap && globalSplitText && globalMorphSVGPlugin && globalDrawSVGPlugin) {
  globalGsap.registerPlugin(globalSplitText, globalMorphSVGPlugin, globalDrawSVGPlugin);
}

export {};
