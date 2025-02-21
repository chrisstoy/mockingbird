import { APActivity } from 'activitypub-types';

interface DeliveryJob {
  activity: APActivity;
  recipient: string;
  attempts: number;
  lastAttempt?: Date;
  status: 'pending' | 'delivered' | 'failed';
}

export async function queueForFederation(activity: APActivity) {
  return Promise.resolve();
  // TODO - implement this!

  /*
    // Get all recipients from 'to' and 'cc' fields
    const recipients = new Set([
      ...new Array(activity.to).flat(),
      ...new Array(activity.cc).flat(),
    ]);

    // Filter out:
    // 1. Local recipients (same domain)
    // 2. Public timeline marker
    // 3. Invalid URLs
    const remoteRecipients = Array.from(recipients).filter(
      (recipient) =>
        !recipient.startsWith(`https://${this.domain}`) &&
        recipient !== 'https://www.w3.org/ns/activitystreams#Public' &&
        this.isValidUrl(recipient)
    );

    // Create delivery jobs for each recipient
    const deliveryJobs: DeliveryJob[] = remoteRecipients.map((recipient) => ({
      activity,
      recipient,
      attempts: 0,
      status: 'pending',
    }));

    // Store jobs in your queue system
    // Could be Redis, RabbitMQ, database, etc.
    await this.queueJobs(deliveryJobs);
  }

  // Worker process that runs separately from your main server
  async processDeliveryQueue(): Promise<void> {
    while (true) {
      // Get next batch of pending deliveries
      const jobs = await this.getNextPendingJobs();

      for (const job of jobs) {
        try {
          // Get recipient's inbox URL via WebFinger
          const inbox = await this.resolveInbox(job.recipient);

          // Sign the request with your private key
          const signedRequest = await this.signRequest(job.activity);

          // Attempt delivery
          await fetch(inbox, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/activity+json',
              Signature: signedRequest.signature,
              // Other required headers...
            },
            body: JSON.stringify(job.activity),
          });

          // Mark as delivered if successful
          job.status = 'delivered';
        } catch (error) {
          // Handle failed delivery
          job.attempts += 1;
          job.lastAttempt = new Date();

          // If too many attempts, mark as failed
          if (job.attempts >= 10) {
            job.status = 'failed';
          }
        }

        // Update job status in queue
        await this.updateJob(job);
      }

      // Wait a bit before next batch
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    */
}
