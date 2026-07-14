const VAULT_GUIDE_TAG_ID = 21185241;
const VAULT_GUIDE_LINK = 'https://www.dropbox.com/scl/fo/xor3kq5v04jb5a6baqjdo/ADhtnBU4HEfQ_iAIRqeTyQ0?rlkey=abgqg6g4tndmwdljcxi226pew&dl=1';

function guideEmailHtml() {
  return `
    <p>Hey — that's it, no seven-day email course, no upsell before the thing you actually asked for. Here's the guide.</p>
    <p><a href="${VAULT_GUIDE_LINK}" style="color:#D9366E;font-weight:bold;">Get the Vault guide →</a></p>
    <p>It's every prompt I used to build Vault, in order, so you can build your own version in an afternoon — no code, just you and an AI that's more patient than it has any right to be.</p>
    <p>Stuck somewhere? Hit reply, I actually read these.</p>
    <p>— Vaughn</p>
  `;
}

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleSubscribe(request, env) {
  let email;
  try {
    const body = await request.json();
    email = (body.email || '').trim();
  } catch (e) {
    return json({ error: 'Invalid request body' }, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'A valid email is required' }, 400);
  }

  const kitRes = await fetch('https://api.kit.com/v4/subscribers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Kit-Api-Key': env.KIT_API_KEY
    },
    body: JSON.stringify({ email_address: email })
  });

  if (!kitRes.ok) {
    return json({ error: 'Subscription failed' }, 502);
  }

  const tagRes = await fetch(`https://api.kit.com/v4/tags/${VAULT_GUIDE_TAG_ID}/subscribers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Kit-Api-Key': env.KIT_API_KEY
    },
    body: JSON.stringify({ email_address: email })
  });

  if (!tagRes.ok) {
    return json({ error: 'Tagging failed' }, 502);
  }

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'guide@vaughnmittens.com',
      to: email,
      subject: "Told you it'd be one email",
      html: guideEmailHtml()
    })
  });

  if (!emailRes.ok) {
    return json({ error: 'Guide email failed to send' }, 502);
  }

  return json({ success: true }, 200);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/subscribe') {
      return handleSubscribe(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};
