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

function getErrorDetails(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    value: String(error),
  };
}

export default {
  async email(message: ForwardableEmailMessage, env: EmailRoutingEnv): Promise<void> {
    const requestId = `email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const startedAt = Date.now();
    const recipients = parseForwardRecipients(env.FORWARD_TO ?? "");

    console.log(`[${requestId}] inbound email received`, {
      from: message.from,
      to: message.to,
      configuredForwardTo: env.FORWARD_TO ?? null,
      parsedRecipientsCount: recipients.length,
    });

    if (recipients.length === 0) {
      console.error(`[${requestId}] no recipients configured; rejecting message`);
      message.setReject("No forwarding addresses configured.");
      return;
    }

    for (const recipient of recipients) {
      if (!SIMPLE_EMAIL_REGEX.test(recipient)) {
        console.error(`[${requestId}] invalid configured recipient; rejecting message`, {
          invalidRecipient: recipient,
        });
        message.setReject(`Invalid forwarding address configured: ${recipient}`);
        return;
      }
    }

    const uniqueRecipients = [...new Set(recipients)];
    console.log(`[${requestId}] validated recipient list`, {
      uniqueRecipients,
      dedupedCount: uniqueRecipients.length,
    });

    const forwardingResults = await Promise.allSettled(
      uniqueRecipients.map(async (recipient) => {
        const recipientStart = Date.now();
        console.log(`[${requestId}] forwarding start`, { recipient });
        await message.forward(recipient);
        const elapsedMs = Date.now() - recipientStart;
        console.log(`[${requestId}] forwarding success`, { recipient, elapsedMs });
      }),
    );

    const failures = forwardingResults
      .map((result, index) => ({ result, recipient: uniqueRecipients[index] }))
      .filter((entry): entry is { result: PromiseRejectedResult; recipient: string } => entry.result.status === "rejected");

    if (failures.length > 0) {
      for (const failure of failures) {
        console.error(`[${requestId}] forwarding failed`, {
          recipient: failure.recipient,
          error: getErrorDetails(failure.result.reason),
        });
      }

      message.setReject(`Forwarding failed for ${failures.length} recipient(s). Check worker logs with requestId=${requestId}.`);
      return;
    }

    console.log(`[${requestId}] forwarding complete`, {
      recipientsForwarded: uniqueRecipients.length,
      totalElapsedMs: Date.now() - startedAt,
    });
  },
};
