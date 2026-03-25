import nodemailer from 'nodemailer';

const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';
const APP_URL = process.env.APP_URL || 'https://humeleave.co.za';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1d4ed8,#1e3a8a);padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;">Staff Leave Management</h1>
              <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Dr P Malatji Practice</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
                This is an automated email from the Staff Leave Management System.
                <br>Dr P Malatji Practice &bull; <a href="${APP_URL}" style="color:#3b82f6;text-decoration:none;">humeleave.co.za</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

interface LeaveDetails {
  id: number;
  staffName: string;
  staffEmail: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
}

export async function sendLeaveRequestToAdmin(leave: LeaveDetails): Promise<void> {
  const approveUrl = `${APP_URL}/admin/requests?action=approve&id=${leave.id}`;

  const content = `
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;">New Leave Request</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:14px;">A staff member has submitted a new leave request for your review.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;padding:20px;margin-bottom:24px;">
      <tr>
        <td style="padding:6px 12px;color:#64748b;font-size:13px;width:140px;">Staff Member</td>
        <td style="padding:6px 12px;color:#1e293b;font-size:14px;font-weight:600;">${leave.staffName}</td>
      </tr>
      <tr>
        <td style="padding:6px 12px;color:#64748b;font-size:13px;">Leave Type</td>
        <td style="padding:6px 12px;color:#1e293b;font-size:14px;font-weight:600;">
          <span style="background-color:#dbeafe;color:#1d4ed8;padding:3px 10px;border-radius:12px;font-size:12px;">${leave.leaveType}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:6px 12px;color:#64748b;font-size:13px;">Start Date</td>
        <td style="padding:6px 12px;color:#1e293b;font-size:14px;font-weight:600;">${formatDate(leave.startDate)}</td>
      </tr>
      <tr>
        <td style="padding:6px 12px;color:#64748b;font-size:13px;">End Date</td>
        <td style="padding:6px 12px;color:#1e293b;font-size:14px;font-weight:600;">${formatDate(leave.endDate)}</td>
      </tr>
      <tr>
        <td style="padding:6px 12px;color:#64748b;font-size:13px;">Total Days</td>
        <td style="padding:6px 12px;color:#1e293b;font-size:14px;font-weight:600;">${leave.totalDays} business day${leave.totalDays > 1 ? 's' : ''}</td>
      </tr>
      ${leave.reason ? `
      <tr>
        <td style="padding:6px 12px;color:#64748b;font-size:13px;vertical-align:top;">Reason</td>
        <td style="padding:6px 12px;color:#1e293b;font-size:14px;">${leave.reason}</td>
      </tr>` : ''}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${approveUrl}" style="display:inline-block;background-color:#1d4ed8;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
            Review &amp; Approve
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;text-align:center;">
      Or go to <a href="${APP_URL}/admin/requests" style="color:#3b82f6;text-decoration:none;">all pending requests</a>
    </p>
  `;

  try {
    await transporter.sendMail({
      from: `"Staff Leave System" <${SMTP_USER}>`,
      to: `"${ADMIN_NAME}" <${ADMIN_EMAIL}>`,
      subject: `Leave Request: ${leave.staffName} - ${leave.leaveType} (${leave.totalDays} day${leave.totalDays > 1 ? 's' : ''})`,
      html: baseTemplate(content),
    });
    console.log(`Email sent to admin for leave request #${leave.id}`);
  } catch (err) {
    console.error('Failed to send leave request email to admin:', err);
  }
}

interface ApprovalDetails {
  staffName: string;
  staffEmail: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: 'approved' | 'declined';
  declineReason?: string;
  processedByName: string;
}

export async function sendLeaveDecisionToStaff(details: ApprovalDetails): Promise<void> {
  const isApproved = details.status === 'approved';
  const statusColor = isApproved ? '#16a34a' : '#dc2626';
  const statusBg = isApproved ? '#dcfce7' : '#fef2f2';
  const statusText = isApproved ? 'Approved' : 'Declined';
  const emoji = isApproved ? '&#10004;' : '&#10006;';

  const content = `
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;">Leave Request ${statusText}</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:14px;">
      Hi ${details.staffName}, your leave request has been <strong style="color:${statusColor};">${statusText.toLowerCase()}</strong>.
    </p>

    <div style="background-color:${statusBg};border-left:4px solid ${statusColor};padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="margin:0;color:${statusColor};font-size:16px;font-weight:700;">
        ${emoji} ${statusText}
      </p>
      <p style="margin:4px 0 0;color:#64748b;font-size:13px;">Processed by ${details.processedByName}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;padding:20px;margin-bottom:24px;">
      <tr>
        <td style="padding:6px 12px;color:#64748b;font-size:13px;width:140px;">Leave Type</td>
        <td style="padding:6px 12px;color:#1e293b;font-size:14px;font-weight:600;">
          <span style="background-color:#dbeafe;color:#1d4ed8;padding:3px 10px;border-radius:12px;font-size:12px;">${details.leaveType}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:6px 12px;color:#64748b;font-size:13px;">Start Date</td>
        <td style="padding:6px 12px;color:#1e293b;font-size:14px;font-weight:600;">${formatDate(details.startDate)}</td>
      </tr>
      <tr>
        <td style="padding:6px 12px;color:#64748b;font-size:13px;">End Date</td>
        <td style="padding:6px 12px;color:#1e293b;font-size:14px;font-weight:600;">${formatDate(details.endDate)}</td>
      </tr>
      <tr>
        <td style="padding:6px 12px;color:#64748b;font-size:13px;">Total Days</td>
        <td style="padding:6px 12px;color:#1e293b;font-size:14px;font-weight:600;">${details.totalDays} business day${details.totalDays > 1 ? 's' : ''}</td>
      </tr>
      ${details.status === 'declined' && details.declineReason ? `
      <tr>
        <td style="padding:6px 12px;color:#64748b;font-size:13px;vertical-align:top;">Decline Reason</td>
        <td style="padding:6px 12px;color:#dc2626;font-size:14px;">${details.declineReason}</td>
      </tr>` : ''}
    </table>

    ${isApproved ? `
    <p style="margin:0;color:#64748b;font-size:14px;">
      Your leave has been confirmed. You can view your leave history on the
      <a href="${APP_URL}" style="color:#3b82f6;text-decoration:none;">dashboard</a>.
    </p>
    ` : `
    <p style="margin:0;color:#64748b;font-size:14px;">
      If you have questions about this decision, please speak with your manager.
      You can submit a new request on the <a href="${APP_URL}/request" style="color:#3b82f6;text-decoration:none;">leave request page</a>.
    </p>
    `}
  `;

  try {
    await transporter.sendMail({
      from: `"Staff Leave System" <${SMTP_USER}>`,
      to: details.staffEmail,
      subject: `Leave ${statusText}: ${details.leaveType} (${formatDate(details.startDate)} - ${formatDate(details.endDate)})`,
      html: baseTemplate(content),
    });
    console.log(`Decision email sent to ${details.staffEmail}`);
  } catch (err) {
    console.error('Failed to send decision email:', err);
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}
