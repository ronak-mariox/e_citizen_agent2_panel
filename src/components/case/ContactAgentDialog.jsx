import { useState } from 'react';

import { AGENT_1_EMAIL, CONTACT_CHANNELS } from '../../constants/caseDetail.js';
import badgeMail from '../../assets/icons/agent2/case/contact/badge-mail.svg';
import tabNotification from '../../assets/icons/agent2/case/contact/tab-notification.svg';
import tabEmail from '../../assets/icons/agent2/case/contact/tab-email.svg';
import closeIcon from '../../assets/icons/agent2/case/dialog/close.svg';
import sendIcon from '../../assets/icons/agent2/case/dialog/send.svg';

const CHANNEL_ICON = {
  notification: tabNotification,
  email: tabEmail,
};

/* Writing back to Agent 1, raised from the case header.

   An Agent 2 works the department side and Agent 1 holds the citizen, so this
   is the one way back down the chain. The subject is written for the agent
   rather than by them — a message about a case is always about that case. */
export function ContactAgentDialog({ record, onCancel, onSend }) {
  const [channel, setChannel] = useState(CONTACT_CHANNELS[0].id);
  const [subject, setSubject] = useState(`Re: ${record.id} — ${record.service}`);
  const [message, setMessage] = useState('');

  // Only the message is starred; a subject is already filled in.
  const ready = message.trim().length > 0;

  function handleSubmit(event) {
    event.preventDefault();
    if (!ready) return;

    onSend({
      channel,
      to: channel === 'email' ? AGENT_1_EMAIL : null,
      subject: subject.trim(),
      message: message.trim(),
    });
  }

  return (
    <div className="modal" role="presentation" onClick={onCancel}>
      <form
        className="dlg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="dlg__head">
          <div className="dlg__ident">
            <span className="dlg__badge dlg__badge--blue">
              <img src={badgeMail} alt="" width="14.992" height="14.992" />
            </span>

            <div>
              <p className="dlg__title" id="contact-title">
                Contact Agent 1
              </p>
              <p className="dlg__case">
                {record.id} · {record.name}
              </p>
            </div>
          </div>

          <button className="dlg__close" type="button" aria-label="Close" onClick={onCancel}>
            <img src={closeIcon} alt="" width="14.992" height="14.992" />
          </button>
        </div>

        <div className="dlg__body">
          {/* Radios rather than buttons: the two are exclusive, and a keyboard
              should move between them with the arrow keys. */}
          <div className="dlg__tabs" role="radiogroup" aria-label="How to send">
            {CONTACT_CHANNELS.map((option) => (
              <button
                className={
                  channel === option.id ? 'dlg__tab dlg__tab--on' : 'dlg__tab'
                }
                type="button"
                role="radio"
                aria-checked={channel === option.id}
                key={option.id}
                onClick={() => setChannel(option.id)}
              >
                <span
                  className="dlg__tab-icon"
                  style={{
                    maskImage: `url("${CHANNEL_ICON[option.id]}")`,
                    WebkitMaskImage: `url("${CHANNEL_ICON[option.id]}")`,
                  }}
                />
                {option.label}
              </button>
            ))}
          </div>

          {/* Email leaves the building, so it says where to — a notification
              lands in Agent 1's console and needs no address. */}
          {channel === 'email' && (
            <label className="dlg__field">
              <span className="dlg__label">To</span>
              <input
                className="dlg__input dlg__input--locked"
                value={AGENT_1_EMAIL}
                readOnly
              />
            </label>
          )}

          <label className="dlg__field">
            <span className="dlg__label">Subject / Title</span>
            <input
              className="dlg__input"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </label>

          <label className="dlg__field">
            <span className="dlg__label">
              Message <span className="dlg__required">*</span>
            </span>
            <textarea
              className="dlg__input dlg__input--area dlg__input--area-lg"
              value={message}
              required
              placeholder="Type your message to Agent 1…"
              onChange={(event) => setMessage(event.target.value)}
            />
          </label>
        </div>

        <div className="dlg__actions">
          <button className="dlg__cancel" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="dlg__submit dlg__submit--blue" type="submit" disabled={!ready}>
            <img src={sendIcon} alt="" width="13.12" height="13.12" />
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default ContactAgentDialog;
