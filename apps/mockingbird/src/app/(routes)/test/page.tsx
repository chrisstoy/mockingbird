import { TestEditor } from './_components/TestEditor.client';

export default async function TestPage() {
  return (
    <div className="flex flex-col flex-auto">
      <div className="card bg-base-100 shadow-xl m-2 p-4">
        <div className="card-title">Text Editor</div>
        <div className="card-body">
          <TestEditor></TestEditor>
        </div>
        <div className="card-body"></div>
      </div>
    </div>
  );
}
