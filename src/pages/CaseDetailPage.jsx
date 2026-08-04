import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import { PRIORITY_MODIFIER } from '../constants/dashboard.js';
import {
  DECISIONS,
  REFERENCE_EXAMPLE,
  REMARKS_EXAMPLE,
  STAGE_BY_DECISION,
  STAGE_BY_STEP,
  UPLOAD_SOURCES,
  WORKFLOW_STEPS,
  findCase,
} from '../constants/caseDetail.js';
import { useCases } from '../context/CasesContext.jsx';
import PaymentRequestDialog from '../components/case/PaymentRequestDialog.jsx';
import ExtensionRequestDialog from '../components/case/ExtensionRequestDialog.jsx';
import ContactAgentDialog from '../components/case/ContactAgentDialog.jsx';

import breadcrumbBack from '../assets/icons/agent2/case/breadcrumb-back.svg';
import metaRef from '../assets/icons/agent2/case/meta-ref.svg';
import metaDepartment from '../assets/icons/agent2/case/meta-department.svg';
import metaService from '../assets/icons/agent2/case/meta-service.svg';
import metaDeadline from '../assets/icons/agent2/case/meta-deadline.svg';
import actionContact from '../assets/icons/agent2/case/action-contact.svg';
import actionExtension from '../assets/icons/agent2/case/action-extension.svg';
import actionDownload from '../assets/icons/agent2/case/action-download.svg';
import headRemarks from '../assets/icons/agent2/case/head-remarks.svg';
import headDocuments from '../assets/icons/agent2/case/head-documents.svg';
import headDeadline from '../assets/icons/agent2/case/head-deadline.svg';
import headTimeline from '../assets/icons/agent2/case/head-timeline.svg';
import headStep from '../assets/icons/agent2/case/head-step.svg';
import docFile from '../assets/icons/agent2/case/doc-file.svg';
import docView from '../assets/icons/agent2/case/doc-view.svg';
import docDownload from '../assets/icons/agent2/case/doc-download.svg';
import stepSave from '../assets/icons/agent2/case/step-save.svg';
import headStep2 from '../assets/icons/agent2/case/head-step2.svg';
import headStep3 from '../assets/icons/agent2/case/head-step3.svg';
import headStep4 from '../assets/icons/agent2/case/head-step4.svg';
import uploadPdf from '../assets/icons/agent2/case/upload-pdf.svg';
import uploadImage from '../assets/icons/agent2/case/upload-image.svg';
import uploadCamera from '../assets/icons/agent2/case/upload-camera.svg';
import uploadedFile from '../assets/icons/agent2/case/uploaded-file.svg';
import uploadedView from '../assets/icons/agent2/case/uploaded-view.svg';
import uploadedRemove from '../assets/icons/agent2/case/uploaded-remove.svg';
import headStep5 from '../assets/icons/agent2/case/head-step5.svg';
import completeCheck from '../assets/icons/agent2/case/complete-check.svg';
import modalBadge from '../assets/icons/agent2/case/modal-badge.svg';
import modalUpload from '../assets/icons/agent2/case/modal-upload.svg';
import stepCheck from '../assets/icons/agent2/case/step-check.svg';
import checkWhite from '../assets/icons/agent2/case/check-white.svg';
import backArrow from '../assets/icons/agent2/case/back-arrow.svg';

import '../styles/case.css';

/* One case, opened from the dashboard's Active Cases list.

   The left column is what Agent 1 handed over and cannot be edited here; the
   right column is the only part an Agent 2 acts on, which is why the visit form
   sits alone in it. */
/* Step 1 — the visit itself. Completing it is what moves the case on to the
   submission step, so `onDone` is the only way forward in the workflow. */
function VisitForm({ record, onDone }) {
  const [visit, setVisit] = useState(record.visit);

  const set = (name, value) => setVisit((current) => ({ ...current, [name]: value }));

  // TODO: posts the visit once the agent API exists; the step advances either way.
  function handleSubmit(event) {
    event.preventDefault();
    console.info('save visit', record.id, visit);
    onDone();
  }

  return (
    <form className="dash-card" onSubmit={handleSubmit}>
      <h2 className="case-card__title case-card__title--step">
        <img src={headStep} alt="" width="14.992" height="14.992" />
        Step {record.activeStep} — Government Office Visit
      </h2>

      <div className="case-form">
        <label className="case-field">
          <span className="case-field__label">Office Name</span>
          <input
            className="case-field__input"
            value={visit.office}
            onChange={(event) => set('office', event.target.value)}
          />
        </label>

        <label className="case-field">
          <span className="case-field__label">Officer Name</span>
          <input
            className="case-field__input"
            value={visit.officer}
            onChange={(event) => set('officer', event.target.value)}
          />
        </label>

        <label className="case-field">
          <span className="case-field__label">Visit Date</span>
          <input
            className="case-field__input"
            value={visit.date}
            onChange={(event) => set('date', event.target.value)}
          />
        </label>

        <label className="case-field">
          <span className="case-field__label">Visit Time</span>
          <input
            className="case-field__input"
            value={visit.time}
            onChange={(event) => set('time', event.target.value)}
          />
        </label>

        <label className="case-field case-field--full">
          <span className="case-field__label">Purpose of Visit</span>
          <input
            className="case-field__input"
            value={visit.purpose}
            onChange={(event) => set('purpose', event.target.value)}
          />
        </label>
      </div>

      <div className="case-form__actions">
        <button className="case-submit" type="submit">
          <img src={stepSave} alt="" width="14.992" height="14.992" />
          Save Visit &amp; Continue
        </button>
        <button className="case-draft" type="button">
          Save Draft
        </button>
      </div>
    </form>
  );
}

/* Step 2 — what was actually handed across the counter. The checklist is
   ticked at the desk, so it stays editable rather than being derived from the
   documents Agent 1 sent. */
function SubmissionForm({ record, onBack, onDone }) {
  const [submission, setSubmission] = useState(record.submission);
  const [askingPayment, setAskingPayment] = useState(false);

  const set = (name, value) => setSubmission((current) => ({ ...current, [name]: value }));

  const toggle = (id) =>
    set(
      'checklist',
      submission.checklist.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );

  // TODO: posts the submission once the agent API exists; the step advances
  // either way.
  function handleSubmit(event) {
    event.preventDefault();
    console.info('submit documents', record.id, submission);
    onDone();
  }

  return (
    <form className="dash-card" onSubmit={handleSubmit}>
      <h2 className="case-card__title case-card__title--step">
        <img src={headStep2} alt="" width="14.992" height="14.992" />
        Step 2 — Document Submission
      </h2>

      <p className="case-checklist__title">Submitted Documents Checklist</p>

      <ul className="case-checklist">
        {submission.checklist.map((item) => (
          <li key={item.id}>
            <label className={item.done ? 'check check--done' : 'check'}>
              <input
                className="check__input"
                type="checkbox"
                checked={item.done}
                onChange={() => toggle(item.id)}
              />
              <span className="check__box" aria-hidden="true">
                {item.done && <img src={checkWhite} alt="" width="11.247" height="11.247" />}
              </span>
              <span className="check__label">{item.label}</span>
            </label>
          </li>
        ))}
      </ul>

      <div className="case-form">
        <label className="case-field">
          <span className="case-field__label">Submission Date</span>
          <input
            className="case-field__input"
            value={submission.date}
            onChange={(event) => set('date', event.target.value)}
          />
        </label>

        <label className="case-field">
          <span className="case-field__label">Government Desk / Counter</span>
          <input
            className="case-field__input"
            value={submission.desk}
            onChange={(event) => set('desk', event.target.value)}
          />
        </label>
      </div>

      <div className="case-form__actions">
        <button className="case-submit" type="submit">
          <img src={stepCheck} alt="" width="14.992" height="14.992" />
          Submit &amp; Continue
        </button>
        <button
          className="case-submit case-submit--payment"
          type="button"
          onClick={() => setAskingPayment(true)}
        >
          <img src={stepCheck} alt="" width="14.992" height="14.992" />
          Request Additional Payment
        </button>
        <button className="case-draft case-draft--back" type="button" onClick={onBack}>
          <img src={backArrow} alt="" width="14.992" height="14.992" />
          Back
        </button>
      </div>

      {askingPayment && (
        <PaymentRequestDialog
          record={record}
          onCancel={() => setAskingPayment(false)}
          onSend={(request) => {
            // TODO: posts the request to Agent 1 once the agent API exists.
            console.info('request additional payment', record.id, request);
            setAskingPayment(false);
          }}
        />
      )}
    </form>
  );
}

/* Step 3 — the number the counter gives back. It is the only thing a citizen
   can track the application by, so the field stands alone with nothing else on
   the card to mistype it into. */
function ReferenceForm({ record, onBack, onDone }) {
  const [reference, setReference] = useState('');

  // TODO: posts the reference once the agent API exists; the step advances
  // either way.
  function handleSubmit(event) {
    event.preventDefault();
    console.info('save reference', record.id, reference);
    onDone();
  }

  return (
    <form className="dash-card" onSubmit={handleSubmit}>
      <h2 className="case-card__title case-card__title--step">
        <img src={headStep3} alt="" width="14.992" height="14.992" />
        Step 3 — Government Reference Number
      </h2>

      <p className="case-note">
        Enter the reference number issued by the government office after document submission.
      </p>

      <label className="case-field case-field--stacked">
        <span className="case-field__label">Reference Number</span>
        <input
          className="case-field__input case-field__input--mono"
          value={reference}
          placeholder={REFERENCE_EXAMPLE}
          onChange={(event) => setReference(event.target.value)}
        />
      </label>

      <div className="case-form__actions">
        <button className="case-submit" type="submit">
          <img src={stepCheck} alt="" width="14.992" height="14.992" />
          Save Reference &amp; Continue
        </button>
        <button className="case-draft case-draft--back" type="button" onClick={onBack}>
          <img src={backArrow} alt="" width="14.992" height="14.992" />
          Back
        </button>
      </div>
    </form>
  );
}

const UPLOAD_ICON = { pdf: uploadPdf, image: uploadImage, camera: uploadCamera };

/** Bytes as the design writes them — "1.2 MB", one decimal, never "0.0 MB". */
const fileSize = (bytes) => {
  const mb = bytes / 1024 / 1024;
  if (mb >= 0.1) return `${mb.toFixed(1)} MB`;

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

/* Step 4 — the receipt the counter stamps. Each tile opens a hidden file input
   so the three sources behave like one field with three ways in. */
function AcknowledgementForm({ record, onBack, onDone }) {
  const [file, setFile] = useState(null);

  // TODO: uploads the file once the agent API exists; the step advances either way.
  function handleSubmit(event) {
    event.preventDefault();
    console.info('upload acknowledgement', record.id, file?.name ?? null);
    onDone();
  }

  return (
    <form className="dash-card" onSubmit={handleSubmit}>
      <h2 className="case-card__title case-card__title--step">
        <img src={headStep4} alt="" width="14.992" height="14.992" />
        Step 4 — Upload Acknowledgement
      </h2>

      {/* Once a receipt is attached the three pickers give way to it: there is
          only one acknowledgement, so offering the choices again would invite a
          second one. Removing it brings them back. */}
      {file ? (
        <div className="uploaded">
          <span className="uploaded__icon">
            <img src={uploadedFile} alt="" width="18.749" height="18.749" />
          </span>

          <span className="uploaded__body">
            <span className="uploaded__name">{file.name}</span>
            <span className="uploaded__meta">Uploaded · {fileSize(file.size)}</span>
          </span>

          <span className="uploaded__actions">
            <button className="uploaded__button" type="button" aria-label={`View ${file.name}`}>
              <img src={uploadedView} alt="" width="13.12" height="13.12" />
            </button>
            <button
              className="uploaded__button"
              type="button"
              aria-label={`Remove ${file.name}`}
              onClick={() => setFile(null)}
            >
              <img src={uploadedRemove} alt="" width="13.12" height="13.12" />
            </button>
          </span>
        </div>
      ) : (
        <div className="upload-row">
          {UPLOAD_SOURCES.map((source) => (
            <label className={`upload upload--${source.tone}`} key={source.id}>
              <input
                className="upload__input"
                type="file"
                accept={source.accept}
                capture={source.capture}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <img src={UPLOAD_ICON[source.id]} alt="" width="22.494" height="22.494" />
              <span className="upload__label">{source.label}</span>
            </label>
          ))}
        </div>
      )}

      <div className="case-form__actions">
        <button className="case-submit" type="submit">
          <img src={stepCheck} alt="" width="14.992" height="14.992" />
          Continue
        </button>
        <button className="case-draft case-draft--back" type="button" onClick={onBack}>
          <img src={backArrow} alt="" width="14.992" height="14.992" />
          Back
        </button>
      </div>
    </form>
  );
}

/* Closing a case notifies the citizen and cannot be walked back, so it is
   confirmed rather than done on the first click. The final certificate is
   offered here because this is the last moment anything can be attached. */
function CompleteDialog({ record, decision, onCancel, onConfirm }) {
  const [certificate, setCertificate] = useState(null);
  const verb = decision === 'approved' ? 'approved' : 'rejected';

  return (
    <div className="modal" role="presentation" onClick={onCancel}>
      <div
        className="modal__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="complete-title"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="modal__badge">
          <img src={modalBadge} alt="" width="29.996" height="29.996" />
        </span>

        <h2 className="modal__title" id="complete-title">
          Complete Application?
        </h2>

        <p className="modal__body">
          Government has {verb} <strong>{record.id}</strong>. This will mark the case as completed
          and notify the customer.
        </p>

        <p className="modal__label">Upload Final Certificate (Optional)</p>

        <label className="modal__upload">
          <input
            className="upload__input"
            type="file"
            accept="application/pdf,image/*"
            onChange={(event) => setCertificate(event.target.files?.[0] ?? null)}
          />
          <img src={modalUpload} alt="" width="14.992" height="14.992" />
          {certificate ? certificate.name : 'Upload final certificate'}
        </label>

        <div className="modal__actions">
          <button className="modal__cancel" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="modal__confirm"
            type="button"
            onClick={() => onConfirm(certificate)}
          >
            Complete Case
          </button>
        </div>
      </div>
    </div>
  );
}

/* Step 5 — how the case ends. There is no Continue here: the decision itself
   is the last action, so the two status buttons close the workflow. */
function DecisionForm({ record, decision, onDecide, onBack }) {
  const [remarks, setRemarks] = useState('');
  const [confirming, setConfirming] = useState(false);
  const { closeCase } = useCases();
  const navigate = useNavigate();

  /* TODO: posts the decision once the agent API exists.

     A rejection ends the case there and then — there is no certificate to
     attach and nothing to complete — so it closes and moves to its tab
     immediately. An approval still goes through Mark Complete, because that is
     what notifies the citizen and offers the final certificate. */
  function choose(id) {
    onDecide(id);
    console.info('government decision', record.id, id, remarks);

    if (id === 'rejected') {
      closeCase(record.id, id);
      navigate('/rejected-cases');
    }
  }

  // TODO: posts the closure and the certificate once the agent API exists.
  // Closing moves the case out of the queue and into its outcome tab, which is
  // where the agent is taken so the result is visible rather than asserted.
  function complete(certificate) {
    console.info('mark complete', record.id, decision, remarks, certificate?.name ?? null);
    setConfirming(false);
    closeCase(record.id, decision);
    navigate(decision === 'approved' ? '/completed-cases' : '/rejected-cases');
  }

  return (
    <section className="dash-card">
      <h2 className="case-card__title case-card__title--step">
        <img src={headStep5} alt="" width="14.992" height="14.992" />
        Step 5 — Remarks &amp; Final Decision
      </h2>

      <label className="case-field case-field--stacked">
        <span className="case-field__label">Internal Remarks</span>
        <textarea
          className="case-field__input case-field__input--area"
          rows={4}
          value={remarks}
          placeholder={REMARKS_EXAMPLE}
          onChange={(event) => setRemarks(event.target.value)}
        />
      </label>

      <p className="case-field__label case-field__label--spaced">Update Government Status</p>

      <div className="decision-row">
        {DECISIONS.map((option) => (
          <button
            className={
              decision === option.id ? `decision decision--${option.tone}` : 'decision'
            }
            type="button"
            key={option.id}
            aria-pressed={decision === option.id}
            onClick={() => choose(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Completing is only offered once a ruling is recorded — the citizen is
          notified of the decision, so there has to be one to notify them of. */}
      <div className="case-close">
        {decision && (
          <button className="case-complete" type="button" onClick={() => setConfirming(true)}>
            <img src={completeCheck} alt="" width="14.992" height="14.992" />
            Mark Complete &amp; Notify Customer
          </button>
        )}
        <button className="case-draft case-draft--back" type="button" onClick={onBack}>
          <img src={backArrow} alt="" width="14.992" height="14.992" />
          Back
        </button>
      </div>

      {confirming && (
        <CompleteDialog
          record={record}
          decision={decision}
          onCancel={() => setConfirming(false)}
          onConfirm={complete}
        />
      )}
    </section>
  );
}

export function CaseDetailPage() {
  const { applicationId } = useParams();
  const record = findCase(applicationId);

  if (!record) {
    return (
      <DashboardLayout>
        <main className="case-page">
          <p className="case-empty">
            No case found for {applicationId}. <Link to="/dashboard">Back to dashboard</Link>
          </p>
        </main>
      </DashboardLayout>
    );
  }

  // Keyed on the case, so moving between two cases resets the step and every
  // form with it instead of carrying the previous case's answers across.
  return <CaseDetail key={record.id} record={record} />;
}

function CaseDetail({ record }) {
  const [step, setStep] = useState(record.activeStep);
  // Held here rather than in the step 5 form: the breadcrumb reads it too, and
  // stepping back and forward must not lose the ruling.
  const [decision, setDecision] = useState(null);
  // Raised from the case header rather than from a step: the deadline is a
  // problem the agent can hit at any point in the workflow.
  const [extensionOpen, setExtensionOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const stage = STAGE_BY_DECISION[decision] ?? STAGE_BY_STEP[step] ?? STAGE_BY_STEP[1];

  // TODO: posts the request once the agent API exists; Admin has to agree
  // before anything about the case actually changes.
  function handleExtension(request) {
    console.info('request extension', record.id, request);
    setExtensionOpen(false);
  }

  // TODO: sends the message once the agent API exists.
  function handleContact(message) {
    console.info('contact agent 1', record.id, message);
    setContactOpen(false);
  }

  return (
    <DashboardLayout>
      <main className="case-page">
        <div className="case-breadcrumb">
          <Link className="case-breadcrumb__back" to="/assigned-queue">
            <img src={breadcrumbBack} alt="" width="13.12" height="13.12" />
            Assigned Cases
          </Link>
          <span className="case-breadcrumb__sep">/</span>
          <span className="case-breadcrumb__id">{record.id}</span>
          <span className={`status-badge status-badge--${stage.tone}`}>{stage.label}</span>
        </div>

        {/* ------------------------------------------------------ case head */}
        <section className="case-head">
          <span className="case-head__avatar">{record.initials}</span>

          <div className="case-head__body">
            <div className="case-head__title-row">
              <h1 className="case-head__name">{record.name}</h1>
              <span className={`priority-badge priority-badge--${PRIORITY_MODIFIER[record.priority]}`}>
                {record.priority}
              </span>
            </div>

            <div className="case-head__meta">
              <span className="case-meta">
                <img src={metaRef} alt="" width="11.247" height="11.247" />
                {record.id}
              </span>
              <span className="case-meta">
                <img src={metaDepartment} alt="" width="11.247" height="11.247" />
                {record.department}
              </span>
              <span className="case-meta">
                <img src={metaService} alt="" width="11.247" height="11.247" />
                {record.service}
              </span>
              <span className="case-meta">
                <img src={metaDeadline} alt="" width="11.247" height="11.247" />
                Deadline: {record.deadline}
              </span>
            </div>
          </div>

          <div className="case-head__actions">
            <button
              className="case-action case-action--contact"
              type="button"
              onClick={() => setContactOpen(true)}
            >
              <img src={actionContact} alt="" width="11.247" height="11.247" />
              Contact A1
            </button>
            <button
              className="case-action case-action--extension"
              type="button"
              onClick={() => setExtensionOpen(true)}
            >
              <img src={actionExtension} alt="" width="11.247" height="11.247" />
              Request Extension
            </button>
            <button className="case-action" type="button">
              <img src={actionDownload} alt="" width="11.247" height="11.247" />
              Download
            </button>
          </div>
        </section>

        <div className="case-columns">
          {/* --------------------------------------------- what A1 handed over */}
          <div className="case-column">
            <section className="dash-card">
              <h2 className="case-card__title">
                <img src={headRemarks} alt="" width="14.992" height="14.992" />
                Agent 1 Remarks
              </h2>
              <p className="case-remark">{record.remark.text}</p>
              <p className="case-remark__foot">Forwarded on {record.remark.forwardedOn}</p>
            </section>

            <section className="dash-card">
              <h2 className="case-card__title">
                <img src={headDocuments} alt="" width="14.992" height="14.992" />
                Documents from A1
              </h2>

              <ul className="doc-list">
                {record.documents.map((document) => (
                  <li className="doc" key={document.name}>
                    <img
                      className="doc__icon"
                      src={docFile}
                      alt=""
                      width="13.12"
                      height="13.12"
                    />
                    <span className="doc__body">
                      <span className="doc__name">{document.name}</span>
                      <span className="doc__size">{document.size}</span>
                    </span>
                    <span className="doc__actions">
                      <button className="doc__button" type="button" aria-label={`View ${document.name}`}>
                        <img src={docView} alt="" width="11.247" height="11.247" />
                      </button>
                      <button
                        className="doc__button"
                        type="button"
                        aria-label={`Download ${document.name}`}
                      >
                        <img src={docDownload} alt="" width="11.247" height="11.247" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="dash-card">
              <h2 className="case-card__title">
                <img src={headDeadline} alt="" width="14.992" height="14.992" />
                Task Deadline
              </h2>

              <p className="case-deadline">{record.deadlineLabel}</p>
              <div
                className="case-progress"
                role="progressbar"
                aria-valuenow={record.deadlineProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span
                  className="case-progress__fill"
                  style={{ width: `${record.deadlineProgress}%` }}
                />
              </div>

              <h2 className="case-card__title case-card__title--spaced">
                <img src={headTimeline} alt="" width="14.992" height="14.992" />
                Application Timeline
              </h2>

              <ol className="timeline">
                {record.timeline.map((entry) => (
                  <li className={`timeline__item timeline__item--${entry.state}`} key={entry.id}>
                    <span className="timeline__dot" aria-hidden="true" />
                    <span className="timeline__label">{entry.label}</span>
                    <span className="timeline__date">{entry.date}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          {/* --------------------------------------------- what A2 does next */}
          <div className="case-column">
            <section className="dash-card">
              <p className="workflow__title">Government Processing Workflow</p>

              {/* A finished step shows a tick instead of its number, and the
                  connector it leaves turns green — the trail of what is done. */}
              <ol className="workflow">
                {WORKFLOW_STEPS.map((label, index) => {
                  const number = index + 1;
                  const state = number < step ? 'done' : number === step ? 'active' : 'todo';

                  return (
                    <li className={`workflow__step workflow__step--${state}`} key={label}>
                      <span className="workflow__number">
                        {state === 'done' ? (
                          <img src={stepCheck} alt="" width="14.992" height="14.992" />
                        ) : (
                          number
                        )}
                      </span>
                      <span className="workflow__label">{label}</span>
                    </li>
                  );
                })}
              </ol>
            </section>

            {step === 1 && <VisitForm record={record} onDone={() => setStep(2)} />}
            {step === 2 && (
              <SubmissionForm
                record={record}
                onBack={() => setStep(1)}
                onDone={() => setStep(3)}
              />
            )}
            {step === 3 && (
              <ReferenceForm record={record} onBack={() => setStep(2)} onDone={() => setStep(4)} />
            )}
            {step === 4 && (
              <AcknowledgementForm
                record={record}
                onBack={() => setStep(3)}
                onDone={() => setStep(5)}
              />
            )}
            {step === 5 && (
              <DecisionForm
                record={record}
                decision={decision}
                onDecide={setDecision}
                onBack={() => setStep(4)}
              />
            )}
          </div>
        </div>

        {extensionOpen && (
          <ExtensionRequestDialog
            record={record}
            onCancel={() => setExtensionOpen(false)}
            onSend={handleExtension}
          />
        )}

        {contactOpen && (
          <ContactAgentDialog
            record={record}
            onCancel={() => setContactOpen(false)}
            onSend={handleContact}
          />
        )}
      </main>
    </DashboardLayout>
  );
}

export default CaseDetailPage;
