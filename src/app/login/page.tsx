"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Button, Input } from "@/components/ui";
import { useToast } from "@/components/ui/toast";

const ACTION_CODE_SETTINGS = {
  url: "https://buildsnap.vercel.app/login",
  handleCodeInApp: false,
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace("/projects");
    } catch (err: any) {
      toast("E-Mail oder Passwort falsch", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email, ACTION_CODE_SETTINGS);
      setResetSent(true);
    } catch (err: any) {
      if (err?.code === "auth/invalid-email") {
        toast("Ungültige E-Mail-Adresse", "error");
      } else {
        setResetSent(true);
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-brand-black px-6 pt-16 pb-12 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <img src="/fanger-logo.png" alt="Fanger" className="w-12 h-12 rounded-2xl object-cover shadow-float" />
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">BuildSnap</h1>
            <p className="text-white/50 font-medium text-sm">Fanger Elementtechnik AG</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 pt-8 pb-10 max-w-md w-full mx-auto">
        {!resetMode ? (
          <>
            <h2 className="text-xl font-bold text-brand-black mb-6">Anmelden</h2>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <Input label="E-Mail" type="email" placeholder="name@fanger.ch" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
              <Input label="Passwort" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
              <Button type="submit" variant="primary" size="lg" className="w-full mt-2" loading={loading}>Anmelden</Button>
            </form>
            <button onClick={() => { setResetMode(true); setResetSent(false); }} className="w-full text-center text-sm text-brand-gray-400 mt-5 hover:text-brand-black transition-colors">
              Passwort vergessen?
            </button>
          </>
        ) : (
          <>
            <button onClick={() => { setResetMode(false); setResetSent(false); }} className="flex items-center gap-1 text-sm text-brand-gray-400 mb-6 hover:text-brand-black transition-colors">
              ← Zurück zum Login
            </button>
            <h2 className="text-xl font-bold text-brand-black mb-2">Passwort zurücksetzen</h2>
            {resetSent ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mt-4 text-center">
                <p className="text-2xl mb-2">✉️</p>
                <p className="font-semibold text-green-800">E-Mail gesendet!</p>
                <p className="text-sm text-green-600 mt-1">Falls <strong>{email}</strong> registriert ist, erhältst du in Kürze einen Reset-Link.</p>
                <p className="text-xs text-green-500 mt-2">Bitte auch den Spam-Ordner prüfen.</p>
                <button onClick={() => { setResetMode(false); setResetSent(false); }} className="mt-4 text-sm font-semibold text-brand-black underline">Zurück zum Login</button>
              </div>
            ) : (
              <>
                <p className="text-sm text-brand-gray-400 mb-5">Gib deine E-Mail ein. Du erhältst einen Link zum Zurücksetzen deines Passworts.</p>
                <form onSubmit={handleReset} className="flex flex-col gap-4">
                  <Input label="E-Mail" type="email" placeholder="name@fanger.ch" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
                  <Button type="submit" variant="primary" size="lg" className="w-full" loading={resetLoading}>Reset-Link senden</Button>
                </form>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
