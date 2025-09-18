"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Download,
  Upload,
  X,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Loader2,
  Code,
} from "lucide-react";
import { QualitySelector } from "./quality-selector";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ConvertedFile {
  id: string;
  originalFile: File;
  originalType: string;
  status: "converting" | "converted" | "error";
  convertedUrl?: string;
  convertedSize?: number;
  error?: string;
}

export default function AutoWebPConverter() {
  const [files, setFiles] = useState<ConvertedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [quality, setQuality] = useState(85);

  const convertToWebP = useCallback(
    (
      file: File,
      quality: number = 85
    ): Promise<{ url: string; size: number }> => {
      return new Promise((resolve, reject) => {
        if (!file.type.startsWith("image/")) {
          reject(new Error("Unsupported file format"));
          return;
        }

        const img = new Image();
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        img.onload = () => {
          try {
            canvas.width = img.width;
            canvas.height = img.height;

            if (ctx) {
              ctx.drawImage(img, 0, 0);

              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    const url = URL.createObjectURL(blob);
                    resolve({ url, size: blob.size });
                  } else {
                    reject(new Error("Failed to convert image to WebP"));
                  }
                },
                "image/webp",
                Math.max(quality / 100 - 0.001, 0)
              );
            } else {
              reject(new Error("Failed to get drawing context"));
            }
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => {
          reject(new Error("Failed to load image"));
        };

        img.src = URL.createObjectURL(file);
      });
    },
    []
  );

  const handleFilesSelected = useCallback(
    async (selectedFiles: FileList | File[]) => {
      const imageFiles = Array.from(selectedFiles).filter((file) =>
        file.type.startsWith("image/")
      );

      if (imageFiles.length === 0) return;

      const newFiles: ConvertedFile[] = imageFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        originalFile: file,
        originalType: file.type,
        status: "converting",
      }));

      // Добавляем файлы в состояние
      setFiles((prev) => [...prev, ...newFiles]);

      // Конвертируем каждый файл
      for (const newFile of newFiles) {
        try {
          const { url, size } = await convertToWebP(
            newFile.originalFile,
            quality
          );

          setFiles((prev) =>
            prev.map((f) =>
              f.id === newFile.id
                ? {
                    ...f,
                    status: "converted",
                    convertedUrl: url,
                    convertedSize: size,
                  }
                : f
            )
          );
        } catch (error) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === newFile.id
                ? {
                    ...f,
                    status: "error",
                    error:
                      error instanceof Error ? error.message : "Unknown error",
                  }
                : f
            )
          );
        }
      }
    },
    [convertToWebP, quality]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(e.target.files);
      e.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      handleFilesSelected(droppedFiles);
    }
  };

  const removeFile = (id: string) => {
    const fileToRemove = files.find((f) => f.id === id);
    if (fileToRemove?.convertedUrl) {
      URL.revokeObjectURL(fileToRemove.convertedUrl);
    }
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusIcon = (status: ConvertedFile["status"]) => {
    switch (status) {
      case "converted":
        return <Check className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "converting":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  // Очищаем объектные URL при размонтировании компонента
  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.convertedUrl) {
          URL.revokeObjectURL(file.convertedUrl);
        }
      });
    };
  }, [files]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <h1 className="text-3xl font-bold text-center mb-2">Converter to WebP</h1>
      <p className="text-center text-muted-foreground mb-8">
        Upload your images - they will be automatically converted to WebP
      </p>

      <Card className="mb-8">
        <CardHeader>

          <CardTitle className="flex items-center gap-2"><Code /> All code published on github</CardTitle>
          <CardDescription>
            <a
              href="https://github.com/luchanso/webp"
              className="underline"
              target="_blank"
            >
              https://github.com/luchanso/webp
            </a>{' '}and we don&apos;t using cookies
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="w-full mx-auto">
        <CardHeader>
          <CardTitle>Drag and drop images</CardTitle>
          <CardDescription>
            Files will start converting automatically immediately after
            uploading
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-muted-foreground/25"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium mb-1">Drag and drop images here</p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to select files
            </p>
            <Button>Select files</Button>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          <QualitySelector quality={quality} onQualityChange={setQuality} />

          {files.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Files ({files.length})</h3>
                <Button
                  variant="outline"
                  onClick={() => {
                    files.forEach((f) => {
                      if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
                    });
                    setFiles([]);
                  }}
                >
                  Clean All
                </Button>
              </div>

              <div className="space-y-3">
                {files.map((file) => (
                  <div key={file.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium truncate">
                          {file.originalFile.name}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          ({formatFileSize(file.originalFile.size)})
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(file.status)}
                        <span className="text-xs">
                          {file.status === "converting" && "Конвертируется..."}
                          {file.status === "converted" && (
                            <span className="text-green-600">
                              Done • {formatFileSize(file.convertedSize || 0)}
                              {file.convertedSize && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  (
                                  {Math.round(
                                    (file.convertedSize /
                                      file.originalFile.size) *
                                      100
                                  )}
                                  %)
                                </span>
                              )}
                            </span>
                          )}
                          {file.status === "error" && (
                            <span className="text-red-600">{file.error}</span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {file.status === "converted" && file.convertedUrl && (
                          <Button
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = file.convertedUrl!;
                              link.download = `${
                                file.originalFile.name.split(".")[0]
                              }.webp`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-6 p-3 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Info</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• WebP provides 25-34% smaller file size compared to JPEG</li>
              <li>• Supported formats: JPEG, PNG, BMP, GIF (first frame)</li>
              <li>• All conversions occur locally in your browser</li>
              <li>
                • Files are not downloaded anywhere and remain on your device
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
