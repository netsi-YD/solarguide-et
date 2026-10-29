"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-md py-12">
      <Card className="border-red-200 bg-white text-center">
        <CardContent className="flex flex-col items-center gap-3 py-6">
          <span className="flex size-11 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle className="size-6" />
          </span>
          <h2 className="text-lg font-bold text-slate-900">
            {t.results.errorTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            {t.results.errorDesc}
          </p>
          <Button
            type="button"
            onClick={() => reset()}
            className="mt-2 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <RotateCcw className="size-4" />
            {t.results.retryBtn}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
