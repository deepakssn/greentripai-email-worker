type EmailRoutingEnv = {
  FORWARD_TO: string;
};

const SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseForwardRecipients(raw: string): string[] {
  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export default {
  async email(message: ForwardableEmailMessage, env: EmailRoutingEnv): Promise<void> {
    const recipients = parseForwardRecipients(env.FORWARD_TO);

    if (recipients.length === 0) {
      message.setReject("No forwarding addresses configured.");
      return;
    }

    for (const recipient of recipients) {
      if (!SIMPLE_EMAIL_REGEX.test(recipient)) {
        message.setReject(`Invalid forwarding address configured: ${recipient}`);
        return;
      }
    }

    const uniqueRecipients = [...new Set(recipients)];

    await Promise.all(uniqueRecipients.map((recipient) => message.forward(recipient)));
  },
};
