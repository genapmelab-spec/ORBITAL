/**
 * form.ts — reservation manifest, client side only.
 *
 * No network call of any kind (docs/PRD.md §9). Validation is announced through
 * aria-describedby + aria-invalid so the message is never colour-only, and the
 * first invalid control takes focus so a keyboard user is never stranded.
 */

const TRANSMIT_DELAY_MS = 620;
const MANIFEST_PREFIX = 'ORB';

interface FieldCheck {
  /** the control(s) that carry aria-invalid */
  controls: () => HTMLElement[];
  errorId: string;
  valid: () => boolean;
}

function emailLooksReal(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function initBookingForm(): void {
  const root = document.querySelector<HTMLElement>('[data-booking]');
  if (!root) return;

  const form = root.querySelector<HTMLFormElement>('[data-booking-form]');
  const success = root.querySelector<HTMLElement>('[data-booking-success]');
  const resetButton = root.querySelector<HTMLButtonElement>('[data-booking-reset]');
  const submit = root.querySelector<HTMLButtonElement>('[data-booking-submit]');
  if (!form || !success || !resetButton || !submit) return;

  const submitLabel = submit.querySelector('span');

  const field = <T extends HTMLElement>(name: string): T | null =>
    form.querySelector<T>(`[name="${name}"]`);

  const checks: FieldCheck[] = [
    {
      errorId: 'error-destination',
      controls: () => Array.from(form.querySelectorAll<HTMLElement>('input[name="destination"]')),
      valid: () => form.querySelector<HTMLInputElement>('input[name="destination"]:checked') !== null,
    },
    {
      errorId: 'error-window',
      controls: () => {
        const control = field<HTMLSelectElement>('window');
        return control ? [control] : [];
      },
      valid: () => (field<HTMLSelectElement>('window')?.value ?? '') !== '',
    },
    {
      errorId: 'error-passengers',
      controls: () => {
        const control = field<HTMLSelectElement>('passengers');
        return control ? [control] : [];
      },
      valid: () => (field<HTMLSelectElement>('passengers')?.value ?? '') !== '',
    },
    {
      errorId: 'error-name',
      controls: () => {
        const control = field<HTMLInputElement>('name');
        return control ? [control] : [];
      },
      valid: () => (field<HTMLInputElement>('name')?.value ?? '').trim().length >= 2,
    },
    {
      errorId: 'error-email',
      controls: () => {
        const control = field<HTMLInputElement>('email');
        return control ? [control] : [];
      },
      valid: () => emailLooksReal(field<HTMLInputElement>('email')?.value ?? ''),
    },
  ];

  const mark = (check: FieldCheck, invalid: boolean): void => {
    const error = form.querySelector<HTMLElement>(`#${check.errorId}`);
    error?.closest('.field')?.classList.toggle('has-error', invalid);
    for (const control of check.controls()) {
      if (invalid) {
        control.setAttribute('aria-invalid', 'true');
      } else {
        control.removeAttribute('aria-invalid');
      }
    }
  };

  // Clear an error as soon as the field is corrected — nagging is not premium.
  form.addEventListener('input', (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    for (const check of checks) {
      if (check.controls().includes(target) && check.valid()) mark(check, false);
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    let firstInvalid: HTMLElement | null = null;
    for (const check of checks) {
      const ok = check.valid();
      mark(check, !ok);
      if (!ok && !firstInvalid) {
        firstInvalid = check.controls()[0] ?? null;
      }
    }

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const destinationId =
      form.querySelector<HTMLInputElement>('input[name="destination"]:checked')?.value ?? '';
    const destinationCard = form.querySelector<HTMLElement>(
      `input[name="destination"][value="${destinationId}"]`,
    );
    const destinationName =
      destinationCard?.closest('.dest-card')?.querySelector('.dest-card__name')?.textContent?.trim() ??
      destinationId;

    const windowSelect = field<HTMLSelectElement>('window');
    const passengerSelect = field<HTMLSelectElement>('passengers');
    const manifest = `${MANIFEST_PREFIX}-${Date.now().toString(36).toUpperCase().slice(-5)}`;

    submit.disabled = true;
    if (submitLabel) submitLabel.textContent = 'Transmitting manifest…';

    window.setTimeout(() => {
      const values: Record<string, string> = {
        manifest,
        destination: destinationName,
        window: windowSelect?.selectedOptions[0]?.textContent?.trim() ?? '—',
        travellers: passengerSelect?.selectedOptions[0]?.textContent?.trim() ?? '—',
      };

      for (const node of success.querySelectorAll<HTMLElement>('[data-success-value]')) {
        const key = node.dataset.successValue ?? '';
        node.textContent = values[key] ?? '—';
      }

      form.classList.add('is-hidden');
      success.classList.add('is-on');
      success.focus();

      submit.disabled = false;
      if (submitLabel) submitLabel.textContent = 'Reserve your seat // Initiate clearance →';
    }, TRANSMIT_DELAY_MS);
  });

  resetButton.addEventListener('click', () => {
    success.classList.remove('is-on');
    form.classList.remove('is-hidden');
    form.reset();
    for (const check of checks) mark(check, false);
    field<HTMLInputElement>('name')?.focus();
  });
}
