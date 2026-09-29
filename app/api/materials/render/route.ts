import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { NextResponse } from "next/server";

const execFileAsync = promisify(execFile);

const LIBREOFFICE_PATH = process.env.SOFFICE_PATH;
const PDFTOCAIRO_PATH = process.env.PDFTOCAIRO_PATH;

export const runtime = "nodejs";

export async function POST(request: Request) {
  let tempDirectory: string | null = null;

  try {
    if (!LIBREOFFICE_PATH || !PDFTOCAIRO_PATH) {
      return NextResponse.json(
        {
          error: "The local material renderer is not configured.",
        },
        {
          status: 500,
        },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "A material file is required.",
        },
        {
          status: 400,
        },
      );
    }

    const extension = path.extname(file.name).toLowerCase();

    if (extension !== ".pptx" && extension !== ".docx") {
      return NextResponse.json(
        {
          error: "Only PPTX and DOCX materials can be rendered.",
        },
        {
          status: 400,
        },
      );
    }

    tempDirectory = await mkdtemp(path.join(tmpdir(), "studyflow-render-"));

    const inputPath = path.join(tempDirectory, `material${extension}`);

    const pdfPath = path.join(tempDirectory, "material.pdf");

    const imagePrefix = path.join(tempDirectory, "page");

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    await writeFile(inputPath, fileBuffer);

    // DOCX/PPTX -> PDF
    await execFileAsync(LIBREOFFICE_PATH, [
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      tempDirectory,
      inputPath,
    ]);

    // PDF -> one JPEG per page/slide
    await execFileAsync(PDFTOCAIRO_PATH, [
      "-jpeg",
      "-r",
      "150",
      pdfPath,
      imagePrefix,
    ]);

    const files = await readdir(tempDirectory);

    const imageFiles = files
      .filter(
        (fileName) =>
          fileName.startsWith("page-") &&
          fileName.toLowerCase().endsWith(".jpg"),
      )
      .sort((a, b) => {
        const getPageNumber = (fileName: string) => {
          const match = fileName.match(/page-(\d+)\.jpg$/i);

          return match ? Number(match[1]) : 0;
        };

        return getPageNumber(a) - getPageNumber(b);
      });

    if (imageFiles.length === 0) {
      throw new Error(
        "The material was converted, but no rendered pages were produced.",
      );
    }

    const pages = await Promise.all(
      imageFiles.map(async (fileName, index) => {
        const imageBuffer = await readFile(path.join(tempDirectory!, fileName));

        return {
          index: index + 1,
          mimeType: "image/jpeg",
          base64: imageBuffer.toString("base64"),
        };
      }),
    );

    return NextResponse.json({
      pages,
    });
  } catch (error) {
    console.error("Material rendering failed:", error);

    return NextResponse.json(
      {
        error: "StudyFlow could not render this material.",
      },
      {
        status: 500,
      },
    );
  } finally {
    if (tempDirectory) {
      await rm(tempDirectory, {
        recursive: true,
        force: true,
      }).catch((cleanupError) => {
        console.warn(
          "Could not clean temporary rendering files:",
          cleanupError,
        );
      });
    }
  }
}
