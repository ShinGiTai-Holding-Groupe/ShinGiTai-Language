import {
  InMemoryAppendOnlyRepository,
  InMemoryEntityRepository,
  PersistenceConflictError,
} from "../../src/persistence";

interface TestEntity {
  readonly id: string;
  readonly version: number;
  readonly label: string;
}

interface TestRecord {
  readonly id: string;
  readonly createdAt: string;
  readonly value: string;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function expectConflict(operation: () => Promise<unknown>): Promise<void> {
  try {
    await operation();
  } catch (error) {
    assert(
      error instanceof PersistenceConflictError,
      "Expected PersistenceConflictError.",
    );
    return;
  }

  throw new Error("Expected operation to fail with PersistenceConflictError.");
}

async function testEntityRepository(): Promise<void> {
  const repository = new InMemoryEntityRepository<TestEntity>();

  const created = await repository.put({ id: "b", version: 1, label: "Beta" });
  assert(created.created, "First write must be reported as created.");

  await repository.put({ id: "a", version: 1, label: "Alpha" });
  const listed = await repository.list();
  assert(
    listed.map((entity) => entity.id).join(",") === "a,b",
    "Entity listing must be deterministic and sorted by ID.",
  );

  const loaded = await repository.getById("a");
  assert(loaded?.label === "Alpha", "Stored entity must be readable.");

  if (loaded) {
    (loaded as { label: string }).label = "Mutated outside repository";
  }
  assert(
    (await repository.getById("a"))?.label === "Alpha",
    "Repository reads must return defensive clones.",
  );

  const updated = await repository.put(
    { id: "a", version: 2, label: "Alpha 2" },
    1,
  );
  assert(!updated.created, "Later versions must be reported as updates.");

  await expectConflict(() =>
    repository.put({ id: "a", version: 3, label: "Invalid" }, 1),
  );
  await expectConflict(() =>
    repository.put({ id: "a", version: 2, label: "Stale" }, 2),
  );

  assert(await repository.delete("a", 2), "Delete must succeed once.");
  assert(!(await repository.delete("a", 2)), "Delete must be idempotent.");
  assert((await repository.getById("a")) === null, "Deleted entity must be hidden.");
  assert(
    (await repository.getById("a", { includeDeleted: true }))?.version === 2,
    "Deleted entity must remain available for explicit audit reads.",
  );
}

async function testAppendOnlyRepository(): Promise<void> {
  const repository = new InMemoryAppendOnlyRepository<TestRecord>();

  assert(
    await repository.append({
      id: "later",
      createdAt: "2026-07-31T12:00:00.000Z",
      value: "second",
    }),
    "First append must succeed.",
  );
  assert(
    await repository.append({
      id: "earlier",
      createdAt: "2026-07-31T11:00:00.000Z",
      value: "first",
    }),
    "Distinct append must succeed.",
  );
  assert(
    !(await repository.append({
      id: "earlier",
      createdAt: "2026-07-31T13:00:00.000Z",
      value: "duplicate",
    })),
    "Duplicate append must be idempotently rejected.",
  );

  const listed = await repository.list();
  assert(
    listed.map((record) => record.id).join(",") === "earlier,later",
    "Append-only listing must be ordered by timestamp and ID.",
  );

  const loaded = await repository.getById("earlier");
  assert(loaded?.value === "first", "Original append-only record must be preserved.");
  if (loaded) {
    (loaded as { value: string }).value = "Mutated outside repository";
  }
  assert(
    (await repository.getById("earlier"))?.value === "first",
    "Append-only reads must return defensive clones.",
  );
}

await testEntityRepository();
await testAppendOnlyRepository();
console.log("Foundation persistence contract tests passed.");
