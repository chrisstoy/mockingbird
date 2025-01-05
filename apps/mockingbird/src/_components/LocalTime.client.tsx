'use client';
import { toLocalTime } from '@/_apiServices/toLocalTime';
import { useEffect, useState } from 'react';

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
