'use client';

import { searchGroups } from '@/_apiServices/groups';
import { Group } from '@/_types';
import { useState } from 'react';
import { GroupCard } from './GroupCard';

type Props = { initialGroups: Group[] };

export function GroupSearch({ initialGroups }: Props) {
  const [groups, setGroups] = useState(initialGroups);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    setLoading(true);
    try {
      const results = await searchGroups(q);
      setGroups(results);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Search Flocks..."
        className="input input-bordered w-full"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {loading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner" />
        </div>
      ) : groups.length === 0 ? (
        <p className="text-center text-base-content/50 py-8">No flocks found.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} />
          ))}
        </div>
      )}
    </div>
  );
}
