import { describe, expect, it, vi } from "vitest";
import { OFFLINE_MESSAGE, postFeedback, type FeedbackPayload } from "./feedbackClient";

const payload: FeedbackPayload = {
  kind: "bug",
  description: "The speaker stayed quiet.",
  company: "",
  deviceId: "11111111-1111-1111-1111-111111111111",
  clientRequestId: "22222222-2222-2222-2222-222222222222",
  playerId: "rem",
  screen: "drill",
  mode: "practice",
  seasonId: "scouting-mexico-city",
  deckFile: "scouting-mexico-city",
  phraseId: "cafe",
  drillType: "listen",
  lastAnswer: null,
  online: true,
};

describe("postFeedback", () => {
  it("does not call the network while offline", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const result = await postFeedback(payload, { fetchImpl, online: false });
    expect(result).toEqual({ status: "offline" });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(OFFLINE_MESSAGE).toBe("You're offline, try again when connected.");
  });

  it("reads a configured miss and a created issue id", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (_input, init) => {
      const body = JSON.parse(String(init?.body)) as { kind: string };
      if (body.kind === "feature") {
        return new Response(JSON.stringify({ ok: false, error: "not_configured" }), { status: 503 });
      }
      return new Response(JSON.stringify({ ok: true, identifier: "REM-23" }), { status: 200 });
    });
    await expect(postFeedback({ ...payload, kind: "feature" }, { fetchImpl, online: true })).resolves.toEqual({
      status: "unconfigured",
    });
    await expect(postFeedback(payload, { fetchImpl, online: true })).resolves.toEqual({
      status: "sent",
      identifier: "REM-23",
    });
  });

  it("treats a missing endpoint as not configured and a network failure as an error", async () => {
    const missing = vi.fn<typeof fetch>(async () => new Response("<html></html>", { status: 404 }));
    await expect(postFeedback(payload, { fetchImpl: missing, online: true })).resolves.toEqual({
      status: "unconfigured",
    });
    const down = vi.fn<typeof fetch>(async () => {
      throw new Error("network");
    });
    await expect(postFeedback(payload, { fetchImpl: down, online: true })).resolves.toEqual({ status: "error" });
  });
});
