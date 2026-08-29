namespace Samsary.Infrastructure.Services;

public static class EmailTemplates
{
    public static string VerificationTemplate => @"
<div style='font-family:Segoe UI, Roboto, Arial; color:#222; padding:24px; background:#f6f8fb;'>
  <div style='max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e6e9ef;'>
    <div style='background:#0b5ed7;padding:18px 24px;color:#fff;font-size:20px;'>
      <strong>Samsarly — Confirm Your Account</strong>
    </div>
    <div style='padding:20px;'>
      <p style='font-size:16px;margin:0 0 12px;'>Hey there, brave internet adventurer!</p>
      <p style='margin:0 0 12px;'>Click the big, shiny button below to confirm your email and prove to the internet you are, in fact, a real human (or an excellent robot impersonator).</p>
      <p style='text-align:center;margin:22px 0;'><a href='{{Link}}' style='display:inline-block;padding:12px 20px;background:#ff6b6b;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;'>Confirm my email</a></p>
      <p style='color:#666;font-size:13px;margin:12px 0 0;'>If that button doesn't work, copy and paste this link into your browser:</p>
      <p style='word-break:break-all;color:#0b5ed7;font-size:13px;'>{{Link}}</p>
      <hr style='border:none;border-top:1px solid #eee;margin:18px 0;' />
      <p style='font-size:13px;color:#666;margin:0;'>Thanks for joining Samsarly — may your listings be ever popular and your inbox spam-free. 🥳</p>
    </div>
  </div>
</div>";

    public static string PasswordResetTemplate => @"
<div style='font-family:Segoe UI, Roboto, Arial; color:#222; padding:24px; background:#fff8f0;'>
  <div style='max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #fde2c7;'>
    <div style='background:#ff7a00;padding:18px 24px;color:#fff;font-size:20px;'>
      <strong>Samsarly — Password Reset</strong>
    </div>
    <div style='padding:20px;'>
      <p style='font-size:16px;margin:0 0 12px;'>Uh-oh — lost keys? No worries.</p>
      <p style='margin:0 0 12px;'>Use the button below to reset your password. If you didn't ask for this, maybe your cat walked over your keyboard. Or maybe someone else tried — ignore this email and carry on with dignity.</p>
      <p style='text-align:center;margin:22px 0;'><a href='{{Link}}' style='display:inline-block;padding:12px 20px;background:#0b5ed7;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;'>Reset my password</a></p>
      <p style='color:#666;font-size:13px;margin:12px 0 0;'>Or paste this link into your browser:</p>
      <p style='word-break:break-all;color:#0b5ed7;font-size:13px;'>{{Link}}</p>
      <hr style='border:none;border-top:1px solid #f0e6de;margin:18px 0;' />
      <p style='font-size:13px;color:#666;margin:0;'>Keep your password secret, like where you hide the good snacks.</p>
    </div>
  </div>
</div>";

    public static string NotificationTemplate => @"
<div style='font-family:Segoe UI, Roboto, Arial; color:#222; padding:24px; background:#f0f9ff;'>
  <div style='max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #dbeefd;'>
    <div style='background:#06b6d4;padding:14px 20px;color:#01303f;font-size:18px;font-weight:600;'>{{Title}}</div>
    <div style='padding:18px;'>
      <p style='margin:0 0 12px;'>Hello {{Name}},</p>
      <div style='background:#f8fafc;border:1px dashed #e1f2f7;padding:12px;border-radius:6px;margin-bottom:12px;'>
        {{Body}}
      </div>
      <p style='font-size:13px;color:#666;'>If this made you smile, consider it our tiny victory over boring email.</p>
    </div>
  </div>
</div>";

    public static string BroadcastTemplate => @"
<div style='font-family:Segoe UI, Roboto, Arial; color:#222; padding:24px; background:#fff7ff;'>
  <div style='max-width:700px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #f0d9ff;'>
    <div style='background:#7c3aed;padding:16px 20px;color:#fff;font-size:20px;font-weight:700;'>{{Title}}</div>
    <div style='padding:18px;'>
      <p style='margin:0 0 12px;'>Heads up! {{Intro}}</p>
      <div style='padding:12px;border-radius:8px;background:linear-gradient(180deg,#fff,#faf5ff);border:1px solid #f3e8ff;'>
        {{Body}}
      </div>
      <p style='font-size:13px;color:#666;margin-top:14px;'>Thanks for being part of Samsarly — you're the reason we add sprinkles to the internet.</p>
    </div>
  </div>
</div>";
}
