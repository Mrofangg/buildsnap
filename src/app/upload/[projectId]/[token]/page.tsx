"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getUploadLinkByToken, incrementLinkUploadCount } from "@/lib/db";
import { ImageUploader } from "@/components/ui/image-uploader";
import { UploadLink } from "@/types";
import { Spinner } from "@/components/ui";
import { ToastProvider } from "@/components/ui/toast";
import { AlertCircle, CheckCircle } from "lucide-react";

function ExternalUploadContent() {
  const params = useParams();
  const projectId = params.projectId as string;
  const token = params.token as string;

  const [link, setLink] = useState<UploadLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [done, setDone] = useState(false);
  const [uploaderName, setUploaderName] = useState("");
  const [nameEntered, setNameEntered] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        const linkData = await getUploadLinkByToken(token);
        if (!linkData || linkData.projectId !== projectId) {
          setInvalid(true);
        } else {
          setLink(linkData);
        }
      } catch {
        setInvalid(true);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [token, projectId]);

  const handleComplete = async () => {
    await incrementLinkUploadCount(token);
    setDone(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 bg-brand-yellow rounded-2xl flex items-center justify-center">
            <span className="text-xl font-black text-brand-black">B</span>
          </div>
          <Spinner className="w-6 h-6" />
        </div>
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-brand-black">Link ungültig</h1>
          <p className="text-brand-gray-400 text-sm">
            Dieser Upload-Link ist nicht mehr aktiv oder existiert nicht.
            Bitte wende dich an den Projektverantwortlichen.
          </p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm animate-scale-in">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-brand-black">Vielen Dank!</h1>
          <p className="text-brand-gray-400 text-sm">
            Deine Fotos wurden erfolgreich hochgeladen und dem Projektteam übermittelt.
          </p>
          <button
            onClick={() => { setDone(false); }}
            className="mt-2 text-sm font-semibold text-brand-black bg-brand-yellow px-6 py-3 rounded-2xl active:scale-95 transition-all"
          >
            Weitere Fotos hochladen
          </button>
        </div>
      </div>
    );
  }

  // Name entry step
  if (!nameEntered) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="bg-brand-yellow px-6 pt-12 pb-10">
          <div className="w-10 h-10 bg-brand-black rounded-xl flex items-center justify-center mb-4">
            <span className="font-black text-brand-yellow text-lg">B</span>
          </div>
          <h1 className="text-2xl font-black text-brand-black">BuildSnap</h1>
          <p className="text-brand-black/60 text-sm mt-1 font-medium">
            Fotos hochladen
          </p>
        </div>

        <div className="px-6 pt-6 flex-1">
          <div className="bg-brand-gray-50 rounded-2xl px-4 py-3 mb-6">
            <p className="text-xs text-brand-gray-400 font-medium">Projekt</p>
            <p className="font-bold text-brand-black mt-0.5">{link?.projectName}</p>
          </div>

          <h2 className="text-lg font-bold text-brand-black mb-4">
            Kurz vorstellen
          </h2>
          <p className="text-sm text-brand-gray-400 mb-5">
            Wie soll dein Name bei den Fotos erscheinen?
          </p>

          <input
            type="text"
            placeholder="Dein Name (optional)"
            value={uploaderName}
            onChange={(e) => setUploaderName(e.target.value)}
            className="w-full h-12 px-4 rounded-2xl border border-brand-gray-200 bg-white text-brand-black placeholder:text-brand-gray-300 outline-none focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/20 transition-all"
          />

          <button
            onClick={() => setNameEntered(true)}
            className="w-full h-14 bg-brand-yellow text-brand-black font-bold rounded-2xl mt-4 active:scale-95 transition-all shadow-sm text-base"
          >
            Fotos hochladen →
          </button>

          <p className="text-xs text-brand-gray-300 text-center mt-6">
            Kein Login erforderlich · Nur Upload möglich
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-brand-yellow px-6 pt-12 pb-8">
        <div className="w-10 h-10 bg-brand-black rounded-xl flex items-center justify-center mb-4">
          <span className="font-black text-brand-yellow text-lg">B</span>
        </div>
        <h1 className="text-xl font-black text-brand-black">Fotos hochladen</h1>
        <p className="text-brand-black/70 text-sm mt-1 font-medium">{link?.projectName}</p>
      </div>

      <div className="px-4 pt-6 pb-10 flex-1">
        <ImageUploader
          projectId={projectId}
          isExternal={true}
          externalName={uploaderName || "Extern"}
          onComplete={handleComplete}
        />

        <p className="text-xs text-brand-gray-300 text-center mt-6">
          Deine Fotos werden sicher gespeichert. Du siehst keine anderen Inhalte.
        </p>
      </div>
    </div>
  );
}

export default function ExternalUploadPage() {
  return (
    <ToastProvider>
      <ExternalUploadContent />
    </ToastProvider>
  );
}
