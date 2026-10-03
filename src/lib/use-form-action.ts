"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";

/**
 * Drop-in replacement for `useActionState` on `<form action={formAction}>` forms that keeps what the
 * user typed when the submission FAILS.
 *
 * React 19 resets an uncontrolled `<form action={fn}>` after every submission, success or not, so a
 * server-side validation error (bad email, duplicate slug, ...) used to wipe the whole form along
 * with the message explaining what to fix. The returned `onSubmit` dispatches the same action itself
 * (which skips React's automatic reset) and resets the form only when the result has no `error` --
 * i.e. exactly the old behaviour on success, and the input preserved on failure. The form keeps its
 * `action={formAction}` too, so it still submits natively before JavaScript has loaded.
 *
 * Usage: `const [state, formAction, pending, onSubmit] = useFormAction(action, initialState);`
 *        `<form action={formAction} onSubmit={onSubmit}>`
 */
export function useFormAction<State>(action: (state: Awaited<State>, payload: FormData) => State | Promise<State>, initialState: Awaited<State>) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement | null>(null);
  const awaitingResult = useRef(false);

  useEffect(() => {
    if (!awaitingResult.current) return;
    awaitingResult.current = false;
    const result = state as { error?: unknown } | null | undefined;
    if (!result?.error) formRef.current?.reset();
  }, [state]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    formRef.current = form;
    awaitingResult.current = true;
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const data = new FormData(form, submitter ?? undefined);
    startTransition(() => formAction(data));
  }

  return [state, formAction, pending, onSubmit] as const;
}
