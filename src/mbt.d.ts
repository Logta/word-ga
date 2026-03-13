declare module "mbt:*" {
  function init(imports?: WebAssembly.Imports): Promise<WebAssembly.Instance>;
  export default init;
  export { init };
}
