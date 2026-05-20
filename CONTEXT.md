# Alchemy Effect Repro Context

This context describes the task API used to reproduce Alchemy, Cloudflare, and Effect integration behaviour.

## Language

**Task**:
A persisted work item with an id, title, and completion state. A Task starts incomplete when it is created.
_Avoid_: Todo, item

**Task operation**:
A use-case action over Tasks, currently create, get, and list. Task operations own Task defaults and task-level behaviour; storage only saves and loads Tasks.
Callers of Task operations should not need to know anything about the underlying persistence adapter or its failure modes.
Task operation callers may distinguish a missing Task from unavailable Task persistence; corrupt persisted data is treated as unavailable Task persistence.
Unavailable Task persistence carries an internal cause for observability, but public HTTP methods must not leak that cause.
Effect RPC is an internal Task operation adapter and may expose internal Task operation error causes.
_Avoid_: Repository operation, transport handler

**Task operation contract**:
The transport-independent shape of Task operations: operation names, inputs, successes, and internal operation errors. HTTP and RPC adapt the same Task operation contract rather than each defining Task operation shape.
_Avoid_: HTTP contract, RPC contract

## Example Dialogue

Developer: "When a Task is created, where does the incomplete default live?"

Domain expert: "That belongs to the Task operation. KV storage should save the Task it is given."

Developer: "Should HTTP and RPC each decide which Task errors can happen?"

Domain expert: "No. They adapt the same Task operation interface to different transports."
