import { describe, expect, it } from "vitest";
import { BOARD_UNREACHABLE } from "../lib/boardEndpoint";
import { handleBoardProxy, type BoardProxyRequest } from "./boardProxy";

function request(overrides: Partial<BoardProxyRequest> = {}): BoardProxyRequest {
  return {
    method: "GET",
    url: "/api/sb/rest/v1/seasons?select=id&limit=1",
    header: (name) => (name === "apikey" ? "public-anon-key" : name === "authorization" ? "Bearer public-anon-key" : null),
    body: null,
    supabaseUrl: "https://pkxgryaycnwpktsafodk.supabase.co",
    ...overrides,
  };
}

describe("board proxy", () => {
  it("forwards a read to the project and returns the body", async () => {
    const calls: { url: string; apikey: string | null; authorization: string | null }[] = [];
    const result = await handleBoardProxy(request(), async (input, init) => {
      const headers = new Headers(init?.headers);
      calls.push({
        url: String(input),
        apikey: headers.get("apikey"),
        authorization: headers.get("authorization"),
      });
      return new Response(JSON.stringify([{ id: "scouting-mexico-city" }]), {
        status: 200,
        headers: { "content-type": "application/json", "content-range": "0-0/*" },
      });
    });

    expect(calls).toEqual([
      {
        url: "https://pkxgryaycnwpktsafodk.supabase.co/rest/v1/seasons?select=id&limit=1",
        apikey: "public-anon-key",
        authorization: "Bearer public-anon-key",
      },
    ]);
    expect(result.status).toBe(200);
    expect(result.contentRange).toBe("0-0/*");
    expect(JSON.parse(result.body)).toEqual([{ id: "scouting-mexico-city" }]);
  });

  it("forwards an insert body", async () => {
    let sent: string | undefined;
    const result = await handleBoardProxy(
      request({
        method: "POST",
        url: "/api/sb/rest/v1/daily_results",
        body: "{\"player_id\":\"ada\"}",
        header: (name) => (name === "content-type" ? "application/json" : name === "apikey" ? "public-anon-key" : null),
      }),
      async (_input, init) => {
        sent = String(init?.body);
        return new Response("", { status: 201, headers: { "content-type": "application/json" } });
      },
    );

    expect(sent).toBe('{"player_id":"ada"}');
    expect(result.status).toBe(201);
  });

  it("returns a friendly message when the project cannot be reached", async () => {
    const result = await handleBoardProxy(request(), async () => {
      throw new TypeError("Load failed");
    });
    expect(result.status).toBe(502);
    expect(JSON.parse(result.body)).toEqual({ message: BOARD_UNREACHABLE });
    expect(result.body).not.toMatch(/typeerror|load failed/i);
  });

  it("refuses anything that is not the data API", async () => {
    const result = await handleBoardProxy(request({ url: "/api/sb/auth/v1/token", method: "POST", body: "{}" }), async () => {
      throw new Error("should not forward");
    });
    expect(result.status).toBe(404);
  });
});