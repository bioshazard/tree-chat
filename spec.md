# Minimal React SPA Forking Chat UX (BYOK) — Spec v0.1

> **BLUF:** Client-only React SPA that demos a minimal chat with **forking branches**. Uses **Vercel AI SDK (`ai/react`)** directly against user-supplied OpenAI-compatible endpoints. No server, no auto-summaries, no extras.

---

## Scope (MVP)

* Input box, message list, streaming assistant replies.
* Abort button.
* **Fork button** at any message → creates new branch continuing from that point.
* Active path transcript view.
* Breadcrumbs to show path.
* User-supplied `baseUrl`, `apiKey`, `model` via Settings.

## Out of Scope (MVP)

* Auto-summaries, metadata, metrics.
* Auth, theming, markdown, RAG, merge/rebase.
* Persistence beyond optional localStorage of settings.

## Architecture

* **UI:** React SPA (Vite). One route.
* **Networking:** `useChat` from `ai/react`, configured with runtime `baseUrl` and `apiKey`.
* **State:** Local in-memory state for messages + tree of branches.

## Minimal Data Design

* **Branch (node):**

  ```json
  {
    "id": string,              // unique branch id
    "parentId": string|null,   // points to parent branch id (null for root)
    "messageIds": string[]     // ordered list of message ids for this branch
  }
  ```

* **Message:**

  ```json
  {
    "id": string,              // unique message id
    "branchId": string,        // branch this message belongs to
    "role": "user"|"assistant",
    "content": string,
    "createdAt": number        // epoch ms
  }
  ```

* **Active Path Resolution:**

  * Starting from active branch, walk `parentId` links back to root, collect all `messageIds`, render as flat transcript.

* **Persistence:**

  * IndexedDB database: `treeChat`
  * Object stores:

    * `branches` (key: `id`, index: `parentId`)
    * `messages` (key: `id`, index: `branchId`)
    * `settings` (key: `k`, value: runtime config)

* **Loading:**

  * Load active branch by `id`.
  * Join `messages` via `messageIds`.
  * Reconstruct path by following `parentId` chain.

## UX

* Transcript = flattened active path (root → leaf).
* **Fork:** button inline on each message; creates a new branch with context up to that message.
* **Breadcrumbs:** show path; clicking navigates to that branch.
* **Composer:** textarea + Send + Stop.

## Settings

* Modal to enter `baseUrl`, `apiKey`, `model`.
* Option: persist to localStorage (default OFF).
* Validate by probing `/v1/models`.

## Error Handling

* Distinguish: abort vs network vs upstream (401/429/5xx).
* Single inline banner, concise reason; manual retry.

## Acceptance Criteria

1. User configures endpoint+key; test call succeeds.
2. Can send message, see streaming assistant reply.
3. Abort works within <1s.
4. Fork at a past message spawns a new branch, focus switches.
5. Breadcrumb reflects active branch.
6. Data stored in IndexedDB under `treeChat.branches` and `treeChat.messages`.
7. No developer-shipped secrets.

## Rollout Plan

* v0.1: chat + fork + breadcrumbs.
* v0.2: optional branch persistence (IndexedDB integration).
* v0.3: node titles, inline renames.

---

**Done =** minimal forking chat demo SPA using BYOK + `ai/react`. IndexedDB-backed, flat transcript per active path.

## Data design (minimal)

**Parent linkage**

* `parentId` on **Branch** links to the **parent Branch node** (immediate ancestor).
* `forkSeq: number | null` on **Branch** = the **inclusive** message sequence number from the **parent branch** that this branch inherits up to. Forking at message `m` ⇒ `forkSeq = m.seq`.

**Loading strategy (transcript for active leaf)**

1. Start with `activeBranchId`.
2. Climb `parentId` chain to root, producing `[A0=root, A1, …, An=active]`.
3. For each `Ai` where `i < n` include messages with `seq <= forkSeq` of child `Ai+1`.
4. Include **all** messages of `An` (the active branch).
5. Render in order encountered; within a branch use `seq` ascending.

**Storage (IndexedDB)**

* **Database:** `treechat` (version 1)
* **Stores:**

  * `branches` (pk: `id`)

    * fields: `{ id, parentId|null, forkSeq|null, title?, createdAt }`
    * indexes: `parentId`, `createdAt`
  * `messages` (pk: `id`)

    * fields: `{ id, branchId, seq, role: "user"|"assistant", content, createdAt }`
    * indexes: `branchId`, `[branchId+seq]` (compound), `createdAt`
  * `settings` (pk: `key`)

    * sample row: `{ key: "config", value: { baseUrl, apiKey?, model } }` (persist only if user opts in)

**Write ops**

* **Create branch:** insert into `branches` with `{ parentId, forkSeq }`; set `activeBranchId` in memory.
* **Append message:** read max `seq` for `branchId` (or 0), write `{ seq: prev+1, ... }` to `messages`.

**Read ops**

* **Load by branch:** resolve path via `parentId`; for each id, range-scan `messages` by `[branchId+seq]` with cutoffs from `forkSeq`.
* **List children:** index `parentId` on `branches`.
* **Recent branches:** scan `branches` by `createdAt` desc.

**Notes**

* No duplication of parent messages into child branches; inheritance is via `forkSeq` rule.
* Deletion/compaction out of scope for MVP.
* If persistence is disabled, keep all of the above in memory; IndexedDB layer is a plug-in shim.
