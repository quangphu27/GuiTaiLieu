import smtplib
import os
from email.message import EmailMessage
from email.policy import SMTPUTF8
from email.header import Header
from email.utils import formataddr
from dotenv import load_dotenv

load_dotenv()

def send_email(to_email, subject, body, attachment_path=None, attachment_name=None):
    try:
        email_user = os.getenv("EMAIL_USER")
        email_password = os.getenv("EMAIL_PASSWORD")

        if not email_user or not email_password:
            print("ERROR: EMAIL_USER hoặc EMAIL_PASSWORD chưa được cấu hình trong .env file")
            return False

        if not to_email:
            print(f"ERROR: Email người nhận không hợp lệ: {to_email}")
            return False

        msg = EmailMessage(policy=SMTPUTF8)

        msg["From"] = formataddr((str(Header("Hệ thống gửi tài liệu", "utf-8")), email_user))
        msg["To"] = to_email
        msg["Subject"] = str(Header(subject, "utf-8"))

        msg.set_content(body, subtype="html", charset="utf-8")

        if attachment_path and os.path.exists(attachment_path):
            filename = attachment_name or os.path.basename(attachment_path)

            with open(attachment_path, "rb") as f:
                file_data = f.read()

            msg.add_attachment(
                file_data,
                maintype="application",
                subtype="octet-stream",
                filename=("utf-8", "", filename)
            )
        elif attachment_path:
            print(f"WARNING: File đính kèm không tồn tại: {attachment_path}")

        print(f"INFO: Đang gửi email đến {to_email}...")
        server = smtplib.SMTP("smtp.gmail.com", 587, local_hostname="localhost")
        server.starttls()
        server.login(email_user, email_password)
        server.send_message(msg)
        server.quit()
        print(f"SUCCESS: Đã gửi email thành công đến {to_email}")

        return True

    except smtplib.SMTPAuthenticationError as e:
        print(f"ERROR: Xác thực email thất bại: {str(e)}")
        return False
    except smtplib.SMTPRecipientsRefused as e:
        print(f"ERROR: Email người nhận không hợp lệ: {str(e)}")
        return False
    except smtplib.SMTPServerDisconnected as e:
        print(f"ERROR: Mất kết nối với SMTP server: {str(e)}")
        return False
    except Exception as e:
        print(f"ERROR: Lỗi gửi email: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def send_document_email(to_email, unit_name, document_name, document_path):
    try:
        if not os.path.exists(document_path):
            return False

        subject = f"Tài liệu mới: {document_name}"

        body = f"""
        <html>
        <body style="font-family: Arial; line-height: 1.6; color: #333;">
            <h2 style="color: #667eea;">Xin chào {unit_name},</h2>
            <p>Bạn có tài liệu mới: <strong style="color: #667eea;">{document_name}</strong></p>
            <p>Tài liệu được đính kèm trong email này.</p>
            <p>Vui lòng kiểm tra phần đính kèm.</p>
            <hr style="border: none; border-top: 1px solid #ddd;">
            <p style="color: #777; font-size: 14px;">Trân trọng,<br>Hệ thống gửi tài liệu</p>
        </body>
        </html>
        """

        file_real_name = (
            document_name
            if "." in document_name
            else f"{document_name}.{document_path.split('.')[-1]}"
        )

        return send_email(to_email, subject, body, document_path, file_real_name)

    except:
        return False
