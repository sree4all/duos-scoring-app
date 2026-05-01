"use server";

export async function exportContestTemplate() {
  return {
    filename: "contest-template.csv",
    rows: [],
  };
}

export async function importContestTemplate() {
  return {
    ok: true,
    importedRows: 0,
    rejectedRows: 0,
  };
}
