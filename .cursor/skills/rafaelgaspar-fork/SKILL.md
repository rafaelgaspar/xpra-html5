---
name: rafaelgaspar-fork
description: >-
  Work with the rafaelgaspar/xpra-html5 fork of Xpra-org/xpra-html5 — stacked feat branches,
  rafaelgaspar integration pointer, GHCR publish, upstream tag rebuilds.
  Use when changing HTML5 client upstream-bound code, fork branches, stack order,
  or ghcr.io/rafaelgaspar/xpra-html5 images.
disable-model-invocation: true
---

# xpra-html5 fork (`rafaelgaspar/xpra-html5`)

Upstream: [Xpra-org/xpra-html5](https://github.com/Xpra-org/xpra-html5). Fork:
[rafaelgaspar/xpra-html5](https://github.com/rafaelgaspar/xpra-html5). Ships
**integration tags** from branch **`rafaelgaspar`** (format `vN-rafaelgaspar.M`, starting at `.0`; tarball version matches tag without `v`).

This skill covers **this repository only** — branch workflow, CI, and integration replay.
Deploy-specific overlays (`custom.css`, `default-settings.txt`, minify/brotli in desktop images)
belong in your private k3s-home repo, not here.

## Repos and branches

| Branch         | Role                                                                                  |
| -------------- | ------------------------------------------------------------------------------------- |
| `master`       | Upstream mirror only — auto-sync, no features                                         |
| `feat/<name>`  | One feature; branch from the **current stack tip** (or `feat/rafaelgaspar` for infra) |
| `rafaelgaspar` | Points at the stack tip — **only this branch ships** (default branch)                 |

**Invariant:** `feat/rafaelgaspar` is always the stack root (infra: GHCR publish, tag-bump
automation, agent skill, fork README, Dockerfile).

## Stacked feat branches (git is the source of truth)

Features form a **linear stack**:

```text
v20 (upstream tag)
 └── feat/rafaelgaspar
      └── feat/html5-menu
           └── feat/html5-menu-custom
                └── feat/html5-client
                     └── feat/html5-touch
                          └── feat/html5-dark-theme  ← rafaelgaspar reset --hard here
```

Order is defined by **git merge-base**, not a manifest file.

Inspect the stack:

```sh
git log --oneline --graph --decorate feat/rafaelgaspar feat/<...> rafaelgaspar
```

Validate without changing anything:

```sh
./.github/scripts/rebuild-rafaelgaspar.sh --dry-run v20
```

## Adding a feature

1. Branch from the **current stack tip**:

   ```sh
   git fetch origin
   git checkout -B feat/<name> origin/<stack-tip>
   ```

2. Implement as normal commits on `feat/<name>`.
3. Publish integration:

   ```sh
   git checkout rafaelgaspar
   git reset --hard feat/<name>
   git push --force-with-lease origin rafaelgaspar
   ```

   GHCR publish runs on push to `rafaelgaspar`.

## Upstream tag bump

When upstream releases tag **T** (e.g. `v21`), `.github/workflows/rafaelgaspar-tag-bump.yaml`
runs `.github/scripts/rebuild-rafaelgaspar.sh`:

```sh
./.github/scripts/rebuild-rafaelgaspar.sh --push v21
```

Upstream tags use `v<major>` (not semver `v*.*.*`).

## Scope

| Belongs on the fork (`feat/*`)     | Does not belong on this public repo        |
| ---------------------------------- | ------------------------------------------ |
| HTML5 client source patches        | Deploy `custom.css`, `default-settings.txt` |
| CI: GHCR publish, tag-bump replay  | Minify/brotli/gzip in desktop-base image   |
| Agent skill for fork workflow      | Private cluster paths or repo names        |
