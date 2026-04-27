import { Group } from '@/_types';

type Props = { group: Group; memberCount: number };

export function GroupHeader({ group, memberCount }: Props) {
  return (
    <div className="flex items-start gap-4">
      {group.avatarUrl ? (
        <img
          src={group.avatarUrl}
          alt={group.name}
          className="w-16 h-16 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold flex-shrink-0">
          {group.name[0].toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-extrabold tracking-tight">{group.name}</h1>
          {group.visibility === 'PRIVATE' && (
            <span className="badge badge-neutral badge-sm">Private</span>
          )}
          {group.status === 'DISABLED' && (
            <span className="badge badge-error badge-sm">Disabled</span>
          )}
        </div>
        <p className="text-base-content/50 text-sm mt-0.5">{memberCount} members</p>
        {group.description && (
          <p className="text-base-content/70 mt-2 text-sm">{group.description}</p>
        )}
      </div>
    </div>
  );
}
