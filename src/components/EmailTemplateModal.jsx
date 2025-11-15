import React, { useState, useEffect } from 'react'
import './EmailTemplateModal.css'
import { API_URL } from '../config'

const EMAIL_TEMPLATES = {
  followUp: {
    subject: "Follow up - Your photography session",
    body: `Hello {{client_name}},

Thank you for booking your {{session_type}} session with Skylit Photography! We're excited to work with you.

I wanted to check in to see if you have any questions about your upcoming session scheduled for {{date}} at {{time}}.

If you need to make any changes or have any concerns, please don't hesitate to reach out.

Looking forward to capturing your special moments!

Best regards,
Alina Suedbeck
Skylit Photography`
  },
  clientCheckIn: {
    subject: "How are you enjoying your photos?",
    body: `Hello {{first_name}},

I hope you've been loving your photos! I wanted to check in to make sure everything turned out just the way you hoped.

If you'd like to order additional edits, prints, or schedule a new session, I'm here to help.

Thank you again for trusting me to capture your story!

Warmly,
Alina Suedbeck
Skylit Photography`
  },
  reminder: {
    subject: "Reminder: Your photography session is approaching",
    body: `Hello {{client_name}},

This is a friendly reminder that your {{session_type}} photography session is coming up soon!

Session Details:
- Date: {{date}}
- Time: {{time}}
- Location: {{location}}

Please arrive 10 minutes early to ensure we have plenty of time for your session.

If you need to reschedule, please let me know as soon as possible.

See you soon!

Best regards,
Alina Suedbeck
Skylit Photography`
  },
  photosReady: {
    subject: "Your photos are ready! 📸",
    body: `Hello {{client_name}},

Great news! Your {{session_type}} photos are ready for viewing.

You can access your photos by logging into your account on our website:
[Website Link]

Your photos are high-quality and ready for download. If you need any adjustments or have questions about your photos, please don't hesitate to reach out.

Thank you for choosing Skylit Photography!

Best regards,
Alina Suedbeck
Skylit Photography`
  },
  paymentNeeded: {
    subject: "Payment reminder for your photography session",
    body: `Hello {{client_name}},

This is a friendly reminder about payment for your {{session_type}} session on {{date}}.

Invoice Amount: {{quote_amount}}

You can make your payment through Venmo or contact me to arrange another payment method.

Thank you for your business!

Best regards,
Alina Suedbeck
Skylit Photography`
  },
  thankYou: {
    subject: "Thank you for your business!",
    body: `Hello {{client_name}},

Thank you for choosing Skylit Photography for your {{session_type}} session!

I hope you're happy with your photos. It was a pleasure working with you and capturing your special moments.

If you need any retouches or have questions about your photos, please don't hesitate to reach out. I'm always here to help.

Would you like to leave a review? Your feedback helps me grow and improve my services.

Thank you again for your trust in Skylit Photography!

Best regards,
Alina Suedbeck
Skylit Photography`
  },
  reviewRequest: {
    subject: "Share your Skylit Photography experience",
    body: `Hello {{client_name}},

I hope you're loving your photos! If you have a moment, I would truly appreciate it if you could leave a quick review about your experience with Skylit Photography.

Please use the secure link below to leave a star rating and a short testimonial:
{{review_link}}

Your feedback helps me continue growing and supporting other clients.

Thank you so much!

Warmly,
Alina Suedbeck
Skylit Photography`
  },
  referralRequest: {
    subject: "Share the Skylit experience with a friend",
    body: `Hello {{first_name}},

I loved working with you and would be honored to support your friends or family, too. If someone you know is looking for a photographer, I’d be grateful if you shared Skylit Photography with them.

As a thank you, I’m happy to offer both you and your referral a special bonus on your next session.

Let me know if there’s anyone I should reach out to or if you'd like referral cards.

With appreciation,
Alina Suedbeck
Skylit Photography`
  },
  seasonalOffer: {
    subject: "Limited availability: upcoming Skylit sessions",
    body: `Hello {{first_name}},

I'm opening a small number of {{session_type}} sessions for the upcoming season and wanted to invite you before I announce publicly.

If you'd like to lock in your preferred date, reply to this email and I'll send over the next steps.

Can't wait to create more magic with you!

Best,
Alina Suedbeck
Skylit Photography`
  },
  quote: {
    subject: "Your Photography Session Quote - Skylit Photography",
    body: `Hello {{client_name}},

Thank you for your interest in booking a {{session_type}} photography session with Skylit Photography!

I'm excited to work with you and capture your special moments. Below is your personalized quote:

Session Details:
- Session Type: {{session_type}}
- Date: {{date}}
- Time: {{time}}
- Location: {{location}}

Quote Amount: {{quote_amount}}

This quote includes:
- Professional photography session
- High-resolution edited images
- Online gallery access for viewing and downloading

If you have any questions or would like to discuss any additional services or packages, please don't hesitate to reach out. I'm here to help make your session perfect!

To proceed with booking, simply reply to this email or contact me directly. I look forward to working with you!

Best regards,
Alina Suedbeck
Skylit Photography`
  }
}

const TEMPLATE_HINTS = {
  reviewRequest: 'A secure review link will be generated and inserted automatically when this email is sent.',
  referralRequest: 'Encourage happy clients to refer friends. Mention your referral bonus or incentive.',
  seasonalOffer: 'Share an exclusive booking window or mini-session announcement to drive new revenue.'
}

const EmailTemplateModal = ({ session, user, isOpen, onClose, initialTemplate }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplate || 'followUp')
  const [emailData, setEmailData] = useState({ subject: '', body: '' })
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (isOpen && initialTemplate) {
      setSelectedTemplate(initialTemplate)
    }
  }, [isOpen, initialTemplate])

  useEffect(() => {
    if ((session || user) && selectedTemplate && isOpen) {
      fillTemplate(selectedTemplate)
    }
  }, [session, user, selectedTemplate, isOpen])

  const fillTemplate = (templateKey) => {
    const template = EMAIL_TEMPLATES[templateKey]
    if (!template || (!session && !user)) return

    let subject = template.subject
    let body = template.body

    const recipientName = session?.client_name || session?.clientName || user?.name || 'Valued Client'
    const firstName = recipientName?.split(' ')[0] || 'Friend'
    const sessionType = session?.session_type || session?.sessionType || 'photography'
    const sessionDate = session?.date ? new Date(session.date).toLocaleDateString() : ''
    const sessionTime = session?.time || ''
    const sessionLocation = session?.location || ''
    const quoteAmount = session?.quote_amount || session?.quote || ''
    const recipientEmail = session?.client_email || session?.clientEmail || user?.email || ''

    // Replace placeholders
    const replacements = {
      '{{client_name}}': recipientName,
      '{{first_name}}': firstName,
      '{{client_email}}': recipientEmail,
      '{{session_type}}': sessionType,
      '{{date}}': sessionDate || 'your scheduled date',
      '{{time}}': sessionTime || 'your scheduled time',
      '{{location}}': sessionLocation || 'your chosen location',
      '{{quote_amount}}': quoteAmount ? `$${parseFloat(quoteAmount).toFixed(2)}` : 'your balance'
    }

    Object.keys(replacements).forEach(placeholder => {
      subject = subject.replace(placeholder, replacements[placeholder])
      body = body.replace(placeholder, replacements[placeholder])
    })

    setEmailData({ subject, body })
  }

  const handleSend = async () => {
    const recipientEmail = session?.client_email || session?.clientEmail || user?.email || ''
    const recipientName = session?.client_name || session?.clientName || user?.name || 'Valued Client'

    if (!recipientEmail) {
      alert('This user does not have an email address on file.')
      return
    }

    setIsSending(true)
    try {
      if (selectedTemplate === 'reviewRequest') {
        const response = await fetch(`${API_URL}/reviews/invite/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            sessionId: session?.id,
            userId: user?.id || null,
            clientEmail: recipientEmail,
            clientName: recipientName,
            subject: emailData.subject,
            body: emailData.body
          })
        })

        if (response.ok) {
          const data = await response.json()
          const reviewLink = data?.invite?.reviewLink
          alert(reviewLink
            ? `Review request sent successfully!\n\nReview link: ${reviewLink}`
            : 'Review request sent successfully!')
          onClose()
        } else {
          const errorData = await response.json().catch(() => ({}))
          alert(errorData.error || 'Failed to send review request')
        }

        return
      }

      const response = await fetch(`${API_URL}/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          to: recipientEmail,
          subject: emailData.subject,
          body: emailData.body,
          sessionId: session?.id || null
        })
      })

      if (response.ok) {
        alert('Email sent successfully!')
        onClose()
      } else {
        alert('Failed to send email')
      }
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Error sending email')
    } finally {
      setIsSending(false)
    }
  }

  if (!isOpen) return null

  const recipientName = session?.client_name || session?.clientName || user?.name || 'Valued Client'
  const recipientEmail = session?.client_email || session?.clientEmail || user?.email || ''
  const templateHint = TEMPLATE_HINTS[selectedTemplate]

  return (
    <div className="email-template-modal-overlay" onClick={onClose}>
      <div className="email-template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Send Email to {recipientName}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="template-selector">
            <label>Email Template:</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              <option value="followUp">Follow Up</option>
              <option value="clientCheckIn">Post-Session Check-In</option>
              <option value="reminder">Session Reminder</option>
              <option value="photosReady">Photos Are Ready</option>
              <option value="paymentNeeded">Payment Needed</option>
              <option value="thankYou">Thank You</option>
              <option value="reviewRequest">Review Request</option>
              <option value="referralRequest">Request a Referral</option>
              <option value="seasonalOffer">Seasonal Offer</option>
              <option value="quote">Quote</option>
            </select>
          </div>

          {templateHint && (
            <div className="template-help">
              {templateHint}
            </div>
          )}

          <div className="email-fields">
            <div className="form-group">
              <label>To:</label>
              <input
                type="email"
                value={recipientEmail}
                disabled
              />
            </div>

            <div className="form-group">
              <label>Subject:</label>
              <input
                type="text"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Message:</label>
              <textarea
                rows="12"
                value={emailData.body}
                onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button
              className="btn btn-primary"
              onClick={handleSend}
              disabled={isSending}
            >
              {isSending ? 'Sending...' : 'Send Email'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSending}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailTemplateModal

