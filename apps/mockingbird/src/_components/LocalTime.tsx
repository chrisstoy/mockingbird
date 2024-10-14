'use client';

import React, { useEffect, useState } from 'react';

const formatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'short',
  timeStyle: 'short',
});

type Props = {
  date: Date;
};

export function LocalTime({ date }: Props) {
  const [dateString, setDateString] = useState<string>();

  useEffect(() => {
    setDateString(formatter.format(new Date(date)));
  }, [date]);

  return <span>{dateString}</span>;
}
