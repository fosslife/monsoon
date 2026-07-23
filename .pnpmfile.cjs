// typescript-eslint cannot use the native TS 7 compiler API yet
// (https://github.com/typescript-eslint/typescript-eslint/issues/10940).
// Give the lint toolchain its own TS 6 (JS implementation) copy while the
// project's `tsc` stays on typescript@7.
function readPackage(pkg) {
  const isTsEslint =
    pkg.name === "typescript-eslint" ||
    (pkg.name && pkg.name.startsWith("@typescript-eslint/"));
  if (isTsEslint && pkg.peerDependencies && pkg.peerDependencies.typescript) {
    delete pkg.peerDependencies.typescript;
    pkg.dependencies = { ...pkg.dependencies, typescript: "6.0.3" };
  }
  return pkg;
}

module.exports = { hooks: { readPackage } };
