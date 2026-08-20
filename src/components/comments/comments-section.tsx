"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Languages, ThumbsDown, ThumbsUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { SUPPORTED_TRANSLATION_LANGUAGES } from "@/constants/comments";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/utils/cn";

type PublicComment = {
  id: string;
  text: string;
  translatedText?: string;
  translatedLanguage?: string;
  displayMeta: string;
  likes: number;
  dislikes: number;
  viewerReaction?: "like" | "dislike" | null;
  user: { username: string; name: string };
};

export function CommentsSection({ videoId }: { videoId: string }) {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState("en");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isFocused, setIsFocused] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["comments", videoId],
    queryFn: () =>
      apiFetch<{ items: PublicComment[] }>(
        `/api/videos/${videoId}/comments?limit=30`,
      ),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/videos/${videoId}/comments`, {
        method: "POST",
        body: JSON.stringify({ text }),
      }),
    onSuccess: async () => {
      setText("");
      setError(null);
      setIsFocused(false);
      await queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
    },
    onError: (err) => {
      setError(
        err instanceof ApiClientError ? err.message : "Could not post comment.",
      );
    },
  });

  const reactMutation = useMutation({
    mutationFn: ({
      commentId,
      type,
    }: {
      commentId: string;
      type: "like" | "dislike";
    }) =>
      apiFetch(`/api/comments/${commentId}/${type}`, {
        method: "POST",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
    },
  });

  const translateMutation = useMutation({
    mutationFn: (commentId: string) =>
      apiFetch<{ translatedText: string }>(
        `/api/comments/${commentId}/translate`,
        {
          method: "POST",
          body: JSON.stringify({ targetLanguage: targetLang }),
        },
      ),
    onSuccess: (result, commentId) => {
      setTranslations((prev) => ({
        ...prev,
        [commentId]: result.translatedText,
      }));
    },
  });

  const items = useMemo(() => data?.items ?? [], [data?.items]);

  return (
    <section className="space-y-6 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-[#0f0f0f]">
          {items.length} Comments
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <Languages className="h-4 w-4 text-[#606060]" />
          <label htmlFor="translate-lang" className="text-xs text-[#606060]">
            Translate:
          </label>
          <select
            id="translate-lang"
            value={targetLang}
            onChange={(event) => setTargetLang(event.target.value)}
            className="rounded-lg border border-[#cccccc] bg-white px-2 py-1 text-xs text-[#0f0f0f]"
          >
            {SUPPORTED_TRANSLATION_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {user ? (
        <form
          className="flex gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!text.trim()) return;
            createMutation.mutate();
          }}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#cc0000] text-sm font-bold text-white uppercase">
            {user.name.slice(0, 1)}
          </div>
          <div className="flex-1 space-y-2">
            <textarea
              value={text}
              onFocus={() => setIsFocused(true)}
              onChange={(event) => setText(event.target.value)}
              placeholder="Add a comment..."
              rows={isFocused ? 3 : 1}
              className="w-full resize-none border-b border-[#cccccc] bg-transparent py-1 text-sm text-[#0f0f0f] placeholder-[#606060] focus:border-[#0f0f0f] focus:outline-none transition-all"
            />
            {error ? (
              <p className="text-xs text-[#cc0000]" role="alert">
                {error}
              </p>
            ) : null}
            {isFocused ? (
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setText("");
                    setIsFocused(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!text.trim() || createMutation.isPending}
                >
                  {createMutation.isPending ? <Spinner /> : null}
                  Comment
                </Button>
              </div>
            ) : null}
          </div>
        </form>
      ) : (
        <div className="rounded-xl border border-[#e5e5e5] bg-[#f9f9f9] p-4 text-center">
          <p className="text-sm text-[#606060]">
            <Link href="/login" className="font-semibold text-[#065fd4] hover:underline">
              Sign in
            </Link>{" "}
            to join the conversation and leave a comment.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : !items.length ? (
        <p className="text-sm text-[#606060]">No comments yet. Be the first to comment.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((comment) => {
            const translated =
              translations[comment.id] ?? comment.translatedText;
            return (
              <li key={comment.id} className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f2f2f2] text-xs font-bold text-[#0f0f0f]">
                  {comment.user.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#0f0f0f]">
                      @{comment.user.username}
                    </span>
                    <span className="text-[11px] text-[#606060]">
                      {comment.displayMeta}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[#0f0f0f]">
                    {comment.text}
                  </p>
                  {translated ? (
                    <p className="mt-1.5 rounded-lg bg-[#f2f2f2] p-2 text-xs text-[#0f0f0f]">
                      {translated}
                    </p>
                  ) : null}
                  <div className="mt-2 flex items-center gap-1">
                    <button
                      type="button"
                      disabled={!user || reactMutation.isPending}
                      onClick={() =>
                        reactMutation.mutate({
                          commentId: comment.id,
                          type: "like",
                        })
                      }
                      className={cn(
                        "flex items-center gap-1 rounded-full p-1.5 px-2 text-xs text-[#606060] hover:bg-[#f2f2f2] transition",
                        comment.viewerReaction === "like" && "text-[#0f0f0f] font-semibold bg-[#f2f2f2]",
                      )}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span>{comment.likes || ""}</span>
                    </button>
                    <button
                      type="button"
                      disabled={!user || reactMutation.isPending}
                      onClick={() =>
                        reactMutation.mutate({
                          commentId: comment.id,
                          type: "dislike",
                        })
                      }
                      className={cn(
                        "flex items-center gap-1 rounded-full p-1.5 px-2 text-xs text-[#606060] hover:bg-[#f2f2f2] transition",
                        comment.viewerReaction === "dislike" && "text-[#0f0f0f] font-semibold bg-[#f2f2f2]",
                      )}
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                      <span>{comment.dislikes || ""}</span>
                    </button>
                    <button
                      type="button"
                      disabled={translateMutation.isPending}
                      onClick={() => translateMutation.mutate(comment.id)}
                      className="rounded-full px-2.5 py-1 text-xs text-[#606060] hover:bg-[#f2f2f2] transition"
                    >
                      Translate
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
