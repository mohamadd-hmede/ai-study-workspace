import { describe, expect, it } from "vitest";

import {
  getMaterialFileCapability,
  isKnownMaterialFile,
} from "./material-file-capabilities";

describe("getMaterialFileCapability", () => {
  it("detects PDF files", () => {
    expect(getMaterialFileCapability("lecture.pdf", "application/pdf")).toEqual(
      {
        kind: "pdf",
        previewStrategy: "pdf",
        processingStrategy: "original",
      },
    );
  });

  it("detects image files", () => {
    expect(getMaterialFileCapability("diagram.png", "image/png")).toEqual({
      kind: "image",
      previewStrategy: "image",
      processingStrategy: "original",
    });
  });

  it("detects DOCX files", () => {
    expect(
      getMaterialFileCapability(
        "notes.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    ).toEqual({
      kind: "docx",
      previewStrategy: "docx",
      processingStrategy: "docx",
    });
  });

  it("detects PPTX files", () => {
    expect(
      getMaterialFileCapability(
        "slides.pptx",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ),
    ).toEqual({
      kind: "pptx",
      previewStrategy: "pptx",
      processingStrategy: "pptx",
    });
  });

  it("detects XLSX files", () => {
    expect(
      getMaterialFileCapability(
        "grades.xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ),
    ).toEqual({
      kind: "xlsx",
      previewStrategy: "spreadsheet",
      processingStrategy: "xlsx",
    });
  });

  it("detects CSV files", () => {
    expect(getMaterialFileCapability("data.csv", "text/csv")).toEqual({
      kind: "csv",
      previewStrategy: "table",
      processingStrategy: "csv",
    });
  });

  it("detects source code files", () => {
    expect(getMaterialFileCapability("app.tsx", "")).toEqual({
      kind: "code",
      previewStrategy: "code",
      processingStrategy: "text",
    });
  });

  it("detects text files", () => {
    expect(getMaterialFileCapability("notes.txt", "text/plain")).toEqual({
      kind: "text",
      previewStrategy: "text",
      processingStrategy: "text",
    });
  });

  it("returns null for unsupported files", () => {
    expect(
      getMaterialFileCapability("archive.zip", "application/zip"),
    ).toBeNull();
  });
});

describe("isKnownMaterialFile", () => {
  it("returns true for a supported material", () => {
    expect(isKnownMaterialFile("lesson.pdf", "application/pdf")).toBe(true);
  });

  it("returns false for an unsupported material", () => {
    expect(isKnownMaterialFile("archive.zip", "application/zip")).toBe(false);
  });
});
