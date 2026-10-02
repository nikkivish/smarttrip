import { env, isProd } from '../env';

type Contact = { name: string; phone: string };

type NotifyInput = {
  contacts: Contact[];
  userName: string;
  location: string;
  kind?: 'sos' | 'check-in';
};

/**
 * Delivers alerts to emergency contacts.
 *
 * SMS is provider-specific, so this records the intended message and returns the
 * delivery plan. Wire a real provider (Twilio, MSG91, etc.) in here and the rest of
 * the app is unaffected.
 */
export async function notifyEmergencyContacts(input: NotifyInput): Promise<{
  channel: 'sms';
  delivered: number;
  failed: number;
  simulated: boolean;
  message: string;
  recipients: { name: string; phone: string }[];
}> {
  const isSos = (input.kind ?? 'sos') === 'sos';

  const message = isSos
    ? `URGENT: ${input.userName} triggered a SmartTrip SOS at ${input.location}. Please contact them now.`
    : `${input.userName} checked in safely at ${input.location} using SmartTrip.`;

  // No SMS provider is wired up yet, so nothing is actually sent. Report that
  // honestly: reporting `delivered` for messages that were never transmitted
  // would tell someone their emergency contact had been warned when they had not.
  const providerConfigured = Boolean(
    env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM_NUMBER,
  );

  if (!providerConfigured) {
    if (!isProd) {
      console.log(`[safety] SMS provider not configured; ${input.contacts.length} alert(s) not sent: ${message}`);
    }
    return {
      channel: 'sms',
      delivered: 0,
      failed: input.contacts.length,
      simulated: true,
      message,
      recipients: input.contacts,
    };
  }

  // TODO: send via the configured provider. Until then this branch is unreachable
  // because the values above are only set once a real client is implemented.
  return {
    channel: 'sms',
    delivered: 0,
    failed: input.contacts.length,
    simulated: false,
    message,
    recipients: input.contacts,
  };
}
