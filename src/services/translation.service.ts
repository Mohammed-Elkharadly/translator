import { pipeline } from "@huggingface/transformers";
import type { ModelProgress } from "../types";

const MODEL_ID = "Xenova/nllb-200-distilled-600M";

type TranslationOutput = { translation_text: string };
interface TranslationOptions {
  src_lang?: string;
  tgt_lang?: string;
}

type Translator = (
  text: string,
  options?: TranslationOptions,
) => Promise<TranslationOutput[]>;

let translator: Translator | null = null;
let loadingPromise: Promise<Translator> | null = null;
let queue: Promise<void> = Promise.resolve();

const listeners = new Set<(progress: ModelProgress) => void>();

export function subscribeToModelProgress(
  listener: (progress: ModelProgress) => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function createTranslator(): Promise<Translator> {
  const model = await pipeline("translation", MODEL_ID, {
    dtype: "q8",
    progress_callback: (event: { status: string; progress?: number; file?: string }) => {
      const progress: ModelProgress = {
        status: event.status,
        ...(typeof event.progress === "number" ? { progress: event.progress } : {}),
        ...(typeof event.file === "string" ? { file: event.file } : {}),
      };
      listeners.forEach((listener) => listener(progress));
    },
  });

  return model as unknown as Translator;
}

export async function loadTranslationModel(): Promise<void> {
  if (translator) return;

  if (!loadingPromise) {
    loadingPromise = createTranslator()
      .then((model) => {
        translator = model;
        return model;
      })
      .catch((error: unknown) => {
        loadingPromise = null;
        throw error;
      });
  }

  await loadingPromise;
}

export function translateText(text: string): Promise<string> {
  const input = text.trim();
  if (!input) return Promise.reject(new Error("Select some text to translate."));

  const task = queue.then(async () => {
    await loadTranslationModel();
    if (!translator) throw new Error("Translation model is not available.");

    // NLLB requires language parameters
    const result = await translator(input, {
      src_lang: "eng_Latn",  // English
      tgt_lang: "arb_Arab",  // Arabic (Standard)
    });

    const translated = result[0]?.translation_text?.trim();

    if (!translated) throw new Error("The model returned an empty translation.");
    return translated;
  });

  queue = task.then(() => undefined, () => undefined);
  return task;
}
