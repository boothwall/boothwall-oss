// Brand artwork is imported as a URL; the consuming app's bundler (Vite) serves the file.
declare module "*.svg" {
  const url: string;
  export default url;
}
