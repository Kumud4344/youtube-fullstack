export type TranslationRequest = {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
};

export type TranslationResult = {
  translatedText: string;
  detectedLanguage: string;
  targetLanguage: string;
  provider: "mock" | "live";
};

export interface TranslationProvider {
  translate(input: TranslationRequest): Promise<TranslationResult>;
  detectLanguage(text: string): Promise<string>;
}

function detectScriptLanguage(text: string): string {
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta";
  if (/[\u0C00-\u0C7F]/.test(text)) return "te";
  if (/[\u0D00-\u0D7F]/.test(text)) return "ml";
  if (/[\u0C80-\u0CFF]/.test(text)) return "kn";
  if (/[\u0980-\u09FF]/.test(text)) return "bn";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  return "en";
}

class MockTranslationProvider implements TranslationProvider {
  async detectLanguage(text: string): Promise<string> {
    return detectScriptLanguage(text);
  }

  async translate(input: TranslationRequest): Promise<TranslationResult> {
    const detectedLanguage =
      input.sourceLanguage && input.sourceLanguage !== "und"
        ? input.sourceLanguage
        : await this.detectLanguage(input.text);

    if (detectedLanguage === input.targetLanguage) {
      return {
        translatedText: input.text,
        detectedLanguage,
        targetLanguage: input.targetLanguage,
        provider: "mock",
      };
    }

    return {
      translatedText: `[${input.targetLanguage}] ${input.text}`,
      detectedLanguage,
      targetLanguage: input.targetLanguage,
      provider: "mock",
    };
  }
}

class LiveTranslationProvider implements TranslationProvider {
  async detectLanguage(text: string): Promise<string> {
    // Production: call TRANSLATION_API_KEY provider.
    return detectScriptLanguage(text);
  }

  async translate(input: TranslationRequest): Promise<TranslationResult> {
    // Production: integrate real translation API.
    return new MockTranslationProvider().translate(input);
  }
}

export function getTranslationProvider(): TranslationProvider {
  const mode = process.env.TRANSLATION_MODE ?? "mock";
  if (mode === "live") {
    return new LiveTranslationProvider();
  }
  return new MockTranslationProvider();
}
