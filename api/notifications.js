/**
 * Notification Module
 * Sends alerts via email using Resend
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const ALERT_EMAIL = process.env.ALERT_EMAIL || 'alerts@mindcubby.com';

export async function sendAlert({ subject, errors, checks }) {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn('[Notifications] RESEND_API_KEY not configured - skipping email');
            return;
        }

        const errorList = errors.map(e => `<li>${e}</li>`).join('');
        
        const htmlBody = `
            <html>
                <body style="font-family: Arial, sans-serif; color: #333;">
                    <h2>${subject}</h2>
                    <p>The MindCubby shop health check detected issues:</p>
                    <ul style="background: #f5f5f5; padding: 15px; border-left: 4px solid #ff6b6b;">
                        ${errorList}
                    </ul>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <h3>Status Details:</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background: #f9f9f9;">
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Cache Exists</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${checks.cache_exists ? '✅' : '❌'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Cache Not Expired</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${checks.cache_not_expired ? '✅' : '❌'}</td>
                        </tr>
                        <tr style="background: #f9f9f9;">
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Shop ID Stored</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${checks.shop_id_stored ? '✅' : '❌'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Product Count</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${checks.product_count}</td>
                        </tr>
                    </table>
                    <p style="margin-top: 20px; font-size: 12px; color: #666;">
                        Timestamp: ${checks.timestamp}
                    </p>
                </body>
            </html>
        `;

        console.log('[Notifications] Sending alert to', ALERT_EMAIL);
        
        const response = await resend.emails.send({
            from: 'MindCubby Alerts <onboarding@resend.dev>',
            to: ALERT_EMAIL,
            subject: subject,
            html: htmlBody
        });

        console.log('[Notifications] ✅ Alert sent:', response.id);
        return response;

    } catch (error) {
        console.error('[Notifications] Failed to send alert:', error.message);
        throw error;
    }
}
