import { getNotificationsWithActorsForUser } from '@/_server/notificationService';
import { sessionUser } from '@/_hooks/sessionUser';
import { UserIdSchema } from '@/_types';
import { BellIcon } from '@heroicons/react/24/outline';
import { redirect } from 'next/navigation';
import { NotificationsList } from './_components/NotificationsList.client';

export default async function NotificationsPage() {
  const user = await sessionUser();
  if (!user) redirect('/auth/signin');

  const userId = UserIdSchema.parse(user.id);
  const notifications = await getNotificationsWithActorsForUser(userId);

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4">
      {/* Page header */}
      <div className="flex items-center gap-3 px-1">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <BellIcon className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-base-content">
          Notifications
        </h1>
      </div>

      <NotificationsList initialNotifications={notifications} />
    </div>
  );
}
