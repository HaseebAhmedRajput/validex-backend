import { Resend } from "resend";





export async function sendMail(name: string, to: string, otp: number) {
  if (!process.env.RESEND_API_KEY) {
    console.error("Missing RESEND_API_KEY in environment variables");
    throw new Error("Email service configuration error");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const from =
    process.env.EMAIL_FROM || "HAR TECH SOLUTIONS <onboarding@resend.dev>";

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject: "Your Verification Code",

      html: `
      <div style="max-width:600px;margin:auto;font-family:Segoe UI,Roboto,Arial,sans-serif;background:#f5f7fb;padding:24px">
        
        <div style="background:#ffffff;border-radius:10px;overflow:hidden;
                    box-shadow:0 4px 12px rgba(0,0,0,0.08)">

          <!-- Header -->
          <div style="background:#4F46E5;padding:18px;text-align:center;color:#ffffff">
            <h2 style="margin:0;font-size:18px;font-weight:600">
              Verification Code
            </h2>
          </div>

          <!-- Body -->
          <div style="padding:26px;color:#333">
            <p style="margin:0;font-size:14px">
              Hello <strong>${name}</strong>,
            </p>

            <p style="margin-top:14px;font-size:14px;line-height:1.6">
              Use the following one-time password (OTP) to complete your verification process.
            </p>

            <!-- OTP BOX -->
            <div style="text-align:center;margin:24px 0">
              <span style="
                display:inline-block;
                padding:12px 28px;
                font-size:28px;
                font-weight:600;
                letter-spacing:4px;
                color:#4F46E5;
                background:#EEF2FF;
                border-radius:8px">
                ${otp}
              </span>
            </div>

            <p style="font-size:13px;color:#555;text-align:center">
              This code is valid for 10 minutes. Do not share it with anyone.
            </p>

            <hr style="margin:22px 0;border:none;border-top:1px solid #eee" />

            <p style="font-size:12px;color:#888;text-align:center">
              If you did not request this code, please ignore this email.
            </p>

            <p style="font-size:12px;color:#999;text-align:center;margin-top:10px">
              © ${new Date().getFullYear()} HAR TECH SOLUTIONS
            </p>
          </div>
        </div>
      </div>
      `,

      text: `
Hello ${name},

Your verification code is: ${otp}

This code will expire in 10 minutes. Do not share it with anyone.

If you did not request this, please ignore this email.

Regards,
HAR TECH SOLUTIONS
      `,
    });

    if (error) {
      throw new Error(error.message);
    }

    // console.log(`Email sent successfully to ${to}. ID: ${data?.id}`);
    return data;

  } catch (err: any) {
    console.error("Email Service Error:", err.message);
    throw new Error("Failed to send verification email");
  }
}



export async function sendForgetPasswordMail(
  name: string,
  to: string,
  otp: number
) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const from =
    process.env.EMAIL_FROM || "HAR TECH SOLUTIONS <onboarding@resend.dev>";

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject: "Password Reset Verification Code",

      html: `
      <div style="max-width:600px;margin:auto;font-family:Segoe UI,Roboto,Arial,sans-serif;
                  background:#f5f7fb;padding:24px">
        
        <div style="background:#ffffff;border-radius:10px;overflow:hidden;
                    box-shadow:0 4px 12px rgba(0,0,0,0.08)">

          <!-- Header -->
          <div style="background:#4F46E5;padding:18px;text-align:center;color:#ffffff">
            <h2 style="margin:0;font-size:18px;font-weight:600">
              Password Reset Request
            </h2>
          </div>

          <!-- Body -->
          <div style="padding:26px;color:#333">
            <p style="margin:0;font-size:14px">
              Hello <strong>${name}</strong>,
            </p>

            <p style="margin-top:14px;font-size:14px;line-height:1.6">
              We received a request to reset your password. Use the verification code below to proceed.
            </p>

            <!-- OTP BOX -->
            <div style="text-align:center;margin:24px 0">
              <span style="
                display:inline-block;
                padding:12px 28px;
                font-size:28px;
                font-weight:600;
                letter-spacing:5px;
                color:#4F46E5;
                background:#EEF2FF;
                border-radius:8px">
                ${otp}
              </span>
            </div>

            <p style="font-size:13px;color:#555;text-align:center">
              This code will expire in <strong>10 minutes</strong>. Do not share it with anyone.
            </p>

            <hr style="margin:22px 0;border:none;border-top:1px solid #eee" />

            <p style="font-size:13px;color:#666;text-align:center">
              If you did not request a password reset, you can safely ignore this email.
            </p>

            <p style="font-size:12px;color:#999;text-align:center;margin-top:12px">
              © ${new Date().getFullYear()} HAR TECH SOLUTIONS<br/>
              All rights reserved.
            </p>
          </div>
        </div>
      </div>
      `,

      text: `
Hello ${name},

We received a request to reset your password.

Your verification code is: ${otp}

This code will expire in 10 minutes. Do not share it with anyone.

If you did not request this, please ignore this email.

Regards,
HAR TECH SOLUTIONS
      `,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (err: any) {
    console.error("Forget Password Email Error:", err.message);
    throw new Error("Failed to send password reset email");
  }
}


export async function confirmApproval(
  name: string,
  to: string,
) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const from =
    process.env.EMAIL_FROM || "Validex Proctors <onboarding@resend.dev>";

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject: "🎉 Your Teacher Account Has Been Approved!",
      html: `
      <div style="max-width:600px;margin:auto;font-family:Arial,Helvetica,sans-serif;
                  background:#ffffff;border-radius:10px;
                  box-shadow:0 6px 16px rgba(0,0,0,0.08);overflow:hidden">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#4F46E5,#6366F1);
                    padding:20px 24px;color:#ffffff;text-align:center">
          <h2 style="margin:0;font-weight:600">
            ✅ Account Approved
          </h2>
        </div>

        <!-- Body -->
        <div style="padding:28px;color:#333">
          <p style="font-size:16px">Hello <strong>${name}</strong>,</p>

          <p style="margin-top:12px;font-size:15px;line-height:1.6">
            We’re excited to inform you that your account has been 
            <strong>successfully approved as a Teacher</strong> on our platform.
          </p>

          <div style="
              background:#EEF2FF;
              border-left:4px solid #4F46E5;
              padding:16px;
              margin:20px 0;
              border-radius:6px">
            <p style="margin:0;font-size:14px;color:#444">
              You can now access all teaching features, manage your classes, 
              and begin your journey with us.
            </p>
          </div>

          <p style="font-size:15px;line-height:1.6">
            Please log in to your account and explore the available tools 
            designed to help you create a seamless teaching experience.
          </p>

          <!-- Button -->
          <div style="text-align:center;margin:26px 0">
            <a href="www.validex.online" style="
              display:inline-block;
              padding:12px 24px;
              background:#4F46E5;
              color:#fff;
              text-decoration:none;
              font-size:15px;
              border-radius:6px;
              font-weight:600">
              Go to Dashboard
            </a>
          </div>

          <hr style="margin:24px 0;border:none;border-top:1px solid #eee" />

          <p style="font-size:13px;color:#777">
            Regards,<br/>
            <strong>HAR TECH SOLUTIONS</strong>
          </p>
        </div>
      </div>
      `,
      text: `
Hello ${name},

Congratulations! 🎉

Your account has been successfully approved as a Teacher.

You can now log in and start using the platform to manage your classes and students.

If you have any questions, feel free to contact us.

Regards,
HAR TECH SOLUTIONS
      `,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (err: any) {
    console.error("Approval Email Error:", err.message);
    throw new Error("Failed to send approval email");
  }
}




