"use client";

import React, { useCallback, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Camera, ImagePlus, X, CheckCircle, Loader2, Upload } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";
import { uploadImage } from "@/lib/db";
import { useToast } from "./toast";
import { Button } from "./index";

interface UploadFile {
  file: File;
  preview: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

interface ImageUploadProps {
  projectId: string;
  userId?: string;
  userName?: string;
  isExternal?: boolean;
  externalName?: string;
  subFolderId?: string;
  sectionType?: string;
  onComplete?: () => void;
  onClose?: () => void;
}

export function ImageUploader({
  projectId,
  userId,
  userName,
  isExternal,
  externalName,
  subFolderId,
  sectionType,
  onComplete,
  onClose,
}: ImageUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const { toast } = useToast();
  const cameraRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const newFiles = accepted.map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
      progress: 0,
      status: "pending" as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
    noClick: true, // we handle click manually
  });

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);

    const pending = files.filter((f) => f.status === "pending");
    let errors = 0;

    for (let i = 0; i < pending.length; i++) {
      const f = pending[i];
      const fileIdx = files.findIndex((x) => x.preview === f.preview);

      setFiles((prev) =>
        prev.map((x, idx) =>
          idx === fileIdx ? { ...x, status: "uploading" } : x
        )
      );

      try {
        await uploadImage({
          projectId,
          file: f.file,
          userId,
          userName,
          isExternal,
          externalName,
          subFolderId,
          sectionType,
          onProgress: (pct) => {
            setFiles((prev) =>
              prev.map((x, idx) =>
                idx === fileIdx ? { ...x, progress: pct } : x
              )
            );
          },
        });

        setFiles((prev) =>
          prev.map((x, idx) =>
            idx === fileIdx ? { ...x, status: "done", progress: 100 } : x
          )
        );
      } catch (err) {
        errors++;
        setFiles((prev) =>
          prev.map((x, idx) =>
            idx === fileIdx ? { ...x, status: "error", error: "Fehler beim Hochladen" } : x
          )
        );
      }
    }

    setUploading(false);
    setAllDone(true);

    if (errors === 0) {
      toast(`${pending.length} Foto${pending.length > 1 ? "s" : ""} hochgeladen!`, "success");
    } else {
      toast(`${pending.length - errors} hochgeladen, ${errors} fehlgeschlagen`, "error");
    }

    setTimeout(() => {
      onComplete?.();
    }, 1000);
  };

  if (allDone && files.every((f) => f.status === "done")) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 animate-scale-in">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <p className="text-lg font-bold text-brand-black">Fotos hochgeladen!</p>
        <p className="text-sm text-brand-gray-400">
          {files.length} Foto{files.length > 1 ? "s" : ""} erfolgreich gespeichert
        </p>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Schließen
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-3xl transition-all",
          isDragActive
            ? "border-brand-yellow bg-brand-yellow/10 scale-[0.99]"
            : "border-brand-gray-200 bg-brand-gray-50",
          files.length > 0 ? "p-4" : "p-8"
        )}
      >
        <input {...getInputProps()} />

        {files.length === 0 ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-brand-yellow/20 rounded-full flex items-center justify-center">
              <ImagePlus className="w-8 h-8 text-brand-black" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-brand-black">Fotos auswählen</p>
              <p className="text-sm text-brand-gray-400 mt-1">
                Hierher ziehen oder unten tippen
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {files.map((f, i) => (
              <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-brand-gray-100">
                <img
                  src={f.preview}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {f.status === "uploading" && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                    <span className="text-white text-xs font-medium">
                      {Math.round(f.progress)}%
                    </span>
                  </div>
                )}
                {f.status === "done" && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                )}
                {f.status === "pending" && (
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
                {/* Progress bar */}
                {f.status === "uploading" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                    <div
                      className="h-full bg-brand-yellow transition-all"
                      style={{ width: `${f.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Camera */}
        <button
          onClick={() => cameraRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-brand-gray-200 bg-white active:scale-95 transition-all hover:border-brand-yellow"
        >
          <Camera className="w-6 h-6 text-brand-black" />
          <span className="text-sm font-semibold text-brand-black">Kamera</span>
        </button>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) onDrop(Array.from(e.target.files));
          }}
        />

        {/* Gallery */}
        <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-brand-gray-200 bg-white active:scale-95 transition-all hover:border-brand-yellow cursor-pointer">
          <ImagePlus className="w-6 h-6 text-brand-black" />
          <span className="text-sm font-semibold text-brand-black">Galerie</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) onDrop(Array.from(e.target.files));
            }}
          />
        </label>
      </div>

      {files.length > 0 && (
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          loading={uploading}
          onClick={handleUpload}
          disabled={uploading || files.every((f) => f.status !== "pending")}
        >
          <Upload className="w-5 h-5" />
          {files.length === 1
            ? "1 Foto hochladen"
            : `${files.filter(f => f.status === 'pending').length} Fotos hochladen`}
        </Button>
      )}
    </div>
  );
}
