import React, { useState, useEffect } from 'react'
import './EmailTemplateModal.css'
import { API_URL } from '../config'

const EMAIL_TEMPLATES = {
  followUp: {
    subject: "Thank you for choosing Skylit Photography!",
    subject: "Follow up - Your Photography Session",
    body: `Hello {{client_name}},

Thank you for booking your {{session_type}} session with Skylit Photography! We're excited to work with you.

I wanted to check in to see if you have any questions about your upcoming session scheduled for {{date}} at {{time}}.

If you need to make any changes or have any concerns, please don't hesitate to reach out.

Looking forward to capturing your special moments!

Best regards,
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
  }
}

const EmailTemplateModal = ({ session, isOpen, onClose }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('followUp')
  const [emailData, setEmailData] = useState({ subject: '', body: '' })
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (session && selectedTemplate) {
      fillTemplate(selectedTemplate)
    }
  }, [session, selectedTemplate])

  const fillTemplate = (templateKey) => {
    const template = EMAIL_TEMPLATES[templateKey]
    if (!template || !session) return

    let subject = template.subject
    let body = template.body

    // Replace placeholders
    const replacements = {
      '{{client_name}}': session.client_name || 'Valued Client',
      '{{session_type}}': session.session_type || 'photography',
      '{{date}}': session.date ? new Date(session.date).toLocaleDateString() : 'your scheduled date',
      '{{time}}': session.time || 'your scheduled time',
      '{{location}}': session.location || 'your chosen location',
      '{{quote_amount}}': session.quote_amount || 'amount'
    }

    Object.keys(replacements).forEach(placeholder => {
      subject = subject.replace(placeholder, replacements[placeholder])
      body = body.replace(placeholder, replacements[placeholder])
    })

    setEmailData({ subject, body })
  }

  const handleSend = async () => {
    setIsSending(true)
    try {
      if (selectedTemplate === 'reviewRequest') {
        const response = await fetch(`${API_URL}/reviews/invite/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            sessionId: session?.id,
            clientEmail: session?.client_email,
            clientName: session?.client_name,
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
          to: session.client_email,
          subject: emailData.subject,
          body: emailData.body,
          sessionId: session.id
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

  return (
    <div className="email-template-modal-overlay" onClick={onClose}>
      <div className="email-template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Send Email to {session?.client_name}</h2>
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
              <option value="reminder">Session Reminder</option>
              <option value="photosReady">Photos Are Ready</option>
              <option value="paymentNeeded">Payment Needed</option>
              <option value="thankYou">Thank You</option>
              <option value="reviewRequest">Review Request</option>
            </select>
          </div>

          {selectedTemplate === 'reviewRequest' && (
            <div className="template-help">
              A secure review link will be generated and inserted automatically when this email is sent.
            </div>
          )}

          <div className="email-fields">
            <div className="form-group">
              <label>To:</label>
              <input
                type="email"
                value={session?.client_email || ''}
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

