import { Resend } from 'resend';

const APP_NAME = 'House of Lotus Canada';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function fromAddress(): string {
  return process.env.RESEND_FROM_ADDRESS || 'House of Lotus <onboarding@houseoflotus.ca>';
}

interface SendParams {
  to: string;
  subject: string;
  html: string;
}

async function send({ to, subject, html }: SendParams) {
  const resend = getResend();
  if (!resend) {
    console.log(`[DEV EMAIL] To: ${to}\nSubject: ${subject}\n---\n${html}`);
    return { success: true, id: 'dev-mode' };
  }
  return resend.emails.send({ from: fromAddress(), to, subject, html });
}

// ─── Templates ────────────────────────────────────────

export async function sendWelcomeEmail(email: string, firstName: string) {
  await send({
    to: email,
    subject: `Welcome to ${APP_NAME}, ${firstName}`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Georgia,serif;color:#151513;background:#f2eee5;padding:40px">
        <h1 style="font-size:28px;font-weight:400;margin-bottom:8px">Welcome, ${firstName}</h1>
        <p style="color:#c99743;font-size:12px;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:32px">${APP_NAME}</p>
        <p>Thank you for creating your account. You're now ready to begin your onboarding.</p>
        <a href="${APP_URL}/onboarding" style="display:inline-block;background:#c99743;color:#14110d;padding:14px 24px;text-transform:uppercase;letter-spacing:0.12em;font-size:11px;font-weight:700;text-decoration:none;border-radius:2px;margin-top:20px">Begin onboarding</a>
        <p style="margin-top:40px;font-size:12px;color:#756e62">House of Lotus Canada · Toronto, Ontario<br/>Built in Canada. Rooted in India.</p>
      </div>
    `,
  });
}

export async function sendOrgSubmittedEmail(email: string, orgName: string) {
  await send({
    to: email,
    subject: `Application received — ${orgName}`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Georgia,serif;color:#151513;background:#f2eee5;padding:40px">
        <h1 style="font-size:28px;font-weight:400">Application Received</h1>
        <p style="color:#c99743;font-size:12px;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:32px">${APP_NAME}</p>
        <p>Your organization <strong>${orgName}</strong> has been submitted for review. We typically respond within 2–3 business days.</p>
        <p>You'll receive an email once your application has been reviewed.</p>
        <p style="margin-top:40px;font-size:12px;color:#756e62">House of Lotus Canada · Toronto, Ontario</p>
      </div>
    `,
  });
}

export async function sendTeamInvitationEmail(email: string, inviterName: string, orgName: string, token: string) {
  const link = `${APP_URL}/sign-in?invite=${token}`;
  await send({
    to: email,
    subject: `You're invited to join ${orgName} on ${APP_NAME}`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Georgia,serif;color:#151513;background:#f2eee5;padding:40px">
        <h1 style="font-size:28px;font-weight:400">You're Invited</h1>
        <p style="color:#c99743;font-size:12px;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:32px">${APP_NAME}</p>
        <p><strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> as a team member.</p>
        <a href="${link}" style="display:inline-block;background:#c99743;color:#14110d;padding:14px 24px;text-transform:uppercase;letter-spacing:0.12em;font-size:11px;font-weight:700;text-decoration:none;border-radius:2px;margin-top:20px">Accept invitation</a>
        <p style="margin-top:40px;font-size:12px;color:#756e62">House of Lotus Canada · Toronto, Ontario</p>
      </div>
    `,
  });
}

export async function sendOrgApprovedEmail(email: string, orgName: string) {
  await send({
    to: email,
    subject: `Your application has been approved — ${orgName}`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Georgia,serif;color:#151513;background:#f2eee5;padding:40px">
        <h1 style="font-size:28px;font-weight:400">Application Approved</h1>
        <p style="color:#c99743;font-size:12px;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:32px">${APP_NAME}</p>
        <p>Congratulations! <strong>${orgName}</strong> has been approved. You now have full access to the sourcing platform.</p>
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#c99743;color:#14110d;padding:14px 24px;text-transform:uppercase;letter-spacing:0.12em;font-size:11px;font-weight:700;text-decoration:none;border-radius:2px;margin-top:20px">Go to dashboard</a>
        <p style="margin-top:40px;font-size:12px;color:#756e62">House of Lotus Canada · Toronto, Ontario</p>
      </div>
    `,
  });
}

export async function sendOrgInfoRequestedEmail(email: string, orgName: string, notes: string) {
  await send({
    to: email,
    subject: `More information requested — ${orgName}`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Georgia,serif;color:#151513;background:#f2eee5;padding:40px">
        <h1 style="font-size:28px;font-weight:400">More Information Needed</h1>
        <p style="color:#c99743;font-size:12px;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:32px">${APP_NAME}</p>
        <p>Your application for <strong>${orgName}</strong> requires additional information before we can proceed.</p>
        <blockquote style="border-left:3px solid #c99743;padding-left:16px;margin:24px 0;color:#524c43;font-style:italic">${notes}</blockquote>
        <a href="${APP_URL}/dashboard/organization" style="display:inline-block;background:#c99743;color:#14110d;padding:14px 24px;text-transform:uppercase;letter-spacing:0.12em;font-size:11px;font-weight:700;text-decoration:none;border-radius:2px;margin-top:20px">Update your application</a>
        <p style="margin-top:40px;font-size:12px;color:#756e62">House of Lotus Canada · Toronto, Ontario</p>
      </div>
    `,
  });
}

export async function sendOrgRejectedEmail(email: string, orgName: string, reason: string) {
  await send({
    to: email,
    subject: `Application update — ${orgName}`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Georgia,serif;color:#151513;background:#f2eee5;padding:40px">
        <h1 style="font-size:28px;font-weight:400">Application Update</h1>
        <p style="color:#c99743;font-size:12px;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:32px">${APP_NAME}</p>
        <p>Thank you for your interest in <strong>${orgName}</strong>. After careful review, we are unable to approve your application at this time.</p>
        <blockquote style="border-left:3px solid #c99743;padding-left:16px;margin:24px 0;color:#524c43;font-style:italic">${reason}</blockquote>
        <p style="margin-top:40px;font-size:12px;color:#756e62">House of Lotus Canada · Toronto, Ontario</p>
      </div>
    `,
  });
}
