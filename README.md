# Mockingbird

Join the plagiary! Talk with friends and post your life on social media!

# Server-to-Server Communication in ActivityPub

To implement ActivityPub server-to-server communications (federation), you need to handle several key components:

## 1. HTTP Signatures and Authentication

- Implement HTTP Signatures for authenticating outgoing requests
- Verify HTTP Signatures on incoming requests
- Support for key discovery via actor profiles (publicKey fields)

## 2. Content Delivery

- **Outbound Delivery**:

  - Queue activities for delivery to recipient inboxes
  - Send HTTP POST requests to each recipient's inbox
  - Handle retry logic for failed deliveries
  - Sign all outgoing requests

- **Inbound Receiving**:
  - Accept POST requests to actor inboxes
  - Verify the sender's signature against their publicKey
  - Process and store valid incoming activities

## 3. Actor Discovery

- Implement WebFinger protocol for discovering actors by username
- Support fetching actor profiles via HTTP GET requests
- Cache discovered actor information to reduce network traffic

## 4. Content Processing

- Process incoming activities (Create, Like, Announce, Follow, etc.)
- Update local database state based on received activities
- Handle side effects (notifications, counter updates, etc.)

## 5. Inbox/Outbox Implementation

- Expose actor inbox and outbox endpoints
- Accept GET requests to show collection contents
- Implement pagination for large collections
- Filter content based on permissions

## 6. Security Considerations

- Implement rate limiting to prevent abuse
- Validate incoming JSON data
- Sanitize content to prevent XSS attacks
- Support blocking/filtering mechanisms

## 7. Advanced Features

- Content addressing for attachments (often using ActivityPub extensions)
- Collection synchronization
- Subscription management for Follow activities

The most complex parts are typically the HTTP Signature implementation and managing the asynchronous delivery queue with proper retry logic. Many implementations use background workers to handle deliveries without blocking the main application flow.
