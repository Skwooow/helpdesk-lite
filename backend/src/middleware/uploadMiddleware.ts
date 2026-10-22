
import multer from "multer";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";

const uploadDirectory = path.resolve(__dirname, "../../uploads");
mkdirSync(uploadDirectory, { recursive: true });

const allowedTypes: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".txt": "text/plain",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (_request, _file, callback) => {
      callback(null, uploadDirectory);
    },
    filename: (_request, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${randomUUID()}${extension}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const expectedMime = allowedTypes[extension];

    if (!expectedMime || file.mimetype !== expectedMime) {
      callback(new Error("UNSUPPORTED_FILE_TYPE"));
      return;
    }

    callback(null, true);
  },
});


import type { Request, Response, NextFunction } from "express";

// Преобразуем ошибки загрузки в понятные ответы API.
export function uploadSingleAttachment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  upload.single("file")(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({
          error: "Размер файла не должен превышать 5 МБ",
        });
        return;
      }

      if (error.code === "LIMIT_FILE_COUNT" ||
          error.code === "LIMIT_UNEXPECTED_FILE") {
        res.status(400).json({
          error: "Можно загрузить только один файл",
        });
        return;
      }
    }

    if (error instanceof Error &&
        error.message === "UNSUPPORTED_FILE_TYPE") {
      res.status(400).json({
        error: "Поддерживаются только PDF, PNG, JPG и TXT",
      });
      return;
    }

    next(error);
  });
}


export default upload;
export { uploadDirectory };
