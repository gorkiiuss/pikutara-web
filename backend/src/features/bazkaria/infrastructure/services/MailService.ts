import nodemailer from 'nodemailer';

let transporter: any = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return transporter;
}

export class MailService {
  static async sendMail(options: { from: string; to: string; subject: string; html: string }): Promise<void> {
    return new Promise((resolve, reject) => {
      getTransporter().sendMail(options, (error: any, info: any) => {
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
