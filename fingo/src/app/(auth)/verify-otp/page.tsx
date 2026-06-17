"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AmbientBackground } from "@/components/shared/ambient-background";

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      <AmbientBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <Link
          href="/forgot-password"
          className="mb-6 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={16} />
          Back
        </Link>

        <div className="glass rounded-3xl p-8 text-center">
          <h1 className="text-xl font-medium text-text-primary">Verify your email</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Enter the 6-digit code sent to your email
          </p>

          <div className="mt-8 flex justify-center gap-3">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="h-12 w-11 rounded-xl border border-border bg-surface/50 text-center text-lg font-medium text-text-primary focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            ))}
          </div>

          <Button variant="cta" className="mt-8 w-full">
            Verify
          </Button>

          <p className="mt-4 text-xs text-text-secondary">
            Didn&apos;t receive a code?{" "}
            <button className="text-brand-light hover:underline">Resend</button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
