import { describe, expect, it } from "vitest";
import { mergeById } from "../sync";

type Row = { id: string; value: string };

describe("mergeById", () => {
  it("keeps rows that exist only on one side", () => {
    const merged = mergeById<Row>(
      [{ id: "a", value: "local" }],
      [{ id: "b", value: "remote" }]
    );
    expect(merged).toHaveLength(2);
    expect(merged.map((r) => r.id).sort()).toEqual(["a", "b"]);
  });

  it("prefers the local copy on conflict", () => {
    // The local record is the one the user has been editing in this tab.
    const merged = mergeById<Row>(
      [{ id: "a", value: "local" }],
      [{ id: "a", value: "remote" }]
    );
    expect(merged).toEqual([{ id: "a", value: "local" }]);
  });

  it("returns remote rows when there is nothing local", () => {
    const remote = [{ id: "a", value: "remote" }];
    expect(mergeById<Row>([], remote)).toEqual(remote);
  });

  it("returns local rows when the server has nothing", () => {
    const local = [{ id: "a", value: "local" }];
    expect(mergeById<Row>(local, [])).toEqual(local);
  });

  it("does not duplicate a row present on both sides", () => {
    const merged = mergeById<Row>(
      [
        { id: "a", value: "local" },
        { id: "b", value: "local" },
      ],
      [
        { id: "b", value: "remote" },
        { id: "c", value: "remote" },
      ]
    );
    expect(merged).toHaveLength(3);
  });
});
