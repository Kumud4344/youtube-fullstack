import { describe, expect, it } from "vitest";
import { COMMENT_MODERATION_CONFIG } from "@/constants/comments";
import { assertCommentAllowed } from "@/lib/comments/moderation";
import { getTranslationProvider } from "@/lib/translation/provider";

describe("comment moderation", () => {
  it("allows international language text", () => {
    expect(() => assertCommentAllowed("नमस्ते दोस्तों")).not.toThrow();
    expect(() => assertCommentAllowed("வணக்கம் நண்பர்களே")).not.toThrow();
    expect(() => assertCommentAllowed("ಹಲೋ ಸ್ನೇಹಿತರೇ")).not.toThrow();
  });

  it("blocks configured prohibited patterns", () => {
    expect(() => assertCommentAllowed("check http://bit.ly/abc")).toThrow(
      /blocked/i,
    );
  });

  it("uses configurable dislike threshold of 2", () => {
    expect(COMMENT_MODERATION_CONFIG.AUTO_HIDE_DISLIKE_THRESHOLD).toBe(2);
  });
});

describe("translation provider", () => {
  it("returns mock translations without overwriting semantics", async () => {
    const provider = getTranslationProvider();
    const result = await provider.translate({
      text: "Hello friends",
      targetLanguage: "hi",
    });
    expect(result.translatedText).toContain("Hello friends");
    expect(result.targetLanguage).toBe("hi");
    expect(result.provider).toBe("mock");
  });

  it("detects Indic scripts", async () => {
    const provider = getTranslationProvider();
    await expect(provider.detectLanguage("यह एक टिप्पणी है")).resolves.toBe("hi");
    await expect(provider.detectLanguage("இது ஒரு கருத்து")).resolves.toBe("ta");
  });
});
