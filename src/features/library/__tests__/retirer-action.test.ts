import { deleteFilesForRetirerAction } from "../retirer-action";

describe("deleteFilesForRetirerAction", () => {
  it("keeps files for list-only removal", () => {
    expect(deleteFilesForRetirerAction("listOnly")).toBe(false);
  });

  it("deletes files when chosen", () => {
    expect(deleteFilesForRetirerAction("deleteFiles")).toBe(true);
  });
});
