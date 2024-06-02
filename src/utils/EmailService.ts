import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const API_URL = 'https://api.postmarkapp.com/email';
const SERVER_TOKEN = process.env.EMAIL_API_KEY; // Replace with your Postmark server token
const EMAIL_FROM = process.env.EMAIL_FROM; // Replace with your Postmark server token

export async function sendEmail(data: {to: string, subject: string, textBody: string, htmlBody: string}) {
    try {
        const {to, subject, textBody, htmlBody} = data;

        const response = await axios.post(API_URL, {
            From: EMAIL_FROM,
            To: to,
            Subject: subject,
            TextBody: textBody,
            HtmlBody: htmlBody,
            MessageStream: 'outbound'
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Postmark-Server-Token': SERVER_TOKEN
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}
