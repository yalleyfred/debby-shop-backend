import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { APP_CONFIG } from '../../shared/constants/app.constants';

interface SendOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromAddress: string;
  private readonly appUrl: string;
  private readonly adminEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.fromAddress =
      this.configService.get<string>(APP_CONFIG.SMTP_FROM) ??
      'noreply@debbyshop.com';
    this.appUrl =
      this.configService.get<string>(APP_CONFIG.APP_URL) ??
      'http://localhost:3000';
    this.adminEmail =
      this.configService.get<string>(APP_CONFIG.ADMIN_EMAIL) ??
      'admin@debbyshop.com';

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>(APP_CONFIG.SMTP_HOST),
      port: this.configService.get<number>(APP_CONFIG.SMTP_PORT) ?? 587,
      secure: false,
      auth: {
        user: this.configService.get<string>(APP_CONFIG.SMTP_USER),
        pass: this.configService.get<string>(APP_CONFIG.SMTP_PASS),
      },
    });
  }

  public async sendPasswordReset(
    to: string,
    firstName: string,
    token: string,
  ): Promise<void> {
    const url = `${this.appUrl}/reset-password?token=${token}`;
    await this.send({
      to,
      subject: 'Reset your Debby Shop password',
      text: `Hi ${firstName},\n\nReset your password (expires in 1 hour):\n${url}\n\nIf you did not request this, ignore this email.`,
      html: `<p>Hi <strong>${firstName}</strong>,</p>
             <p>Click the link below to reset your password. This link expires in <strong>1 hour</strong>.</p>
             <p><a href="${url}">${url}</a></p>
             <p>If you did not request this, you can safely ignore this email.</p>`,
    });
  }

  public async sendEmailVerification(
    to: string,
    firstName: string,
    token: string,
  ): Promise<void> {
    const url = `${this.appUrl}/verify-email?token=${token}`;
    await this.send({
      to,
      subject: 'Verify your Debby Shop email address',
      text: `Hi ${firstName},\n\nVerify your email address:\n${url}`,
      html: `<p>Hi <strong>${firstName}</strong>,</p>
             <p>Please verify your email address by clicking the link below:</p>
             <p><a href="${url}">Verify Email</a></p>`,
    });
  }

  public async sendOrderConfirmation(
    to: string,
    firstName: string,
    orderId: string,
    total: number,
  ): Promise<void> {
    const url = `${this.appUrl}/orders/${orderId}`;
    await this.send({
      to,
      subject: 'Your Debby Shop order is confirmed',
      text: `Hi ${firstName},\n\nThank you for your order!\n\nOrder ID: ${orderId}\nTotal: $${total.toFixed(2)}\n\nTrack your order: ${url}`,
      html: `<p>Hi <strong>${firstName}</strong>,</p>
             <p>Thank you for your order!</p>
             <table cellpadding="6">
               <tr><td><strong>Order ID:</strong></td><td>${orderId}</td></tr>
               <tr><td><strong>Total:</strong></td><td>$${total.toFixed(2)}</td></tr>
             </table>
             <p><a href="${url}">Track your order</a></p>`,
    });
  }

  public async sendCustomEmail(
    to: string,
    subject: string,
    message: string,
  ): Promise<void> {
    await this.send({
      to,
      subject,
      text: message,
      html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
    });
  }

  public async sendContactNotification(
    name: string,
    email: string,
    subject: string,
    message: string,
  ): Promise<void> {
    await this.send({
      to: this.adminEmail,
      subject: `Contact form: ${subject}`,
      text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
      html: `<p><strong>New contact form submission</strong></p>
             <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
             <p><strong>Subject:</strong> ${subject}</p>
             <hr>
             <p>${message.replace(/\n/g, '<br>')}</p>`,
    });
  }

  public async sendNewsletterConfirmation(to: string): Promise<void> {
    await this.send({
      to,
      subject: "You're subscribed to Debby Shop updates",
      text: "Thanks for subscribing! You'll receive updates on new products and promotions.",
      html: `<p>Thanks for subscribing to <strong>Debby Shop</strong>!</p>
             <p>You'll receive updates on new products, promotions, and more.</p>`,
    });
  }

  public async sendAdminPasswordResetLink(
    to: string,
    firstName: string,
    token: string,
  ): Promise<void> {
    const url = `${this.appUrl}/reset-password?token=${token}`;
    await this.send({
      to,
      subject: 'Your Debby Shop password has been reset by an admin',
      text: `Hi ${firstName},\n\nAn admin has initiated a password reset for your account.\n\nUse the link below to set a new password (expires in 1 hour):\n${url}`,
      html: `<p>Hi <strong>${firstName}</strong>,</p>
             <p>An admin has initiated a password reset for your account.</p>
             <p>Use the link below to set a new password. This link expires in <strong>1 hour</strong>.</p>
             <p><a href="${url}">Set new password</a></p>`,
    });
  }

  private async send(opts: SendOptions): Promise<void> {
    try {
      await this.transporter.sendMail({ from: this.fromAddress, ...opts });
    } catch (err) {
      // Log but never throw — email failures must not break the main request
      this.logger.error(`Failed to send email to ${opts.to}: ${String(err)}`);
    }
  }
}
