/**
 * Email Notification System
 *
 * To enable email notifications, you need to:
 * 1. Choose an email service (Resend, SendGrid, etc.)
 * 2. Add the service's API key to your environment variables
 * 3. Implement the sendEmail function below
 *
 * Example with Resend:
 * - npm install resend
 * - Add RESEND_API_KEY to .env
 * - Uncomment and configure the Resend implementation below
 */

// import { Resend } from 'resend';
// const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailNotificationData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email notification
 * Implement this function based on your chosen email service
 */
export async function sendEmail(data: EmailNotificationData): Promise<void> {
  // TODO: Implement with your email service
  // Example with Resend:
  /*
  await resend.emails.send({
    from: 'noreply@yourdomain.com',
    to: data.to,
    subject: data.subject,
    html: data.html,
    text: data.text,
  });
  */

  // For development, just log
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email notification (dev mode):', {
      to: data.to,
      subject: data.subject,
    });
  }
}

/**
 * Email templates for different notification types
 */

export function getOneOnOneSubmittedEmail(
  developerName: string,
  monthYear: string,
  oneOnOneUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">1-on-1 Submitted for Review</h2>
          <p>Hello,</p>
          <p><strong>${developerName}</strong> has submitted their <strong>${monthYear}</strong> 1-on-1 for your review.</p>
          <p style="margin: 30px 0;">
            <a href="${oneOnOneUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Review 1-on-1
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            If you have any questions, please reach out to your team.
          </p>
        </div>
      </body>
    </html>
  `;
}

export function getOneOnOneReviewedEmail(
  managerName: string,
  monthYear: string,
  oneOnOneUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">1-on-1 Reviewed</h2>
          <p>Hello,</p>
          <p><strong>${managerName}</strong> has reviewed your <strong>${monthYear}</strong> 1-on-1.</p>
          <p style="margin: 30px 0;">
            <a href="${oneOnOneUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Feedback
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            Review the feedback and discuss any points during your next meeting.
          </p>
        </div>
      </body>
    </html>
  `;
}

export function getActionItemAssignedEmail(
  description: string,
  dueDate: string | null,
  oneOnOneUrl: string
): string {
  const dueDateText = dueDate
    ? `<p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10b981;">New Action Item Assigned</h2>
          <p>Hello,</p>
          <p>You have been assigned a new action item:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0;"><strong>${description}</strong></p>
            ${dueDateText}
          </div>
          <p style="margin: 30px 0;">
            <a href="${oneOnOneUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Action Item
            </a>
          </p>
        </div>
      </body>
    </html>
  `;
}

export function getActionItemDueSoonEmail(
  description: string,
  daysUntilDue: number,
  oneOnOneUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #f59e0b;">Action Item Due Soon</h2>
          <p>Hello,</p>
          <p>This is a reminder that the following action item is due in <strong>${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}</strong>:</p>
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0;"><strong>${description}</strong></p>
          </div>
          <p style="margin: 30px 0;">
            <a href="${oneOnOneUrl}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Action Item
            </a>
          </p>
        </div>
      </body>
    </html>
  `;
}

export function getActionItemOverdueEmail(
  description: string,
  oneOnOneUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626;">Action Item Overdue</h2>
          <p>Hello,</p>
          <p>The following action item is now <strong>overdue</strong>:</p>
          <div style="background-color: #fee2e2; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 0;"><strong>${description}</strong></p>
          </div>
          <p>Please complete this action item as soon as possible.</p>
          <p style="margin: 30px 0;">
            <a href="${oneOnOneUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Action Item
            </a>
          </p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send notification email based on notification type
 */
export async function sendNotificationEmail(
  recipientEmail: string,
  notificationType: string,
  data: any
): Promise<void> {
  let subject = '';
  let html = '';

  switch (notificationType) {
    case 'one_on_one_submitted':
      subject = '1-on-1 Submitted for Review';
      html = getOneOnOneSubmittedEmail(
        data.developerName,
        data.monthYear,
        data.oneOnOneUrl
      );
      break;

    case 'one_on_one_reviewed':
      subject = 'Your 1-on-1 Has Been Reviewed';
      html = getOneOnOneReviewedEmail(
        data.managerName,
        data.monthYear,
        data.oneOnOneUrl
      );
      break;

    case 'action_item_assigned':
      subject = 'New Action Item Assigned';
      html = getActionItemAssignedEmail(
        data.description,
        data.dueDate,
        data.oneOnOneUrl
      );
      break;

    case 'action_item_due_soon':
      subject = 'Action Item Due Soon';
      html = getActionItemDueSoonEmail(
        data.description,
        data.daysUntilDue,
        data.oneOnOneUrl
      );
      break;

    case 'action_item_overdue':
      subject = 'Action Item Overdue';
      html = getActionItemOverdueEmail(
        data.description,
        data.oneOnOneUrl
      );
      break;

    default:
      return;
  }

  await sendEmail({
    to: recipientEmail,
    subject,
    html,
  });
}
