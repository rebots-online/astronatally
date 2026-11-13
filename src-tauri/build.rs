fn main() {
  assert_eq!(std::env::var("NATALLY_CANONICAL_BUILD").as_deref(), Ok("1"),
    "Native packaging must run through build_all.sh");
  println!("cargo:rerun-if-env-changed=NATALLY_CANONICAL_BUILD");
  let release: serde_json::Value = serde_json::from_str(
    &std::fs::read_to_string("../config/product-release.json").expect("canonical product release policy"),
  ).expect("valid product release policy");
  assert_eq!(release["sourceRole"].as_str(), Some("source"));
  assert_eq!(release["repository"].as_str(), Some("rebots-online/astronatally"));
  let origin = release["webOrigin"].as_str().expect("configured web origin");
  let host = origin.strip_prefix("https://").expect("HTTPS web origin");
  assert!(!host.is_empty() && !host.chars().any(|c| c.is_whitespace() || matches!(c, '/' | '?' | '#' | '@')),
    "Product web origin must have no path, credentials, query or fragment");
  println!("cargo:rerun-if-changed=../config/product-release.json");
  println!("cargo:rustc-env=NATALLY_WEB_ORIGIN={origin}");
  let stamp: serde_json::Value = serde_json::from_str(
    &std::fs::read_to_string("../version.json").expect("canonical version.json"),
  ).expect("valid canonical version");
  let package_version = stamp["semverVersion"].as_str().or_else(|| stamp["version"].as_str()).unwrap();
  assert_eq!(package_version, std::env::var("CARGO_PKG_VERSION").unwrap());
  println!("cargo:rerun-if-changed=../version.json");
  // Android's linker does not otherwise emit a GNU build ID here. Preserve
  // one in the application and debug sections for exact symbol matching.
  if std::env::var("CARGO_CFG_TARGET_OS").ok().as_deref() == Some("android") {
    println!("cargo:rustc-link-arg=-Wl,--build-id=sha1");
  }
  tauri_build::build()
}
