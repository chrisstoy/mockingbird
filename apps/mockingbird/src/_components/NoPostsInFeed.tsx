import { TextDisplay } from '@mockingbird/stoyponents';

export function NoPostsInFeed() {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card bg-base-100">
        <div className="card-body">
          <TextDisplay data={'No Posts available in this Feed'}></TextDisplay>
        </div>
      </div>
      <div className="card-actions"></div>
    </div>
  );
}
