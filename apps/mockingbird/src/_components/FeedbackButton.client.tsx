'use client';

import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import version from '@/../version.json';

interface Props {
  userName?: string;
  userEmail?: string;
  userId?: string;
}

export function FeedbackButton({ userName, userEmail, userId }: Props) {
  function handleClick() {
    const theme =
      document.documentElement.getAttribute('data-theme') ??
      'unknown';

    const buildDate = new Date(version.buildDate).toUTCString();

    const body = [
      '--- Please write your feedback above this line ---',
      '',
      '=== Diagnostic Information ===',
      '',
      `App Version:  ${version.version}`,
      `Build Date:   ${buildDate}`,
      '',
      '--- User ---',
      `Name:         ${userName ?? 'Not signed in'}`,
      `Email:        ${userEmail ?? 'N/A'}`,
      `User ID:      ${userId ?? 'N/A'}`,
      '',
      '--- Browser & Environment ---',
      `User Agent:   ${navigator.userAgent}`,
      `Language:     ${navigator.language}`,
      `Screen:       ${screen.width}x${screen.height} (${window.devicePixelRatio}x DPR)`,
      `Viewport:     ${window.innerWidth}x${window.innerHeight}`,
      `Theme:        ${theme}`,
      `Platform:     ${navigator.platform ?? 'unknown'}`,
      `Online:       ${navigator.onLine}`,
    ].join('\n');

    const mailto = `mailto:admin@mockingbird.club?subject=${encodeURIComponent('Feedback')}&body=${encodeURIComponent('\n\n' + body)}`;
    window.location.href = mailto;
  }

  return (
    <button
      onClick={handleClick}
      className="relative p-2.5 rounded-full hover:bg-base-200 active:bg-base-300 transition-colors flex items-center justify-center"
      aria-label="Send feedback"
      title="Send feedback"
    >
      <ChatBubbleLeftEllipsisIcon className="w-5.5 h-5.5 text-base-content/55" />
    </button>
  );
}
