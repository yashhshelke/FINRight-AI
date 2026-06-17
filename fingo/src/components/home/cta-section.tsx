"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="font-sans text-4xl font-semibold tracking-tight text-text-primary md:text-5xl">
            Start building your
            <br />
            financial future today.
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-lg text-text-secondary">
            Join thousands who trust Fingo to manage their money with clarity and confidence.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button variant="cta" size="lg" asChild>
              <Link href="/register">Start Free</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-text-secondary">
            No credit card required. Free plan available.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
