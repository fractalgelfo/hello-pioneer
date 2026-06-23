import { Webhook } from 'svix';

export const config = {
  api: { bodyParser: false },
};

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  const rawBody = await getRawBody(req);

  const wh = new Webhook(secret);
  let event;
  try {
    event = wh.verify(rawBody, {
      'svix-id': req.headers['svix-id'],
      'svix-timestamp': req.headers['svix-timestamp'],
      'svix-signature': req.headers['svix-signature'],
    });
  } catch {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  const { type, data } = event;
  console.log(`[resend webhook] ${type}`, JSON.stringify(data));

  switch (type) {
    case 'email.sent':
      console.log(`Email sent: ${data.email_id} to ${data.to}`);
      break;
    case 'email.delivered':
      console.log(`Email delivered: ${data.email_id} to ${data.to}`);
      break;
    case 'email.bounced':
      console.log(`Email bounced: ${data.email_id} to ${data.to}`);
      break;
    case 'email.complained':
      console.log(`Spam complaint: ${data.email_id} from ${data.to}`);
      break;
    default:
      console.log(`Unhandled event type: ${type}`);
  }

  res.status(200).json({ received: true });
}
