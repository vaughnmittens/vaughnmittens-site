const KIT_FORM_ID = 9683215;

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPost({ request, env }) {
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

  const kitRes = await fetch(`https://api.kit.com/v4/forms/${KIT_FORM_ID}/subscribers`, {
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

  return json({ success: true }, 200);
}
