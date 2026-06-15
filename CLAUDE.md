cat > CLAUDE.md << 'EOF'
# CLAUDE.md

> Claude-specific entry point for this repo. See [`AGENTS.md`](./AGENTS.md) for full agent guidance.

## Two-file Claude context

1. **This repo's `AGENTS.md`** — code patterns, stack versioning, folder conventions, out-of-scope features
2. **[`brewdesk-docs/CLAUDE.md`](https://github.com/MiloPBE2167/brewdesk-docs/blob/main/CLAUDE.md)** — co-builder behavior, principles, decision-log protocol, session rhythm

Load both when working in this repo. When in doubt about behavior or principles → docs repo. When in doubt about code patterns → this repo's `AGENTS.md`.

## Quick start

```bash
corepack enable
pnpm install
pnpm dev
```

## Session start ritual (per brewdesk-docs/CLAUDE.md §4)

> "Session start. Phase <N>. Last commit: <hash/date>. Topic: <X>."

Claude fetches latest from `brewdesk-docs` and aligns code work with the active phase in `06-build-timeline.md`.

EOF