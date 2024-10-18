'use client';

import React, { useEffect, useState } from 'react';
import { toLocalTime } from '@/_services/toLocalTime';

type Props = {
  date: Date;
};

export function LocalTime({ date }: Props) {
  const [dateString, setDateString] = useState<string>();

  useEffect(() => {
    setDateString(toLocalTime(date));
  }, [date]);

  return <span>{dateString}</span>;
}
