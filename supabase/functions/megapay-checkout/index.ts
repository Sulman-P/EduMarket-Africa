// Deploy with verify_jwt = false because /webhook is gateway-to-server.
// The handler authenticates /initiate itself and verifies the raw webhook body.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") ?? "",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Vary": "Origin",
};

type CheckoutRequest = { resource_id: string; currency: "KES" | "USD"; return_url: string };
type MegapayCheckout = { reference: string; checkout_url: string };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function isValidWebhookSignature(rawBody: string, supplied: string | null) {
  if (!supplied) return false;
  const secret = Deno.env.get("MEGAPAY_WEBHOOK_SECRET");
  if (!secret) throw new Error("MEGAPAY_WEBHOOK_SECRET is not configured");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody)));
  // Fixed length HMAC values; subtle.verify avoids a short-circuit string comparison.
  return crypto.subtle.timingSafeEqual
    ? crypto.subtle.timingSafeEqual(new TextEncoder().encode(expected), new TextEncoder().encode(supplied.replace(/^sha256=/, "")))
    : expected === supplied.replace(/^sha256=/, "");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(request.url);
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  try {
    if (url.pathname.endsWith("/download")) {
      if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
      const authorization = request.headers.get("Authorization");
      const resourceId = url.searchParams.get("resource_id");
      if (!authorization?.startsWith("Bearer ") || !resourceId) return json({ error: "Sign in required" }, 401);
      const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
      const { data: allowed, error: allowedError } = await userClient.rpc("can_download_resource", { p_resource_id: resourceId });
      if (allowedError || !allowed) return json({ error: "Purchase required" }, 403);
      const { data: resource, error: resourceError } = await admin.from("resources").select("file_url").eq("id", resourceId).single();
      if (resourceError || !resource) return json({ error: "Resource not found" }, 404);
      const { data: signed, error: signedError } = await admin.storage.from(Deno.env.get("RESOURCE_BUCKET")!).createSignedUrl(resource.file_url, 60);
      if (signedError || !signed) throw signedError ?? new Error("Unable to sign file URL");
      return json({ url: signed.signedUrl, expires_in: 60 });
    }
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    if (url.pathname.endsWith("/webhook")) {
      const rawBody = await request.text();
      const signature = request.headers.get(Deno.env.get("MEGAPAY_WEBHOOK_SIGNATURE_HEADER") ?? "x-megapay-signature");
      if (!(await isValidWebhookSignature(rawBody, signature))) return json({ error: "Invalid signature" }, 401);

      // Map these names to Megapay's documented webhook payload names if they differ.
      const event = JSON.parse(rawBody) as { reference?: string; status?: string };
      if (!event.reference || event.status !== "completed") return json({ received: true });
      const { error } = await admin.from("transactions")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("megapay_reference", event.reference)
        .eq("status", "pending"); // idempotent: only a pending purchase can transition
      if (error) throw error;
      return json({ received: true });
    }

    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "Sign in required" }, 401);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Invalid session" }, 401);

    const input = await request.json() as CheckoutRequest;
    if (!input.resource_id || !["KES", "USD"].includes(input.currency) || !input.return_url?.startsWith(Deno.env.get("SITE_URL")!)) {
      return json({ error: "Invalid checkout request" }, 400);
    }
    const { data: resource, error: resourceError } = await admin.from("resources")
      .select("id,title,price_kes,price_usd,is_published").eq("id", input.resource_id).single();
    if (resourceError || !resource?.is_published) return json({ error: "Resource not available" }, 404);
    const amount = input.currency === "KES" ? resource.price_kes : resource.price_usd;
    if (amount === null) return json({ error: "This currency is unavailable for this resource" }, 400);

    const { data: transaction, error: transactionError } = await admin.from("transactions")
      .insert({ buyer_id: user.id, resource_id: resource.id, amount, currency: input.currency, status: "pending" })
      .select("id").single();
    if (transactionError?.code === "23505") return json({ error: "A checkout is already pending for this resource" }, 409);
    if (transactionError) throw transactionError;

    const megaResponse = await fetch(`${Deno.env.get("MEGAPAY_API_BASE_URL")}/checkout/sessions`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${Deno.env.get("MEGAPAY_API_KEY")}`, "Content-Type": "application/json", "Idempotency-Key": transaction.id },
      body: JSON.stringify({ amount, currency: input.currency, description: resource.title, merchant_reference: transaction.id, callback_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/megapay-checkout/webhook`, return_url: input.return_url }),
    });
    if (!megaResponse.ok) {
      await admin.from("transactions").update({ status: "failed" }).eq("id", transaction.id);
      return json({ error: "Payment provider could not create a checkout" }, 502);
    }
    const checkout = await megaResponse.json() as MegapayCheckout;
    if (!checkout.reference || !checkout.checkout_url) throw new Error("Unexpected Megapay checkout response");
    await admin.from("transactions").update({ megapay_reference: checkout.reference }).eq("id", transaction.id);
    return json({ transaction_id: transaction.id, checkout_url: checkout.checkout_url }, 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "megapay_checkout_error", message: error instanceof Error ? error.message : "Unknown error" }));
    return json({ error: "Unable to process payment request" }, 500);
  }
});
