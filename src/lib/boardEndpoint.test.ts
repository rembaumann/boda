import { describe, expect, it } from "vitest";
import { sharedBoardUrl, supabaseOrigin, upstreamRestPath } from "./boardEndpoint";

describe("board endpoint", () => {
  it("keeps realtime on the project host and moves REST onto this site", () => {
    const origin = "https://boda-silk-mu.vercel.app";
    expect(
      sharedBoardUrl("https://pkxgryaycnwpktsafodk.supabase.co/rest/v1/daily_results?select=id", origin),
    ).toBe("https://boda-silk-mu.vercel.app/api/sb/rest/v1/daily_results?select=id");
    expect(
      sharedBoardUrl("https://pkxgryaycnwpktsafodk.supabase.co/realtime/v1/websocket?apikey=redacted", origin),
    ).toBe("https://pkxgryaycnwpktsafodk.supabase.co/realtime/v1/websocket?apikey=redacted");
    expect(sharedBoardUrl("https://pkxgryaycnwpktsafodk.supabase.co/rest/v1/seasons", null)).toBe(
      "https://pkxgryaycnwpktsafodk.supabase.co/rest/v1/seasons",
    );
  });

  it("forwards only the data API path", () => {
    expect(upstreamRestPath("/api/sb/rest/v1/seasons?select=id&limit=1")).toBe("/rest/v1/seasons?select=id&limit=1");
    expect(upstreamRestPath("/rest/v1/daily_results")).toBe("/rest/v1/daily_results");
    expect(upstreamRestPath("/api/sb/auth/v1/token")).toBeNull();
    expect(upstreamRestPath("/api/sb/rest/v1/../auth/v1/token")).toBeNull();
    expect(supabaseOrigin("https://pkxgryaycnwpktsafodk.supabase.co")).toBe("https://pkxgryaycnwpktsafodk.supabase.co");
    expect(supabaseOrigin("http://pkxgryaycnwpktsafodk.supabase.co")).toBeNull();
    expect(supabaseOrigin("")).toBeNull();
  });
});
