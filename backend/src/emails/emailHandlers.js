import { resendClient, sender } from "../lib/resend.js";
import { createVerificationEmailTemplate, createVerificationEmailText, createWelcomeEmailTemplate } from "../emails/emailTemplates.js";

export const sendWelcomeEmail = async (email, name, clientURL) => {
  const { data, error } = await resendClient.emails.send({
    from: `${sender.name} <${sender.email}>`,
    to: email,
    subject: "Welcome to Chatify!",
    html: createWelcomeEmailTemplate(name, clientURL),
  });

  if (error) {
    console.error("Error sending welcome email:", error);
    throw new Error("Failed to send welcome email");
  }

  console.log("Welcome Email sent successfully", data);
};

export const sendVerificationEmail = async (email, name, verificationURL) => {
  const { data, error } = await resendClient.emails.send({
    from: `${sender.name} <${sender.email}>`,
    to: email,
    subject: "Verify your SecureChat email",
    html: createVerificationEmailTemplate(name, verificationURL),
    text: createVerificationEmailText(name, verificationURL),
  });

  if (error) {
    console.error("Verification email delivery failed");
    throw new Error("Failed to send verification email");
  }

  return data;
};
