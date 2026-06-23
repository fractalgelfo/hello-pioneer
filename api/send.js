import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, message } = req.body;

  if (!to || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Pioneer Species <onboarding@resend.dev>',
      to,
      subject,
      text: message,
    });

    if (error) return res.status(400).json({ error });

    res.status(200).json({ id: data.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
