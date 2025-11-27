import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: any;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Using environment variables for email configuration
    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    };

    // Only initialize if credentials are provided
    if (emailConfig.auth.user && emailConfig.auth.pass) {
      this.transporter = nodemailer.createTransport(emailConfig);
      this.logger.log('Email service initialized');
    } else {
      this.logger.warn('Email service not initialized - missing SMTP credentials');
    }
  }

  async sendAlertEmail(
    to: string,
    stationName: string,
    alertTitle: string,
    alertMessage: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email service not configured. Skipping email send.');
      return false;
    }

    try {
      const severityColor = {
        low: '#3b82f6',
        medium: '#f59e0b',
        high: '#ef4444',
        critical: '#dc2626',
      };

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; color: white;">🚨 Review Alert</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Station: ${stationName}</p>
          </div>
          
          <div style="background: white; padding: 20px; border: 1px solid #e5e7eb;">
            <div style="background: ${severityColor[severity]}; color: white; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
              <strong>Severity: ${severity.toUpperCase()}</strong>
            </div>
            
            <h3 style="margin-top: 0; color: #1f2937;">${alertTitle}</h3>
            <p style="color: #4b5563; line-height: 1.6;">${alertMessage}</p>
            
            <div style="background: #f9fafb; padding: 15px; border-radius: 4px; border-left: 4px solid #16a34a; margin-top: 20px;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>Time:</strong> ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; color: #6b7280; font-size: 12px;">
            <p style="margin: 0;">Aramco Reviews Enterprise Platform</p>
            <p style="margin: 5px 0 0 0;">© 2024. All rights reserved.</p>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
        to,
        subject: `[${severity.toUpperCase()}] Alert: ${alertTitle} - ${stationName}`,
        html: htmlContent,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error.message);
      return false;
    }
  }

  async sendBulkAlertEmail(
    recipients: string[],
    stationName: string,
    alertTitle: string,
    alertMessage: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const result = await this.sendAlertEmail(recipient, stationName, alertTitle, alertMessage, severity);
      if (result) {
        sent++;
      } else {
        failed++;
      }
    }

    return { sent, failed };
  }

  async sendReviewSummaryEmail(to: string, stationName: string, summaryData: any): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email service not configured. Skipping email send.');
      return false;
    }

    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; color: white;">📊 Review Summary</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Station: ${stationName}</p>
          </div>
          
          <div style="background: white; padding: 20px; border: 1px solid #e5e7eb;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
              <div style="background: #f0fdf4; padding: 15px; border-radius: 4px; border-left: 4px solid #16a34a;">
                <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Average Rating</p>
                <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #16a34a;">${summaryData.avgRating || 'N/A'}</p>
              </div>
              <div style="background: #fef3c7; padding: 15px; border-radius: 4px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Total Reviews</p>
                <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #f59e0b;">${summaryData.totalReviews || 0}</p>
              </div>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6;">Review summary for your station's performance.</p>
          </div>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; color: #6b7280; font-size: 12px;">
            <p style="margin: 0;">Aramco Reviews Enterprise Platform</p>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
        to,
        subject: `📊 Review Summary - ${stationName}`,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Review summary email sent to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send review summary email to ${to}:`, error.message);
      return false;
    }
  }
}
