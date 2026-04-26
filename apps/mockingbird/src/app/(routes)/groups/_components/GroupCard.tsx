import { Group } from '@/_types';
import Link from 'next/link';

type Props = { group: Group };

export function GroupCard({ group }: Props) {
  return (
    <Link
      href={`/groups/${group.id}`}
      className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="card-body gap-2 p-4">
        <div className="flex items-center gap-3">
          {group.avatarUrl ? (
            <img
              src={group.avatarUrl}
              alt={group.name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
              {group.name[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{group.name}</h3>
            {group.visibility === 'PRIVATE' && (
              <span className="badge badge-xs badge-neutral">Private</span>
            )}
          </div>
        </div>
        {group.description && (
          <p className="text-sm text-base-content/60 line-clamp-2">{group.description}</p>
        )}
      </div>
    </Link>
  );
}
