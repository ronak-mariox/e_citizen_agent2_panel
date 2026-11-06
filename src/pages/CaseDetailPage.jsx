import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import { PRIORITY_MODIFIER } from '../constants/dashboard.js';
import {
  DECISIONS,
  formatRupees,
  REFERENCE_EXAMPLE,
  REMARKS_EXAMPLE,
  STAGE_BY_DECISION,
  STAGE_BY_STEP,
  UPLOAD_SOURCES,
  WORKFLOW_STEPS,
} from '../constants/caseDetail.js';
import * as caseApi from '../api/case.js';
import { getErrorMessage } from '../api/client.js';
import { assetUrl, initialsOf } from '../utils/format.js';
import { useLiveRefresh } from '../hooks/useLiveRefresh.js';
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

/* One case, opened from the dashboard's Active Cases list or from Assigned
   Cases — both link here with the application's real id.

   The left column is what Agent 1 handed over and cannot be edited here; the
   right column is the only part an Agent 2 acts on, one step of the
   Government Processing Workflow at a time. Each step's form posts to the
   backend (services/agent2.service.js) and the case is re-read from what it
   answers, so the step the screen resumes on after a reload is always the
   real one rather than wherever a client guessed. */

/* The API's four priorities folded into the three this screen's badge has —
   the same fold AssignedQueuePage uses, so a case reads the same priority on
   both screens. */
const PRIORITY_LABEL = { urgent: 'High', high: 'High', normal: 'Medium', low: 'Low' };

const DATE = { day: '2-digit', month: 'short', year: 'numeric' };

const fmtDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', DATE);
};

/** `<input type="date">` wants `yyyy-mm-dd`. */
const dateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

/** `<input type="time">` wants `HH:mm`, 24-hour. */
const timeInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

/** The two back into one instant, for the API. */
const combineDateTime = (dateStr, timeStr) => {
  if (!dateStr) return null;
  const iso = timeStr ? `${dateStr}T${timeStr}` : dateStr;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

/** Bytes as the design writes them — "1.2 MB", one decimal, never "0.0 MB". */
const fileSize = (bytes) => {
  const mb = bytes / 1024 / 1024;
  if (mb >= 0.1) return `${mb.toFixed(1)} MB`;

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

/**
 * Which step a case resumes on — derived from what has actually been saved
 * rather than carried as its own field, so reopening a case never disagrees
 * with what is really on it.
 */
function deriveActiveStep(application) {
  if (application.governmentDecision?.outcome) return 5;
  if (application.acknowledgement) return 5;
  if (application.submission?.referenceNumber) return 4;

  const submission = application.submission ?? {};
  if (submission.desk || submission.submittedOn || (submission.checklist ?? []).some((item) => item.isDone)) {
    return 3;
  }

  /* Not just "a visit exists" — a visit booked ahead of time from Government
     Visits sits at `scheduled` until Step 1's own form confirms it actually
     happened. Counting that row here would skip Step 1 entirely and strand
     the agent on Step 2 with no way back to the form that is supposed to be
     the only thing that marks a visit done. */
  if ((application.governmentVisits ?? []).some((visit) => visit.status === 'completed')) {
    return 2;
  }

  return 1;
}

/** The share of the SLA window already spent, for the progress bar — the
    internal clock (submittedAt to sla.dueAt), not the citizen's promised
    date, and not forwardedAt: the window itself runs from submission, so
    starting the bar at hand-off would understate how much of it is used.
    A completed case reads as a full bar rather than this measured against
    live wall-clock time forever — see toRecordShape's own note on why
    the label next to it stops reading as a countdown too. */
function deadlineProgress(application) {
  if (application.status === 'completed') return 100;
  if (!application.submittedAt || !application.sla?.dueAt) return 0;

  const start = new Date(application.submittedAt).getTime();
  const end = new Date(application.sla.dueAt).getTime();

  if (!(end > start)) return 100;

  return Math.max(0, Math.min(100, Math.round(((Date.now() - start) / (end - start)) * 100)));
}

/** The fixed six-point journey the frame draws, filled from whatever the
    application actually recorded for each — the same journey the citizen
    app's own tracking screen draws, read from this side instead. */
function timelineFrom(application) {
  const entryFor = (status) => application.timeline?.find((entry) => entry.status === status);
  const [latestVisit] = application.governmentVisits ?? [];

  /* Once the case is actually closed, the last row stops being a countdown
     and becomes a record of when it finished — the same real fields the
     Step 5 completion check already reads (record.status, toRecordShape
     below), not a second guess at whether the case is done. */
  const isCompleted = application.status === 'completed';
  const completedAt = entryFor('completed')?.at ?? application.completedAt;

  return [
    {
      id: 'submitted',
      label: 'Submitted by Citizen',
      date: fmtDate(entryFor('submitted')?.at),
      state: 'done',
    },
    {
      id: 'verified',
      label: 'Agent 1 Verified',
      date: fmtDate(entryFor('verified')?.at ?? entryFor('under_verification')?.at),
      state: 'done',
    },
    {
      id: 'forwarded',
      label: 'Forwarded to Agent 2',
      date: fmtDate(application.forwardedAt),
      state: 'done',
    },
    {
      id: 'visit',
      label: 'Gov. Office Visit',
      date: latestVisit ? fmtDate(latestVisit.scheduledAt) : '—',
      state: latestVisit ? 'done' : 'pending',
    },
    {
      id: 'decision',
      label: 'Gov. Decision',
      date: application.governmentDecision ? fmtDate(application.governmentDecision.at) : '—',
      state: application.governmentDecision ? 'done' : 'pending',
    },
    isCompleted
      ? {
          id: 'deadline',
          label: 'Completed',
          date: fmtDate(completedAt),
          state: 'done',
        }
      : {
          id: 'deadline',
          label: 'Deadline',
          date: fmtDate(application.expectedCompletionDate),
          state: 'deadline',
        },
  ];
}

/** The API's case -> everything this screen reads. Kept as one function so
    every card on the page agrees about what a given field means. */
function toRecordShape(application) {
  return {
    id: application.applicationNumber,
    // The application's own status, not the step — Step 5 stays on screen
    // once a case is closed (deriveActiveStep never moves it away from 5),
    // so this is what tells DecisionForm the case is actually done rather
    // than merely decided.
    status: application.status,
    /* A citizen who has not filled in their profile has no name anywhere, and
       their mobile is who they are — the same fallback Agent 1's panel uses,
       rather than "Unknown citizen" beside a number we do have. */
    initials: application.citizen?.fullName
      ? application.citizen?.initials ?? initialsOf(application.citizen.fullName)
      : initialsOf(application.citizen?.mobile),
    name: application.citizen?.fullName ?? application.citizen?.mobile ?? 'Unknown citizen',
    priority: PRIORITY_LABEL[application.effectivePriority ?? application.priority] ?? 'Medium',
    department: application.department?.name ?? '—',
    service: application.service?.name ?? '—',
    // The backend's own SLA clock freezes once a case is terminal (see
    // computeSlaStatus), but its remainingLabel still only ever reads as a
    // countdown ("2h 30m left" / "Overdue") — never "Completed". Said
    // explicitly here rather than showing a frozen-but-misleading number.
    deadline: application.status === 'completed' ? 'Completed' : application.sla?.remainingLabel ?? '—',
    // What the citizen has already paid, for PaymentRequestDialog's running
    // total — the fee itself once it has actually been collected, not what
    // was merely quoted. In rupees: the backend's own amounts are paise, but
    // formatRupees() (constants/caseDetail.js) does not divide by 100.
    paidAmount: application.isPaid ? application.totalAmount / 100 : 0,
    remark: {
      text: application.handoverNote || 'Agent 1 left no remarks on this application.',
      forwardedOn: fmtDate(application.forwardedAt),
    },
    // The private notes Agent 1 wrote during verification — a different
    // thing from the handover remark above, which is the reason on their
    // approve/reject decision, not this running list.
    notes: (application.notes ?? []).map((note) => ({
      id: note.id,
      text: note.text,
      author: note.author ?? 'Agent 1',
      time: fmtDate(note.at),
    })),
    documents: (application.documents ?? []).map((document) => ({
      name: document.label || document.originalName,
      size: fileSize(document.sizeBytes),
      url: assetUrl(document.url),
    })),
    additionalPaymentRequests: (application.additionalPaymentRequests ?? []).map((one) => ({
      id: one.id,
      amount: one.amount,
      reason: one.reason,
      status: one.status ?? 'pending',
      // with_agent1 | with_citizen while pending; the status once closed.
      stage: one.stage ?? one.status ?? 'pending',
      paidByRole: one.paidByRole ?? null,
    })),
    /* What the company has paid this agent out of the application — every
       citizen payment goes to the company wallet first. Paise. */
    payouts: application.payouts ?? [],
    payoutSummary: application.payoutSummary ?? {
      received: 0,
      service: { received: 0 },
      additional: { requested: false, received: 0 },
    },
    extraPaymentRoute: application.extraPaymentRoute ?? 'direct',
    deadlineLabel:
      application.status === 'completed'
        ? 'Completed'
        : application.sla?.remainingLabel ?? 'No deadline set',
    // A plain number for ExtensionRequestDialog to compute days-left from
    // directly — see its own comment for why this replaced a label-parsing
    // regex.
    slaRemainingMs: application.sla?.remainingMs ?? null,
    deadlineProgress: deadlineProgress(application),
    timeline: timelineFrom(application),
    activeStep: deriveActiveStep(application),
    visit: {
      // Set once a visit exists (scheduled from Government Visits or an
      // earlier pass through this same step), so step 1 knows to amend it
      // rather than record a second one alongside it.
      id: application.governmentVisits?.[0]?.id ?? null,
      office: application.governmentVisits?.[0]?.office ?? '',
      officer: application.governmentVisits?.[0]?.officer ?? '',
      date: dateInputValue(application.governmentVisits?.[0]?.scheduledAt),
      time: timeInputValue(application.governmentVisits?.[0]?.scheduledAt),
      purpose: application.governmentVisits?.[0]?.purpose ?? '',
    },
    submission: {
      // Until Agent 2 has saved a checklist of their own, it starts as one
      // line per document Agent 1 actually forwarded — the same list "Documents
      // from A1" shows, not a generic filing checklist unrelated to this case.
      checklist:
        application.submission?.checklist?.length > 0
          ? application.submission.checklist.map((item) => ({
              id: item.key,
              label: item.label,
              done: item.isDone,
            }))
          : (application.documents ?? []).map((document) => ({
              id: document.id,
              label: document.label || document.originalName,
              done: false,
            })),
      date: dateInputValue(application.submission?.submittedOn),
      desk: application.submission?.desk ?? '',
    },
    referenceNumber: application.submission?.referenceNumber ?? '',
    acknowledgement: application.acknowledgement
      ? { ...application.acknowledgement, url: assetUrl(application.acknowledgement.url) }
      : null,
    governmentDecision: application.governmentDecision,
  };
}

/* Step 1 — the visit itself. Completing it is what moves the case on to the
   submission step, so `onDone` is the only way forward in the workflow. */
function VisitForm({ record, applicationId, onDone }) {
  const [visit, setVisit] = useState(record.visit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (name, value) => setVisit((current) => ({ ...current, [name]: value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const fields = {
      office: visit.office,
      officer: visit.officer,
      purpose: visit.purpose,
      scheduledAt: combineDateTime(visit.date, visit.time),
    };

    try {
      /* Filling this in and continuing is the agent saying the visit
         already happened — "completed" straight away, whether it is a
         fresh visit or one booked ahead of time from Government Visits and
         now being confirmed. Amend that existing row rather than record a
         second one alongside it. */
      const application = visit.id
        ? await caseApi.updateVisit(applicationId, visit.id, { ...fields, status: 'completed' })
        : await caseApi.recordVisit(applicationId, { ...fields, status: 'completed' });

      onDone(application);
    } catch (one) {
      setError(getErrorMessage(one));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="dash-card" onSubmit={handleSubmit}>
      <h2 className="case-card__title case-card__title--step">
        <img src={headStep} alt="" width="14.992" height="14.992" />
        Step {record.activeStep} — Government Office Visit
      </h2>

      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}

      <div className="case-form">
        <label className="case-field">
          <span className="case-field__label">Office Name</span>
          <input
            className="case-field__input"
            required
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
            type="date"
            required
            value={visit.date}
            onChange={(event) => set('date', event.target.value)}
          />
        </label>

        <label className="case-field">
          <span className="case-field__label">Visit Time</span>
          <input
            className="case-field__input"
            type="time"
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
        <button className="case-submit" type="submit" disabled={saving}>
          <img src={stepSave} alt="" width="14.992" height="14.992" />
          {saving ? 'Saving…' : 'Save Visit & Continue'}
        </button>
      </div>
    </form>
  );
}

/* Step 2 — what was actually handed across the counter. The checklist is
   ticked at the desk, so it stays editable rather than being derived from the
   documents Agent 1 sent. */
function SubmissionForm({ record, applicationId, onBack, onDone }) {
  const [submission, setSubmission] = useState(record.submission);
  const [askingPayment, setAskingPayment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (name, value) => setSubmission((current) => ({ ...current, [name]: value }));

  const toggle = (id) =>
    set(
      'checklist',
      submission.checklist.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const application = await caseApi.updateSubmission(applicationId, {
        checklist: submission.checklist.map((item) => ({
          key: item.id,
          label: item.label,
          isDone: item.done,
        })),
        desk: submission.desk,
        submittedOn: submission.date ? new Date(submission.date).toISOString() : undefined,
      });

      onDone(application);
    } catch (one) {
      setError(getErrorMessage(one));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form className="dash-card" onSubmit={handleSubmit}>
        <h2 className="case-card__title case-card__title--step">
          <img src={headStep2} alt="" width="14.992" height="14.992" />
          Step 2 — Document Submission
        </h2>

        {error && (
          <p className="notice notice--error" role="alert">
            {error}
          </p>
        )}

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
              type="date"
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
          <button className="case-submit" type="submit" disabled={saving}>
            <img src={stepCheck} alt="" width="14.992" height="14.992" />
            {saving ? 'Saving…' : 'Submit & Continue'}
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

        {record.additionalPaymentRequests.length > 0 && (
          <div className="case-payment-requests">
            <p className="case-checklist__title">Additional Payment Requests</p>
            <ul className="case-payment-list">
              {record.additionalPaymentRequests.map((paymentRequest) => (
                <PaymentRequestRow
                  key={paymentRequest.id}
                  request={paymentRequest}
                  applicationId={applicationId}
                  onResolved={onDone}
                />
              ))}
            </ul>
          </div>
        )}

      </form>

      {/* Outside the form above: a <form> inside a <form> is invalid HTML, and
          the dialog's Send never reached the server while it was nested. */}
      {askingPayment && (
        <PaymentRequestDialog
          record={record}
          onCancel={() => setAskingPayment(false)}
          onSend={async (request) => {
            try {
              const application = await caseApi.requestPayment(applicationId, request);
              onDone(application);
            } catch (one) {
              setError(getErrorMessage(one));
            } finally {
              setAskingPayment(false);
            }
          }}
        />
      )}
    </>
  );
}

/** Where a request has got to, as this agent reads it. */
const PAYMENT_STAGE_LABEL = {
  with_agent1: 'With Agent 1',
  with_citizen: 'With applicant',
  waived: 'Waived',
  cancelled: 'Cancelled',
};

/** One additional payment request. The applicant pays it from the app, into
    the company wallet, and the company passes it on to this agent — so a
    pending one can only be waived or cancelled from here, and closing it is
    what resumes the SLA clock it paused (see computeSlaStatus, backend
    application.service.js). */
function PaymentRequestRow({ request, applicationId, onResolved }) {
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState(null);

  async function resolve(outcome) {
    setResolving(true);
    setError(null);

    try {
      const application = await caseApi.resolvePaymentRequest(applicationId, request.id, { outcome });

      onResolved(application);
    } catch (one) {
      setError(getErrorMessage(one));
      setResolving(false);
    }
  }

  return (
    <li className="case-payment-row">
      <div className="case-payment-row__info">
        <span className="case-payment-row__amount">{formatRupees((request.amount ?? 0) / 100)}</span>
        <span className="case-payment-row__reason">{request.reason || 'No reason given'}</span>
      </div>

      {request.status === 'pending' ? (
        <div className="case-payment-row__actions">
          <span className="case-payment-row__status case-payment-row__status--pending">
            {PAYMENT_STAGE_LABEL[request.stage] ?? 'Pending'}
          </span>
          <button
            className="case-payment-row__button"
            type="button"
            disabled={resolving}
            onClick={() => resolve('waived')}
          >
            Waive
          </button>
          <button
            className="case-payment-row__button"
            type="button"
            disabled={resolving}
            onClick={() => resolve('cancelled')}
          >
            Cancel
          </button>
        </div>
      ) : (
        <span className={`case-payment-row__status case-payment-row__status--${request.status}`}>
          {request.status === 'paid'
            ? request.paidByRole === 'citizen'
              ? 'Paid by applicant'
              : 'Paid'
            : PAYMENT_STAGE_LABEL[request.status] ?? request.status}
        </span>
      )}

      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}

/* Step 3 — the number the counter gives back. It is the only thing a citizen
   can track the application by, so the field stands alone with nothing else on
   the card to mistype it into. */
function ReferenceForm({ record, applicationId, onBack, onDone }) {
  const [reference, setReference] = useState(record.referenceNumber);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const application = await caseApi.updateSubmission(applicationId, {
        referenceNumber: reference,
      });

      onDone(application);
    } catch (one) {
      setError(getErrorMessage(one));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="dash-card" onSubmit={handleSubmit}>
      <h2 className="case-card__title case-card__title--step">
        <img src={headStep3} alt="" width="14.992" height="14.992" />
        Step 3 — Government Reference Number
      </h2>

      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}

      <p className="case-note">
        Enter the reference number issued by the government office after document submission.
      </p>

      <label className="case-field case-field--stacked">
        <span className="case-field__label">Reference Number</span>
        <input
          className="case-field__input case-field__input--mono"
          required
          value={reference}
          placeholder={REFERENCE_EXAMPLE}
          onChange={(event) => setReference(event.target.value)}
        />
      </label>

      <div className="case-form__actions">
        <button className="case-submit" type="submit" disabled={saving}>
          <img src={stepCheck} alt="" width="14.992" height="14.992" />
          {saving ? 'Saving…' : 'Save Reference & Continue'}
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

/* Step 4 — the receipt the counter stamps. Each tile opens a hidden file input
   so the three sources behave like one field with three ways in. */
function AcknowledgementForm({ record, applicationId, onBack, onDone }) {
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const existing = record.acknowledgement;

  async function handleSubmit(event) {
    event.preventDefault();

    if (!file) {
      // Already uploaded on an earlier visit to this step — nothing new to
      // send, just move on.
      onDone(null);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const application = await caseApi.uploadAcknowledgement(applicationId, file);
      onDone(application);
    } catch (one) {
      setError(getErrorMessage(one));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="dash-card" onSubmit={handleSubmit}>
      <h2 className="case-card__title case-card__title--step">
        <img src={headStep4} alt="" width="14.992" height="14.992" />
        Step 4 — Upload Acknowledgement
      </h2>

      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}

      {/* Once a receipt is attached the three pickers give way to it: there is
          only one acknowledgement, so offering the choices again would invite a
          second one. Removing it brings them back. */}
      {file || existing ? (
        <div className="uploaded">
          <span className="uploaded__icon">
            <img src={uploadedFile} alt="" width="18.749" height="18.749" />
          </span>

          <span className="uploaded__body">
            <span className="uploaded__name">{file?.name ?? existing.originalName}</span>
            <span className="uploaded__meta">
              Uploaded{file ? ` · ${fileSize(file.size)}` : existing.sizeBytes ? ` · ${fileSize(existing.sizeBytes)}` : ''}
            </span>
          </span>

          <span className="uploaded__actions">
            {existing && !file && (
              <a
                className="uploaded__button"
                href={existing.url}
                target="_blank"
                rel="noreferrer"
                aria-label="View acknowledgement"
              >
                <img src={uploadedView} alt="" width="13.12" height="13.12" />
              </a>
            )}
            {file && (
              <button
                className="uploaded__button"
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() => setFile(null)}
              >
                <img src={uploadedRemove} alt="" width="13.12" height="13.12" />
              </button>
            )}
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
        <button className="case-submit" type="submit" disabled={saving || (!file && !existing)}>
          <img src={stepCheck} alt="" width="14.992" height="14.992" />
          {saving ? 'Uploading…' : 'Continue'}
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
function CompleteDialog({ record, decision, saving, onCancel, onConfirm }) {
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

        <p className="modal__label">
          Upload Final Certificate <span className="modal__required">*</span>
        </p>

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

        {!certificate && (
          <p className="modal__hint">The certificate is required to complete this application.</p>
        )}

        <div className="modal__actions">
          <button className="modal__cancel" type="button" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button
            className="modal__confirm"
            type="button"
            disabled={saving || !certificate}
            onClick={() => onConfirm(certificate)}
          >
            {saving ? 'Completing…' : 'Complete Case'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Confirms a rejection before it happens.
   A click on Gov. Rejected used to fire the request straight away, with
   nothing to undo it — and the server requires a reason for a rejection but
   not for an approval, so a case with nothing yet typed into Internal
   Remarks failed validation with no obvious sign why the button "did
   nothing." Asking here makes the requirement visible instead of a silent
   400, and gives the agent one more moment before the case actually closes. */
function RejectDialog({ record, remarks, saving, error, onCancel, onConfirm }) {
  const [reason, setReason] = useState(remarks);
  const trimmed = reason.trim();

  return (
    <div className="modal" role="presentation" onClick={onCancel}>
      <div
        className="modal__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-title"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="modal__badge">
          <img src={modalBadge} alt="" width="29.996" height="29.996" />
        </span>

        <h2 className="modal__title" id="reject-title">
          Reject Application?
        </h2>

        <p className="modal__body">
          This will mark <strong>{record.id}</strong> as rejected by the government and close the
          case. This cannot be undone.
        </p>

        <p className="modal__label">
          Rejection Reason <span className="modal__required">*</span>
        </p>

        <textarea
          className="case-field__input case-field__input--area"
          rows={4}
          value={reason}
          placeholder="Why the department refused this application"
          onChange={(event) => setReason(event.target.value)}
        />

        {error ? (
          <p className="modal__hint" role="alert">
            {error}
          </p>
        ) : !trimmed ? (
          <p className="modal__hint">A reason is required to reject this application.</p>
        ) : null}

        <div className="modal__actions">
          <button className="modal__cancel" type="button" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button
            className="modal__confirm modal__confirm--danger"
            type="button"
            disabled={saving || !trimmed}
            onClick={() => onConfirm(trimmed)}
          >
            {saving ? 'Rejecting…' : 'Reject Application'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Step 5 — how the case ends. There is no Continue here: the decision itself
   is the last action, so the two status buttons close the workflow. */
function DecisionForm({ record, applicationId, onBack }) {
  const [remarks, setRemarks] = useState('');
  const [decision, setDecision] = useState(record.governmentDecision?.outcome ?? null);
  const [confirming, setConfirming] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState(null);
  const [rejectError, setRejectError] = useState(null);
  const navigate = useNavigate();

  const decided = Boolean(record.governmentDecision?.outcome);

  /* A rejection ends the case there and then — there is no certificate to
     attach and nothing to complete. An approval still goes through Mark
     Complete, because that is what notifies the citizen and offers the final
     certificate.

     `reason` overrides Internal Remarks for a rejection — the confirm dialog
     collects its own, seeded from whatever was already typed above, because
     the server requires one here and Internal Remarks is optional for an
     approval, so the two cannot simply share one field's validation. */
  async function choose(id, reason) {
    if (decided || deciding) return;

    setDeciding(true);
    setError(null);
    setRejectError(null);

    try {
      await caseApi.recordDecision(applicationId, {
        outcome: id,
        remarks: id === 'rejected' ? reason : remarks,
      });
      setDecision(id);
      setRejecting(false);

      if (id === 'rejected') navigate('/rejected-cases');
    } catch (one) {
      const message = getErrorMessage(one);

      if (id === 'rejected') setRejectError(message);
      else setError(message);
    } finally {
      setDeciding(false);
    }
  }

  async function complete(certificate) {
    setCompleting(true);
    setError(null);

    try {
      await caseApi.completeCase(applicationId, certificate);
      setConfirming(false);
      navigate('/completed-cases');
    } catch (one) {
      setError(getErrorMessage(one));
      setCompleting(false);
    }
  }

  return (
    <section className="dash-card">
      <h2 className="case-card__title case-card__title--step">
        <img src={headStep5} alt="" width="14.992" height="14.992" />
        Step 5 — Remarks &amp; Final Decision
      </h2>

      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}

      <label className="case-field case-field--stacked">
        <span className="case-field__label">Internal Remarks</span>
        <textarea
          className="case-field__input case-field__input--area"
          rows={4}
          value={remarks}
          disabled={decided}
          placeholder={record.governmentDecision?.remarks || REMARKS_EXAMPLE}
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
            disabled={decided || deciding}
            onClick={() =>
              option.id === 'rejected' ? setRejecting(true) : choose(option.id)
            }
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Completing is only offered once a ruling is recorded — the citizen is
          notified of the decision, so there has to be one to notify them of.
          Once the case is actually closed, reopening it must not leave
          behind a button that still reads as an invitation to press it
          again — approving or rejecting a second time is not a real action,
          so the case-close row swaps to a plain, disabled record of how it
          ended instead. */}
      <div className="case-close">
        {record.status === 'completed' ? (
          <button className="case-complete" type="button" disabled>
            <img src={completeCheck} alt="" width="14.992" height="14.992" />
            Completed
          </button>
        ) : record.status === 'rejected' ? (
          <button className="case-complete case-complete--rejected" type="button" disabled>
            ✗ Rejected
          </button>
        ) : (
          decision === 'approved' && (
            <button className="case-complete" type="button" onClick={() => setConfirming(true)}>
              <img src={completeCheck} alt="" width="14.992" height="14.992" />
              Mark Complete &amp; Notify Customer
            </button>
          )
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
          saving={completing}
          onCancel={() => setConfirming(false)}
          onConfirm={complete}
        />
      )}

      {rejecting && (
        <RejectDialog
          record={record}
          remarks={remarks}
          saving={deciding}
          error={rejectError}
          onCancel={() => {
            setRejecting(false);
            setRejectError(null);
          }}
          onConfirm={(reason) => choose('rejected', reason)}
        />
      )}
    </section>
  );
}

export function CaseDetailPage() {
  const { applicationId } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    // The spinner has to appear when the request starts, not when it finishes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    caseApi
      .getCase(applicationId)
      .then((data) => {
        if (!cancelled) setApplication(data);
      })
      .catch((one) => {
        if (!cancelled) setError(getErrorMessage(one));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  if (loading) {
    return (
      <DashboardLayout>
        <main className="case-page">
          <p className="case-empty">Loading case…</p>
        </main>
      </DashboardLayout>
    );
  }

  if (error || !application) {
    return (
      <DashboardLayout>
        <main className="case-page">
          <p className="case-empty">
            {error || `No case found for ${applicationId}.`}{' '}
            <Link to="/assigned-queue">Back to Assigned Cases</Link>
          </p>
        </main>
      </DashboardLayout>
    );
  }

  // Keyed on the case, so moving between two cases resets the step and every
  // form with it instead of carrying the previous case's answers across.
  return (
    <CaseDetail key={application.id} applicationId={applicationId} initial={application} />
  );
}

function CaseDetail({ applicationId, initial }) {
  const [application, setApplication] = useState(initial);
  const record = useMemo(() => toRecordShape(application), [application]);
  const [step, setStep] = useState(record.activeStep);
  const [extensionOpen, setExtensionOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [headError, setHeadError] = useState(null);
  const stage =
    STAGE_BY_DECISION[record.governmentDecision?.outcome] ?? STAGE_BY_STEP[step] ?? STAGE_BY_STEP[1];

  /* Live updates swap in the fresh application so the server-owned cards
     (status, payouts, payment requests, timeline, documents) follow along.
     `step` and every step form/dialog seed their state once from `record`, so
     this never resets what the agent is typing or which step they are on. A
     reply that lands after one of the agent's own saves is dropped, so it
     cannot roll that save back; a failed refetch keeps what is shown. */
  const savesRef = useRef(0);
  useLiveRefresh(() => {
    const seen = savesRef.current;

    caseApi
      .getCase(applicationId)
      .then((fresh) => {
        if (savesRef.current === seen) setApplication(fresh);
      })
      .catch(() => {});
  }, ['applications', 'wallet']);

  /* Every step hands back the application exactly as the backend now has it
     — re-deriving the step from that rather than blindly advancing means a
     case reopened mid-flow always resumes on the right one. */
  function advance(updated) {
    if (updated) {
      savesRef.current += 1;
      setApplication(updated);
      setStep(deriveActiveStep(updated));
    } else {
      setStep((current) => Math.min(5, current + 1));
    }
  }

  async function handleExtension(request) {
    try {
      await caseApi.requestExtension(applicationId, request);
      setExtensionOpen(false);
    } catch (one) {
      setHeadError(getErrorMessage(one));
    }
  }

  async function handleContact({ subject, message }) {
    try {
      await caseApi.contactAgent1(applicationId, { subject, message });
      setContactOpen(false);
    } catch (one) {
      setHeadError(getErrorMessage(one));
    }
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

        {headError && (
          <p className="notice notice--error" role="alert">
            {headError}
          </p>
        )}

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
            {record.documents[0]?.url && (
              <a
                className="case-action"
                href={record.documents[0].url}
                target="_blank"
                rel="noreferrer"
              >
                <img src={actionDownload} alt="" width="11.247" height="11.247" />
                Download
              </a>
            )}
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

            {/* The company's payments to this agent. Citizens pay the company,
                and the admin releases this agent's share — the department fee
                and any additional payment — from the company wallet. */}
            <section className="dash-card">
              <h2 className="case-card__title">Payment from Company</h2>
              {/* What has arrived, part by part. The admin decides each amount,
                  so a part not paid yet reads "Yet to come" rather than a
                  forecast figure. */}
              <div className="case-payout__received">
                <p className="case-payout__head">
                  <span className="case-payout__label">Received</span>
                  <span className="case-payout__value">{formatRupees(record.payoutSummary.received / 100)}</span>
                </p>
                <p className="case-payout__line">
                  <span>Service</span>
                  {record.payoutSummary.service?.received > 0 ? (
                    <strong>{formatRupees(record.payoutSummary.service.received / 100)}</strong>
                  ) : (
                    <span className="case-payout__pending">Yet to come</span>
                  )}
                </p>
                <p className="case-payout__line">
                  <span>Additional payment</span>
                  {record.payoutSummary.additional?.received > 0 ? (
                    <strong>{formatRupees(record.payoutSummary.additional.received / 100)}</strong>
                  ) : record.payoutSummary.additional?.requested ? (
                    <span className="case-payout__pending">Yet to come</span>
                  ) : (
                    <span className="case-payout__none">Not requested</span>
                  )}
                </p>
              </div>
              {record.payouts.length > 0 ? (
                <ul className="case-payout__list">
                  {record.payouts.map((payout) => (
                    <li className="case-payout__row" key={payout.id}>
                      <span>{fmtDate(payout.paidAt)}</span>
                      <span>{payout.purpose === 'additional' ? 'Additional' : 'Service'}</span>
                      <span>{payout.reference || payout.method || '—'}</span>
                      <strong>{formatRupees(payout.amount / 100)}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="case-remark__foot">
                  Nothing paid yet. The company pays you once the applicant&apos;s payment is in.
                </p>
              )}
            </section>

            {record.notes.length > 0 && (
              <section className="dash-card">
                <h2 className="case-card__title">
                  <img src={headRemarks} alt="" width="14.992" height="14.992" />
                  Agent 1's Notes
                </h2>

                <ul className="case-note-list">
                  {record.notes.map((note) => (
                    <li className="case-note-item" key={note.id}>
                      <p className="case-note-item__head">
                        <span className="case-note-item__author">{note.author}</span>
                        <span className="case-note-item__time">{note.time}</span>
                      </p>
                      <p className="case-note-item__text">{note.text}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="dash-card">
              <h2 className="case-card__title">
                <img src={headDocuments} alt="" width="14.992" height="14.992" />
                Documents from A1
              </h2>

              <ul className="doc-list">
                {record.documents.length === 0 && (
                  <li className="case-empty">No documents were attached.</li>
                )}
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
                      <a
                        className="doc__button"
                        href={document.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`View ${document.name}`}
                      >
                        <img src={docView} alt="" width="11.247" height="11.247" />
                      </a>
                      <a
                        className="doc__button"
                        href={document.url}
                        download
                        aria-label={`Download ${document.name}`}
                      >
                        <img src={docDownload} alt="" width="11.247" height="11.247" />
                      </a>
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

            {step === 1 && (
              <VisitForm record={record} applicationId={applicationId} onDone={advance} />
            )}
            {step === 2 && (
              <SubmissionForm
                record={record}
                applicationId={applicationId}
                onBack={() => setStep(1)}
                onDone={advance}
              />
            )}
            {step === 3 && (
              <ReferenceForm
                record={record}
                applicationId={applicationId}
                onBack={() => setStep(2)}
                onDone={advance}
              />
            )}
            {step === 4 && (
              <AcknowledgementForm
                record={record}
                applicationId={applicationId}
                onBack={() => setStep(3)}
                onDone={advance}
              />
            )}
            {step === 5 && (
              <DecisionForm
                record={record}
                applicationId={applicationId}
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
