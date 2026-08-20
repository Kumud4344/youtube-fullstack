"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Phone, Search, UserMinus, UserPlus, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import { getSignalingSocket } from "@/lib/websocket/client";
import { useAuthStore } from "@/stores/auth-store";

type FriendUser = {
  id: string;
  name: string;
  username: string;
  city?: string;
};

type FriendsPayload = {
  friends: FriendUser[];
  requests: {
    incoming: Array<{ id: string; user: FriendUser; createdAt: string }>;
    outgoing: Array<{ id: string; user: FriendUser; createdAt: string }>;
  };
};

export default function FriendsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);
  const [query, setQuery] = useState("");
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    callId: string;
    caller: FriendUser;
  } | null>(null);

  useEffect(() => {
    if (!isLoadingAuth && !user) router.replace("/login");
  }, [isLoadingAuth, router, user]);

  const friendsQuery = useQuery({
    queryKey: ["friends"],
    enabled: Boolean(user),
    queryFn: () => apiFetch<FriendsPayload>("/api/friends"),
  });

  const searchQuery = useQuery({
    queryKey: ["friends-search", query],
    enabled: Boolean(user) && query.trim().length >= 2,
    queryFn: () =>
      apiFetch<{ items: FriendUser[] }>(
        `/api/friends?q=${encodeURIComponent(query.trim())}`,
      ),
  });

  useEffect(() => {
    if (!user) return;
    let socketClean: (() => void) | undefined;

    void (async () => {
      const socket = await getSignalingSocket();
      const onPresence = (payload: {
        online: Array<{ id: string }>;
      }) => {
        setOnlineIds(new Set(payload.online.map((item) => item.id)));
      };
      const onInvite = (payload: {
        callId: string;
        caller: FriendUser;
      }) => {
        setIncomingCall(payload);
      };

      socket.on("presence:update", onPresence);
      socket.on("call:invite", onInvite);
      socketClean = () => {
        socket.off("presence:update", onPresence);
        socket.off("call:invite", onInvite);
      };
    })();

    return () => socketClean?.();
  }, [user]);

  const requestMutation = useMutation({
    mutationFn: (username: string) =>
      apiFetch("/api/friends/request", {
        method: "POST",
        body: JSON.stringify({ username }),
      }),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : "Request failed");
    },
  });

  const respondMutation = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "accept" | "reject";
    }) =>
      apiFetch(`/api/friends/request/${id}`, {
        method: "POST",
        body: JSON.stringify({ action }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (friendId: string) =>
      apiFetch("/api/friends/remove", {
        method: "DELETE",
        body: JSON.stringify({ friendId }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const blockMutation = useMutation({
    mutationFn: (userId: string) =>
      apiFetch("/api/friends/block", {
        method: "POST",
        body: JSON.stringify({ userId }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const callMutation = useMutation({
    mutationFn: async (receiverId: string) => {
      const result = await apiFetch<{ call: { id: string } }>("/api/calls", {
        method: "POST",
        body: JSON.stringify({ receiverId }),
      });
      const socket = await getSignalingSocket();
      socket.emit("call:invite", {
        callId: result.call.id,
        receiverId,
      });
      return result.call.id;
    },
    onSuccess: (callId) => {
      router.push(`/calls/${callId}`);
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : "Call failed");
    },
  });

  const friendIds = useMemo(
    () => new Set((friendsQuery.data?.friends ?? []).map((item) => item.id)),
    [friendsQuery.data?.friends],
  );

  if (isLoadingAuth || !user || friendsQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const friends = friendsQuery.data?.friends ?? [];
  const requests = friendsQuery.data?.requests;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0f0f0f]">Friends & Connections</h1>
        <p className="mt-1 text-sm text-[#606060]">
          Connect with other creators, manage friend requests, and start 1-on-1 video calls.
        </p>
      </div>

      {incomingCall ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <p className="font-bold text-[#0f0f0f]">
            Incoming video call from {incomingCall.caller.name}
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              onClick={async () => {
                const socket = await getSignalingSocket();
                socket.emit("call:accept", {
                  callId: incomingCall.callId,
                  callerId: incomingCall.caller.id,
                });
                await apiFetch(`/api/calls/${incomingCall.callId}`, {
                  method: "PATCH",
                  body: JSON.stringify({ status: "connected" }),
                });
                router.push(`/calls/${incomingCall.callId}`);
              }}
            >
              Accept Call
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                const socket = await getSignalingSocket();
                socket.emit("call:reject", {
                  callId: incomingCall.callId,
                  callerId: incomingCall.caller.id,
                });
                await apiFetch(`/api/calls/${incomingCall.callId}`, {
                  method: "PATCH",
                  body: JSON.stringify({ status: "ended" }),
                });
                setIncomingCall(null);
              }}
            >
              Decline
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-[#e5e5e5] bg-white p-4 shadow-sm">
        <label className="mb-2 flex items-center gap-2 text-xs font-bold text-[#0f0f0f]">
          <Search className="h-4 w-4 text-[#606060]" />
          Find People by Name or @handle
        </label>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search creators..."
        />
        {searchQuery.isFetching ? (
          <div className="mt-3">
            <Spinner />
          </div>
        ) : searchQuery.data?.items.length ? (
          <ul className="mt-3 space-y-2">
            {searchQuery.data.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-[#f9f9f9] border border-[#e5e5e5] px-4 py-2.5"
              >
                <div>
                  <p className="font-semibold text-sm text-[#0f0f0f]">{item.name}</p>
                  <p className="text-xs text-[#606060]">@{item.username}</p>
                </div>
                {friendIds.has(item.id) ? (
                  <span className="text-xs font-semibold text-[#065fd4]">Connected</span>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => requestMutation.mutate(item.username)}
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Friend
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-bold text-[#0f0f0f]">Incoming Requests</h2>
          {!requests?.incoming.length ? (
            <p className="text-xs text-[#606060]">No pending requests.</p>
          ) : (
            <ul className="space-y-2">
              {requests.incoming.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-[#f9f9f9] border border-[#e5e5e5] px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#0f0f0f]">{item.user.name}</p>
                    <p className="text-xs text-[#606060]">
                      @{item.user.username}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      onClick={() =>
                        respondMutation.mutate({
                          id: item.id,
                          action: "accept",
                        })
                      }
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        respondMutation.mutate({
                          id: item.id,
                          action: "reject",
                        })
                      }
                    >
                      Decline
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-[#e5e5e5] bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-bold text-[#0f0f0f]">Sent Requests</h2>
          {!requests?.outgoing.length ? (
            <p className="text-xs text-[#606060]">No pending outgoing requests.</p>
          ) : (
            <ul className="space-y-2">
              {requests.outgoing.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl bg-[#f9f9f9] border border-[#e5e5e5] px-3.5 py-2.5 text-xs text-[#606060]"
                >
                  Waiting for response from @{item.user.username}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-[#0f0f0f]">Friends List ({friends.length})</h2>
        {!friends.length ? (
          <EmptyState
            title="No friends yet."
            description="Use the search bar above to find friends and start chatting or video calling."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {friends.map((friend) => {
              const online = onlineIds.has(friend.id);
              return (
                <li
                  key={friend.id}
                  className="rounded-2xl border border-[#e5e5e5] bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-[#0f0f0f]">{friend.name}</p>
                      <p className="text-xs text-[#606060]">
                        @{friend.username}
                      </p>
                      <p className="mt-1 text-xs">
                        <span
                          className={
                            online ? "text-emerald-600 font-semibold" : "text-[#909090]"
                          }
                        >
                          ● {online ? "Online" : "Offline"}
                        </span>
                      </p>
                    </div>
                    <Link
                      href={`/channel/${friend.username}`}
                      className="text-xs font-semibold text-[#065fd4] hover:underline"
                    >
                      View Channel
                    </Link>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={!online || callMutation.isPending}
                      onClick={() => callMutation.mutate(friend.id)}
                    >
                      <Phone className="h-3.5 w-3.5" />
                      Call
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => removeMutation.mutate(friend.id)}
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => blockMutation.mutate(friend.id)}
                    >
                      <Ban className="h-3.5 w-3.5" />
                      Block
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
