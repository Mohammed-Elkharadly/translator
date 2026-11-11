import { useCallback, useEffect, useState } from "react";
import type { ModelProgress, ModelState } from "../types";
import {
  loadTranslationModel,
  subscribeToModelProgress,
  translateText,
} from "../services/translation.service";

export function useTranslation() {
  const [modelState, setModelState] = useState<ModelState>("idle");
  const [progress, setProgress] = useState<ModelProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    return subscribeToModelProgress(setProgress);
  }, []);

  const loadModel = useCallback(async () => {
    if (modelState === "loading" || modelState === "ready") return;

    setModelState("loading");
    setError(null);

    try {
      await loadTranslationModel();
      setModelState("ready");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Model loading failed.";
      setError(message);
      setModelState("error");
      throw cause;
    }
  }, [modelState]);

  const translate = useCallback(async (text: string) => {
    setIsTranslating(true);
    setError(null);

    try {
      if (modelState !== "ready") {
        setModelState("loading");
        await loadTranslationModel();
        setModelState("ready");
      }
      return await translateText(text);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Translation failed.";
      setError(message);
      if (!modelState || modelState !== "ready") setModelState("error");
      throw cause;
    } finally {
      setIsTranslating(false);
    }
  }, [modelState]);

  return {
    modelState,
    progress,
    error,
    isTranslating,
    loadModel,
    translate,
  };
}
