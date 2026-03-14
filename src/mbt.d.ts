declare module "mbt:ga-core/src" {
  function init(
    imports?: WebAssembly.Imports,
  ): Promise<{
    exports: {
      calc_fitness: (ind: string, target: string) => number;
      evolve: (popJoined: string, target: string, sel: string) => string;
      init_rng: (seed: number) => void;
    };
  }>;
  export default init;
  export { init };
}

declare module "mbt:*" {
  function init(imports?: WebAssembly.Imports): Promise<WebAssembly.Instance>;
  export default init;
  export { init };
}
