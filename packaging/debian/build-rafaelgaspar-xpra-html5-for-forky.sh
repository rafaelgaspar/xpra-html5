#!/usr/bin/env bash
# Build upstream-style xpra-html5 binary deb from the current git tree (rafaelgaspar integration).
# Intended to run inside debian:forky (see .github/workflows/rafaelgaspar-release.yaml).
#
# Usage: build-rafaelgaspar-xpra-html5-for-forky.sh <debian-version>
set -euo pipefail

DEB_VERSION="${1:?debian version required}"
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_DIR="${REPO_ROOT}/dist/debian"
PKG_VERSION="${DEB_VERSION}-r0-1"

mkdir -p "$OUT_DIR" "${REPO_ROOT}/dist"
cd "$REPO_ROOT"

cp packaging/debian/changelog packaging/debian/changelog.bak
perl -i -pe "s/^Version: .*/Version: ${PKG_VERSION}/" packaging/debian/control

{
  cat <<EOF
xpra-html5 (${PKG_VERSION}) unstable; urgency=medium

  * rafaelgaspar integration build from git.

 -- Rafael Antunes <me@rafaelgaspar.xyz>  $(date -R)

EOF
  cat packaging/debian/changelog.bak
} >packaging/debian/changelog
rm -f packaging/debian/changelog.bak

if [[ "$(id -u)" -ne 0 ]]; then
  SUDO=(sudo)
else
  SUDO=()
fi

"${SUDO[@]}" mk-build-deps --install \
  --tool='apt-get -o Debug::pkgProblemResolver=yes --no-install-recommends --yes' \
  packaging/debian/control
rm -f xpra-html5-build-deps* 2>/dev/null || true

export DEBIAN_FRONTEND=noninteractive
python3 setup.py deb

built="$(find dist -maxdepth 1 -name 'xpra-html5-*.deb' -type f | sort | tail -1)"
[[ -n "$built" && -f "$built" ]] || { echo "no xpra-html5 deb produced" >&2; exit 1; }

dest="${OUT_DIR}/xpra-html5_${PKG_VERSION}_all.deb"
cp -a "$built" "$dest"

MANIFEST="${OUT_DIR}/deb-manifest.txt"
printf '%s\n' "$(basename "$dest")" >"$MANIFEST"
echo "built xpra-html5 deb -> $dest"
