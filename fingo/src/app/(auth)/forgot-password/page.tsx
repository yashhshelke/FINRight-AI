"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AmbientBackground } from "@/components/shared/ambient-background";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

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
          href="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={16} />
          Back to sign in
        </Link>

        <div className="glass rounded-3xl p-8">
          <h1 className="text-xl font-medium text-text-primary">Reset password</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Enter your email and we&apos;ll send you a verification code
          </p>

          <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" variant="cta" className="w-full" asChild>
              <Link href="/verify-otp">Send code</Link>
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
