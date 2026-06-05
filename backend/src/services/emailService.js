const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,   // Gmail: 앱 비밀번호 사용
  },
});

/**
 * 비밀번호 재설정 이메일 발송
 */
exports.sendPasswordResetEmail = async (toEmail, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  await transporter.sendMail({
    from: `"동아줄 AI" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '[동아줄 AI] 비밀번호 재설정 안내',
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:sans-serif;">
        <h2 style="color:#142755;">비밀번호 재설정</h2>
        <p>아래 버튼을 클릭하여 비밀번호를 재설정하세요.<br/>
        링크는 <strong>1시간</strong> 동안 유효합니다.</p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 24px;background:#142755;color:#fff;
                  border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
          비밀번호 재설정하기
        </a>
        <p style="color:#888;font-size:12px;">
          이 요청을 하지 않으셨다면 이 이메일을 무시하세요.<br/>
          링크: ${resetUrl}
        </p>
      </div>
    `,
  });
};
