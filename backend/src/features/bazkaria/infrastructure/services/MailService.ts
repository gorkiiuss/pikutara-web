import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export class MailService {
  static async sendMail(options: { from: string; to: string; subject: string; html: string }): Promise<void> {
    return new Promise((resolve, reject) => {
      transporter.sendMail(options, (error: any, info: any) => {
        if (error) {
          console.error('MailService: error sending email:', error);
          reject(error);
        } else {
          console.log('MailService: email sent successfully:', info.response);
          resolve();
        }
      });
    });
  }
}
