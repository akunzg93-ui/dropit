import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  return await resend.emails.send({
    from: "Dropit <no-reply@drop-itt.com>",
    to,
    subject,
    html,
  });
}