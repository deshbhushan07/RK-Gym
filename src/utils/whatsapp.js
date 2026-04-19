// src/utils/whatsapp.js

const GYM_NAME = 'RK Fitness, Vasagade, Kolhapur';

// Clean phone — remove spaces, dashes, add 91 country code
const cleanPhone = (phone) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return digits;
  return '91' + digits.slice(-10);
};

const openWhatsApp = (phone, message) => {
  const url = `https://wa.me/${cleanPhone(phone)}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

// ── Templates ─────────────────────────────────────────────

export const sendAdmissionMessage = (member, expiryDate) => {
  const msg =
`🏋️ *${GYM_NAME}*
━━━━━━━━━━━━━━━━━━
✅ *Admission Confirmed!*

Hello ${member.name},

Welcome to RK Fitness! Your membership is now active.

📋 *Member ID:* ${member.memberId || '—'}
📦 *Plan:* ${member.plan}
📅 *Join Date:* ${member.joinDate}
📅 *Valid Till:* ${expiryDate}
💰 *Fees:* ₹${member.fees}

💪 Stay consistent. Stay strong!

📍 RK Fitness, Vasagade, Kolhapur
📞 For queries, reply to this message.`;

  openWhatsApp(member.phone, msg);
};

export const sendRenewalMessage = (member, newJoinDate, newExpiryDate) => {
  const msg =
`🏋️ *${GYM_NAME}*
━━━━━━━━━━━━━━━━━━
🔄 *Membership Renewed!*

Hello ${member.name},

Your membership has been successfully renewed.

📋 *Member ID:* ${member.memberId || '—'}
📦 *Plan:* ${member.plan}
📅 *Renewed On:* ${newJoinDate}
📅 *New Expiry:* ${newExpiryDate}
💰 *Fees Paid:* ₹${member.fees}

💪 Keep up the great work!

📍 RK Fitness, Vasagade, Kolhapur`;

  openWhatsApp(member.phone, msg);
};

export const sendExpiryReminderMessage = (member, expiryDate, daysLeft) => {
  const urgency = daysLeft === 0 ? '🚨 EXPIRES TODAY!' : `⚠️ Expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}!`;
  const msg =
`🏋️ *${GYM_NAME}*
━━━━━━━━━━━━━━━━━━
${urgency}

Hello ${member.name},

Your gym membership is about to expire.

📋 *Member ID:* ${member.memberId || '—'}
📦 *Plan:* ${member.plan}
📅 *Expiry Date:* ${expiryDate}

👉 Please renew your membership to continue your fitness journey without interruption.

📍 Visit: RK Fitness, Vasagade, Kolhapur
📞 Contact us to renew now!`;

  openWhatsApp(member.phone, msg);
};

export const sendPaymentReceiptMessage = (member, payment, expiryDate) => {
  const date = payment.createdAt?.toDate
    ? payment.createdAt.toDate().toLocaleDateString('en-IN')
    : new Date().toLocaleDateString('en-IN');

  const msg =
`🏋️ *${GYM_NAME}*
━━━━━━━━━━━━━━━━━━
🧾 *Payment Receipt*

Hello ${member.name},

Payment received. Thank you!

📋 *Member ID:* ${member.memberId || '—'}
🔖 *Receipt No:* ${payment.receiptNo || payment.id?.slice(-6).toUpperCase()}
📅 *Date:* ${date}
📦 *Plan:* ${member.plan}
💰 *Amount:* ₹${payment.amount}
💳 *Method:* ${payment.method?.toUpperCase()}
✅ *Status:* ${payment.status?.toUpperCase()}
📅 *Valid Till:* ${expiryDate}

💪 Thank you for choosing RK Fitness!

📍 RK Fitness, Vasagade, Kolhapur`;

  openWhatsApp(member.phone, msg);
};