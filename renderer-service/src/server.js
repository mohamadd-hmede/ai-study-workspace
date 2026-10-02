import express from "express";
import multer from "multer";
import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const app = express();
const PORT = process.env.PORT || 3001;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/render", upload.single("file"), async (req, res) => {
  let tempDirectory = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded.",
      });
    }

    const extension = path.extname(req.file.originalname).toLowerCase();

    if (extension !== ".docx" && extension !== ".pptx") {
      return res.status(400).json({
        error: "Only DOCX and PPTX files are supported.",
      });
    }

    tempDirectory = await mkdtemp(path.join(tmpdir(), "studyflow-render-"));

    const inputPath = path.join(tempDirectory, `material${extension}`);

    const pdfPath = path.join(tempDirectory, "material.pdf");
    const imagePrefix = path.join(tempDirectory, "page");

    await writeFile(inputPath, req.file.buffer);

    const libreOfficeProfile = path.join(tempDirectory, "libreoffice-profile");

    const libreOfficeProfileUrl = `file://${libreOfficeProfile}`;

    await execFileAsync("libreoffice", [
      "--headless",
      `-env:UserInstallation=${libreOfficeProfileUrl}`,
      "--convert-to",
      "pdf",
      "--outdir",
      tempDirectory,
      inputPath,
    ]);

    await execFileAsync("pdftocairo", [
      "-jpeg",
      "-r",
      "150",
      pdfPath,
      imagePrefix,
    ]);

    const files = await readdir(tempDirectory);

    const imageFiles = files
      .filter((file) => file.startsWith("page-") && file.endsWith(".jpg"))
      .sort((a, b) => {
        const aNumber = Number(a.match(/\d+/)?.[0] ?? 0);
        const bNumber = Number(b.match(/\d+/)?.[0] ?? 0);

        return aNumber - bNumber;
      });

    if (imageFiles.length === 0) {
      throw new Error("No rendered pages were generated.");
    }

    const pages = await Promise.all(
      imageFiles.map(async (fileName, index) => {
        const image = await readFile(path.join(tempDirectory, fileName));

        return {
          index: index + 1,
          mimeType: "image/jpeg",
          base64: image.toString("base64"),
        };
      }),
    );

    return res.json({ pages });
  } catch (error) {
    console.error("Rendering failed:", error);

    return res.status(500).json({
      error: "Failed to render document.",
    });
  } finally {
    if (tempDirectory) {
      await rm(tempDirectory, {
        recursive: true,
        force: true,
      }).catch(() => {});
    }
  }
});

app.listen(PORT, () => {
  console.log(`Renderer service running on port ${PORT}`);
});
