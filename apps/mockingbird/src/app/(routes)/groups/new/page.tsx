import { CreateGroupForm } from './_components/CreateGroupForm.client';

export default function NewGroupPage() {
  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-base-content px-1">
        Create a Flock
      </h1>
      <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-6">
        <CreateGroupForm />
      </div>
    </div>
  );
}
