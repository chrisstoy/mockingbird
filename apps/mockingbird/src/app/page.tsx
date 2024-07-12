'use client';
import styled from '@emotion/styled';

const StyledPage = styled.div`
  .page {
  }
`;

export default function Index() {
  return (
    <StyledPage>
      <div className="wrapper">
        <div className="container">
          <div id="welcome">
            <h1>
              <span> Hello there, </span>
              Welcome To Mockingbird 👋
            </h1>
          </div>
        </div>
      </div>
    </StyledPage>
  );
}
