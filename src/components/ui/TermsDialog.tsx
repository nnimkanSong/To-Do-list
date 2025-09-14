"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

export function TermsDialog({ children }: { children?: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="px-0 text-sm underline">
          {children ?? "Terms of Service"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
          <DialogDescription>By using this app, you agree:</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm max-h-[300px] overflow-y-auto">
          <p>1) Don’t misuse the service.</p>
          <p>2) Respect others’ rights and privacy.</p>
          <p>3) Terms may change anytime.</p>
          <p>4) Continued use = acceptance.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
